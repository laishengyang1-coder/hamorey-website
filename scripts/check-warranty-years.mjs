#!/usr/bin/env node
/**
 * ============================================================================
 * 质保年限自动校验（防漂移）
 * ============================================================================
 *
 * 背景：产品「质保年限」的唯一权威来源是数据库 product_models.warranty_years
 * （后台产品管理写入）。官网 / 小程序里有若干硬编码副本，历史上反复漂移。
 * 本脚本把「代码里的硬编码年限」与一份入库的权威快照 lock 文件逐项比对，
 * 不一致就让构建失败，从而杜绝静默漂移。
 *
 * 为什么用「lock 快照 + 构建期比对」而不是让构建直接查库：
 *   构建跑在 GitHub Actions，那里连不上生产库（TDSQL-C 是内网 Vip 172.16.0.5），
 *   所以构建期不能查库。取而代之：把库的权威值固化成入库文件
 *   scripts/warranty-years.lock.json，构建期只做纯本地比对。
 *
 * ---------------------------------------------------------------------------
 * 三种模式（决定什么时候跑哪个）
 * ---------------------------------------------------------------------------
 *
 *   node scripts/check-warranty-years.mjs
 *       默认 = 构建期校验。解析代码里三处硬编码年限，与 lock 逐项比对。
 *       一致 → 打印一行摘要 + exit 0；不一致 → 打印对照表 + exit 1。
 *       该模式**不联网、不查库**，已接入 `npm run build`，在 CI 自动执行。
 *
 *   node scripts/check-warranty-years.mjs --check-db
 *       巡检：把 lock 与**真实数据库**比对，用于发现「有人改了库但没更新
 *       lock / 代码」。需要能连库：本机默认通过 `ssh hamorey` 取
 *       /etc/hamorey/api.env 里的 MYSQL_* 后执行只读 SELECT；若当前环境已
 *       导出 MYSQL_*（如已 ssh 进服务器），则直接用本机 mysql 客户端。
 *       一致 → exit 0；有差异 → 列出差异 + exit 1。只读，绝不写库。
 *
 *   node scripts/check-warranty-years.mjs --update-lock
 *       从真实数据库重新生成 scripts/warranty-years.lock.json。
 *       在能连库的机器上执行。只读，绝不写库。
 *
 * ---------------------------------------------------------------------------
 * 发现不一致时的修正顺序
 * ---------------------------------------------------------------------------
 *   1) 先去后台产品管理把数据库 product_models 改成正确的值；
 *   2) 在能连库的机器上跑 `--update-lock` 刷新 lock；
 *   3) 同步修改代码里的三处硬编码（见下方「覆盖来源」）；
 *   4) 提交 lock + 代码。再次 `npm run build` 应通过。
 *
 * ---------------------------------------------------------------------------
 * 覆盖的三处硬编码来源
 * ---------------------------------------------------------------------------
 *   ① src/config/windowFilm.ts  的 WINDOW_FILM_MODELS
 *        每条自带 modelCode，直接按 model_code 对应 DB。
 *   ② src/config/products.ts    的 productCategories[].series[]
 *        系列级，需显式映射（见 PRODUCTS_SERIES_MAP 注释）。
 *   ③ miniprogram/pages/owner/product/index.js 的 SERIES_LIST
 *        需按「系列 key + 产品名」映射（见 MINIPROGRAM_MAP 注释，含重名坑）。
 *
 * ---------------------------------------------------------------------------
 * 为什么用 esbuild + vm，而不是正则盲抓
 * ---------------------------------------------------------------------------
 * 这三处都是 TS/JS 源文件。用正则去「抓」warrantyYears 数字极不可靠：
 * 多行注释、字符串、同名不同字段、条件表达式都会误判，真实值也可能被漏掉。
 * 因此这里用 esbuild 把源文件转成 CommonJS（丢掉类型、保住真实字面量），
 * 再在 vm 沙箱里**真正执行**，直接读取导出的数组真值 —— 拿到的就是运行期
 * 真实的值，不会因排版/注释改变而误判。esbuild 是仓库既有依赖（vite 传递依赖）。
 * 行号仅用于报错定位，才用文本查找，不参与取值。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOCK_PATH = join(__dirname, 'warranty-years.lock.json');

const WINDOW_FILM_FILE = 'src/config/windowFilm.ts';
const PRODUCTS_FILE = 'src/config/products.ts';
const MINI_FILE = 'miniprogram/pages/owner/product/index.js';

// ===========================================================================
// ② products.ts 系列级映射：series.code → DB model_code（一个或多个）
// ===========================================================================
// 规则：一个系列映射到多个 DB 型号时（hw、hx），取该系列所有 **active** 型号
//       的质保年限 **最大值**，与代码里系列级 warrantyYears 比对。
// 映射依据（业务方确认）：
//   hy8 → HY8
//   hw  → HW8 / HW9
//   hx  → HX8 / HX9
//   hym → YM-8
//   t1  → T1
//   t2  → T2
const PRODUCTS_SERIES_MAP = {
  hy8: ['HY8'],
  hw: ['HW8', 'HW9'],
  hx: ['HX8', 'HX9'],
  hym: ['YM-8'],
  t1: ['T1'],
  t2: ['T2'],
};

// ===========================================================================
// ③ 小程序 SERIES_LIST 映射表（原样保留，便于复核）
// ===========================================================================
// key = `${series.key}::${product.name}`（用「系列 key + 产品名」定位）
// value = 对应的 DB model_code（一个或多个；多个时取 active 最大值，同 ②）
//
// ⚠️ 重名坑：window 系列的「和真」code 写成 'HZ'，ppf 系列的「和尊」code 也是
//    'HZ'，二者 code 字符串相同（既有命名问题）。**必须用产品名区分**：
//      和真（窗膜）→ WF-HZ75 / WF-HZ35 / WF-HZ15
//      和尊（车衣）→ HZ
//    下方表即按产品名逐一建立，不与 code 直接等同。
const MINIPROGRAM_MAP = {
  // --- 窗膜 window ---
  'window::和光': ['WF-HG70', 'WF-HG25'],
  'window::和盾': ['WF-HD70', 'WF-HD35', 'WF-HD10'],
  'window::和护': ['WF-HH70', 'WF-HH35', 'WF-HH15'],
  'window::和真': ['WF-HZ75', 'WF-HZ35', 'WF-HZ15'],
  'window::和原': ['WF-HY75', 'WF-HY35', 'WF-HY10'],
  'window::冷光紫': ['PRF-LGZ'],
  'window::苍穹青': ['PRF-CQY'],
  // --- 隐形车衣 ppf ---
  'ppf::和兴 HX8': ['HX8'],
  'ppf::和兴 HX9': ['HX9'],
  'ppf::和旺 HW8': ['HW8'],
  'ppf::和旺 HW9': ['HW9'],
  'ppf::和御 HY8': ['HY8'],
  'ppf::和雅 HYM': ['YM-8'],
  'ppf::和尊 HZ': ['HZ'],
  'ppf::和鼎 HD': ['HD'],
  // --- TPU 改色膜 color ---
  'color::和彩 QCCY': ['QCCY'],
  // --- 天窗冰甲 roof ---
  'roof::天窗冰甲 T1': ['T1'],
  'roof::天窗冰甲 T2': ['T2'],
};

// ===========================================================================
// 源文件加载：esbuild → CommonJS → vm 沙箱执行 → 取导出真值
// ===========================================================================
function loadModuleExports(relPath, { loader, extraExport } = {}) {
  const abs = join(ROOT, relPath);
  let source = readFileSync(abs, 'utf8');
  // 小程序文件没有 export，追加一行把它暴露到 module.exports
  if (extraExport) source += `\nmodule.exports.__value__ = ${extraExport};\n`;

  const { code } = esbuild.transformSync(source, {
    loader: loader || 'ts',
    format: 'cjs',
    target: 'es2020',
  });

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: () => ({}), // 仅为了不让 import 资源 / utils 报错；其值不参与校验
    Page: () => {},
    App: () => {},
    Component: () => {},
    wx: {},
    console,
  };
  vm.runInNewContext(code, sandbox);
  return module.exports;
}

// 仅用于报错定位：在源文本里找第一处包含 needle 的行号（1-based）
function lineOf(relPath, needle) {
  const lines = readFileSync(join(ROOT, relPath), 'utf8').split('\n');
  const idx = lines.findIndex((l) => l.includes(needle));
  return idx === -1 ? null : idx + 1;
}

// ===========================================================================
// 解析三处硬编码来源，得到统一的比对清单
// ===========================================================================
function collectHardcodedChecks() {
  const checks = [];
  const errors = [];

  // ① windowFilm.ts —— 直接按 model_code
  for (const m of loadModuleExports(WINDOW_FILM_FILE).WINDOW_FILM_MODELS) {
    checks.push({
      category: 'windowFilm',
      label: `${m.modelName} (${m.modelCode})`,
      origin: `${WINDOW_FILM_FILE}:${lineOf(WINDOW_FILM_FILE, `modelCode: '${m.modelCode}'`)}`,
      codeValue: m.warrantyYears,
      models: [m.modelCode],
    });
  }

  // ② products.ts —— 系列级显式映射
  for (const cat of loadModuleExports(PRODUCTS_FILE).productCategories) {
    for (const s of cat.series) {
      const models = PRODUCTS_SERIES_MAP[s.code];
      if (!models) {
        errors.push(`[映射缺失] products.ts 系列 code='${s.code}' 未在 PRODUCTS_SERIES_MAP 中定义`);
        continue;
      }
      checks.push({
        category: 'products',
        label: `${cat.category}/${s.code} (${s.nameCn})`,
        origin: `${PRODUCTS_FILE}:${lineOf(PRODUCTS_FILE, `code: '${s.code}'`)}`,
        codeValue: s.warrantyYears,
        models,
      });
    }
  }

  // ③ 小程序 SERIES_LIST —— 系列 key + 产品名 映射
  const seriesList = loadModuleExports(MINI_FILE, {
    loader: 'js',
    extraExport: 'SERIES_LIST',
  }).__value__;
  for (const series of seriesList) {
    for (const p of series.products) {
      const key = `${series.key}::${p.name}`;
      const models = MINIPROGRAM_MAP[key];
      if (!models) {
        errors.push(`[映射缺失] 小程序 ${key} 未在 MINIPROGRAM_MAP 中定义`);
        continue;
      }
      checks.push({
        category: 'miniprogram',
        label: `${series.key}/${p.name} (code=${p.code})`,
        origin: `${MINI_FILE}:${lineOf(MINI_FILE, `name: '${p.name}'`)}`,
        codeValue: p.warranty,
        models,
      });
    }
  }

  return { checks, errors };
}

// ===========================================================================
// lock 读写
// ===========================================================================
function readLock() {
  if (!existsSync(LOCK_PATH)) {
    console.error(
      `未找到 lock 文件：${LOCK_PATH}\n` +
        `这是入库文件，应由 \`node scripts/check-warranty-years.mjs --update-lock\` 从生产库生成后提交。`,
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
}

function indexLock(lock) {
  const map = new Map();
  for (const m of lock.models) map.set(m.model_code, m);
  return map;
}

// 依据映射到的 DB 型号集合，算出「期望值」= 所有 active 型号的最大年限
function expectedFromLock(models, lockIndex) {
  const found = models.map((code) => lockIndex.get(code));
  const missing = models.filter((code) => !lockIndex.has(code));
  if (missing.length > 0) return { error: `lock 中不存在型号：${missing.join(', ')}` };
  const active = found.filter((m) => m.status === 'active');
  if (active.length === 0) {
    return { error: `型号 ${models.join(', ')} 在 lock 中均非 active，无法取期望值` };
  }
  return { value: Math.max(...active.map((m) => Number(m.warranty_years))) };
}

// ===========================================================================
// 数据库访问（只读）：本机 MYSQL_* 直连，否则走 ssh hamorey
// ===========================================================================
const DB_SQL = 'SELECT model_code, warranty_years, status FROM product_models ORDER BY model_code;';

function fetchDbModels() {
  const env = process.env;
  let output;
  if (env.MYSQL_HOST) {
    // 当前环境已具备 MYSQL_*（例如已 ssh 进服务器），直接连库
    output = execFileSync(
      'mysql',
      [
        '-h', env.MYSQL_HOST,
        '-P', env.MYSQL_PORT || '3306',
        '-u', env.MYSQL_USER,
        `-p${env.MYSQL_PASSWORD}`,
        env.MYSQL_DATABASE,
        '--batch', '--raw', '-e', DB_SQL,
      ],
      { encoding: 'utf8' },
    );
  } else {
    // 本机：通过 ssh 到服务器，载入 /etc/hamorey/api.env 后执行只读 SELECT
    const sshHost = env.HAMOREY_SSH_HOST || 'hamorey';
    const remote =
      `set -a; . /etc/hamorey/api.env; set +a; ` +
      `mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" ` +
      `"$MYSQL_DATABASE" --batch --raw -e '${DB_SQL}'`;
    output = execFileSync('ssh', [sshHost, remote], { encoding: 'utf8' });
  }

  // 过滤 mysql 的密码告警行，解析 --batch 的 TSV
  const lines = output
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l && !/^mysql: \[Warning\]/.test(l));
  const header = lines.shift();
  if (header !== 'model_code\twarranty_years\tstatus') {
    throw new Error(`数据库返回格式异常，首行为：${JSON.stringify(header)}`);
  }
  return lines.map((line) => {
    const [model_code, warranty_years, status] = line.split('\t');
    return {
      model_code,
      warranty_years: warranty_years === 'NULL' ? null : Number(warranty_years),
      status,
    };
  });
}

// ===========================================================================
// 模式一：默认（构建期校验）
// ===========================================================================
function runCheck() {
  const lock = readLock();
  const lockIndex = indexLock(lock);
  const { checks, errors } = collectHardcodedChecks();

  const mismatches = [];
  const hardErrors = [...errors];

  for (const c of checks) {
    const expected = expectedFromLock(c.models, lockIndex);
    if (expected.error) {
      hardErrors.push(`[${c.category}] ${c.label}：${expected.error}`);
      continue;
    }
    if (Number(c.codeValue) !== expected.value) {
      mismatches.push({ ...c, expected: expected.value });
    }
  }

  if (hardErrors.length > 0) {
    console.error('质保年限校验失败（映射/数据问题）：');
    for (const e of hardErrors) console.error(`  - ${e}`);
    process.exit(1);
  }

  if (mismatches.length > 0) {
    console.error('质保年限不一致（代码现值 vs lock 权威值）：\n');
    console.error(padEnd('来源', 44) + padEnd('代码现值', 10) + 'lock 值');
    console.error('-'.repeat(64));
    for (const m of mismatches) {
      console.error(padEnd(m.origin, 44) + padEnd(String(m.codeValue), 10) + String(m.expected));
    }
    console.error(
      '\n共 ' +
        mismatches.length +
        ' 处不一致。修正顺序：先去后台改库 → 跑 --update-lock 刷新 lock → 同步改代码 → 提交。',
    );
    process.exit(1);
  }

  const byCat = { windowFilm: 0, products: 0, miniprogram: 0 };
  for (const c of checks) byCat[c.category]++;
  console.log(
    `质保年限校验通过：共 ${checks.length} 项与 lock 一致` +
      `（windowFilm ${byCat.windowFilm} + products ${byCat.products} + miniprogram ${byCat.miniprogram}；` +
      `lock 生成于 ${lock.generated_at}，含 ${lock.models.length} 个型号）。`,
  );
}

function padEnd(s, n) {
  s = String(s);
  // 中文按 2 列宽估算，保证表格大致对齐
  let width = 0;
  for (const ch of s) width += /[\u4e00-\u9fff]/.test(ch) ? 2 : 1;
  if (width >= n) return s + ' ';
  return s + ' '.repeat(n - width);
}

// ===========================================================================
// 模式二：--check-db   把 lock 与真实数据库比对
// ===========================================================================
function runCheckDb() {
  const lock = readLock();
  const lockIndex = indexLock(lock);
  const db = fetchDbModels();
  const dbIndex = new Map(db.map((m) => [m.model_code, m]));

  const diffs = [];
  for (const m of db) {
    const l = lockIndex.get(m.model_code);
    if (!l) {
      diffs.push(`${m.model_code}: lock 中缺失（库中为 ${fmt(m)}）`);
    } else if (Number(l.warranty_years) !== Number(m.warranty_years) || l.status !== m.status) {
      diffs.push(`${m.model_code}: lock=${fmt(l)}  库=${fmt(m)}`);
    }
  }
  for (const l of lock.models) {
    if (!dbIndex.has(l.model_code)) diffs.push(`${l.model_code}: 库中已不存在（lock 中为 ${fmt(l)}）`);
  }

  if (diffs.length > 0) {
    console.error('lock 与真实数据库不一致：\n');
    for (const d of diffs) console.error(`  - ${d}`);
    console.error('\n说明有人改了库但没更新 lock / 代码。请按修正顺序处理后再提交。');
    process.exit(1);
  }
  console.log(`lock 与真实数据库一致：${db.length} 个型号全部匹配。`);
}

function fmt(m) {
  return `warranty_years=${m.warranty_years}, status=${m.status}`;
}

// ===========================================================================
// 模式三：--update-lock   从真实数据库重新生成 lock
// ===========================================================================
function runUpdateLock() {
  const db = fetchDbModels();
  const lock = {
    generated_at: new Date().toISOString(),
    source:
      'production TDSQL-C hamorey.product_models.warranty_years ' +
      '(read-only SELECT; fetched via `ssh hamorey` mysql client)',
    model_count: db.length,
    models: db.map((m) => ({
      model_code: m.model_code,
      warranty_years: m.warranty_years,
      status: m.status,
    })),
  };
  writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
  console.log(`已从生产库生成 ${LOCK_PATH}：${db.length} 个型号，generated_at=${lock.generated_at}`);
}

// ===========================================================================
// 入口
// ===========================================================================
const arg = process.argv[2];
switch (arg) {
  case undefined:
  case '':
    runCheck();
    break;
  case '--check-db':
    runCheckDb();
    break;
  case '--update-lock':
    runUpdateLock();
    break;
  default:
    console.error(`未知参数：${arg}\n可用：--check-db | --update-lock（无参数=构建期校验）`);
    process.exit(2);
}
