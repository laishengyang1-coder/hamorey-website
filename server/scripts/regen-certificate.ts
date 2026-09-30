// ============================================================
// regen-certificate.ts — 质保证书长图(PNG)「重新生成」工具
//
// 用途：某条质保记录的证书 PNG 已按旧数据生成（例如车主姓名后来被更正），
//       需要按当前数据库数据把这张证书重出一遍。属于「更正」而非「重新签发」，
//       因此默认沿用原证书的生成日期，不把签发日期改成今天。
//
// 生成配方与 functions/api/admin/reviews-[id].ts（审核通过那一刻）以及
// server/src/auto-approve.ts 完全一致，复用同一套模块：
//   - server/src/cloudflare-env.ts  → env.DB(D1 shim over MySQL) / env.R2(COS shim)
//   - functions/api/_certificate.ts → createCertificateImage（SVG→PNG，含印章+部位价值表）
//   - functions/api/_seal.ts        → getCertificateSeal
//
// 写回方式：
//   - 对象 key 原地覆盖 certificates/<证书号>.png（保证既有链接不失效）
//   - 覆盖前先把原对象备份到 certificates/backup/<证书号>.<原生成时间戳>.png
//   - 在 certificate_files 插入一条 version = 当前最大 version + 1 的新行作为留痕
//     （允许同一 file_key 对应多行，公开下载接口取 version 最大的一行）
//
// 该脚本不写 warranty_records / warranty_codes / points_ledger，也不依赖线上服务，
// 因此不需要重启 API / pm2 restart。
//
// 构建（在 /opt/hamorey/apps/api 下）：
//   node_modules/.bin/esbuild scripts/regen-certificate.ts --bundle --platform=node \
//     --format=esm --target=node22 --outfile=scripts/regen-certificate.mjs --packages=external
//
// 用法：
//   set -a; . /etc/hamorey/api.env; set +a
//   node /opt/hamorey/scripts/regen-certificate.mjs --cert-no=HM-202609-EF1BB3BD [--dry-run]
//   node ... --cert-no=HM-202609-EF1BB3BD --issue-date=2026-09-29
// ============================================================

import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

// ---------- 1. 载入运维 env（只补齐缺失键；绝不打印任何值/密钥） ----------
function loadEnvFile(): void {
  const file = process.env.API_ENV_FILE || '/etc/hamorey/api.env';
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    // 允许调用方已用 `set -a; . api.env; set +a` 注入环境变量
    return;
  }
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    if (process.env[key] !== undefined) continue;
    process.env[key] = m[2].replace(/^["']|["']$/g, '');
  }
}
// 必须先于 cloudflare-env 载入 env；故 env 依赖的模块全部用动态 import 延后。
loadEnvFile();

const USAGE = [
  '用法：regen-certificate.mjs --cert-no=<证书号> [--dry-run] [--issue-date=YYYY-MM-DD]',
  '',
  '  --cert-no=<证书号>       必填。唯一键，例如 HM-202609-EF1BB3BD',
  '  --dry-run                只打印将要重出的字段，不写任何东西（含对象存储与数据库）',
  '  --issue-date=YYYY-MM-DD  显式指定签发日期；默认沿用该证书「原本的生成日期」',
  '                           （取 certificate_files 最早一行的 created_at 日期，属更正语义）',
  '',
  '示例：',
  '  set -a; . /etc/hamorey/api.env; set +a',
  '  node /opt/hamorey/scripts/regen-certificate.mjs --cert-no=HM-202609-EF1BB3BD --dry-run',
].join('\n');

interface Args {
  certNo: string;
  dryRun: boolean;
  issueDate?: string;
}

function parseArgs(argv: string[]): Args | null {
  const positional = argv.slice(2);
  let certNo = '';
  let dryRun = false;
  let issueDate: string | undefined;

  for (let i = 0; i < positional.length; i += 1) {
    const arg = positional[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--cert-no=')) {
      certNo = arg.slice('--cert-no='.length).trim();
    } else if (arg === '--cert-no') {
      certNo = (positional[++i] || '').trim();
    } else if (arg.startsWith('--issue-date=')) {
      issueDate = arg.slice('--issue-date='.length).trim();
    } else if (arg === '--issue-date') {
      issueDate = (positional[++i] || '').trim();
    } else if (arg === '-h' || arg === '--help') {
      return null;
    } else {
      console.error(`未知参数：${arg}`);
      return null;
    }
  }

  if (!certNo) return null;
  if (issueDate && !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    console.error(`--issue-date 需为 YYYY-MM-DD 格式，收到：${issueDate}`);
    return null;
  }
  return { certNo, dryRun, issueDate };
}

interface WarrantyRecordRow {
  id: string;
  certificate_no: string;
  customer_name_snapshot: string;
  plate_no_snapshot: string | null;
  vin_snapshot: string | null;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  product_name_snapshot: string;
  product_model_snapshot: string;
  store_name_snapshot: string;
  installation_date: string;
  warranty_expiry_date: string | null;
  warranty_years_snapshot: number;
  warranty_code_id: string;
  product_model_id: string;
}

interface CertFileRow {
  version: number;
  date_str: string; // YYYY-MM-DD（MySQL 直接格式化，避免时区漂移）
  ts_str: string;   // YYYYMMDDHHmmss
}

// 与证书模板同款日期格式化（取 Node 进程本地时区，保证 dry-run 展示与图片一致）
function fmtDate(value: unknown): string {
  if (value == null) return '-';
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args) {
    console.error(USAGE);
    process.exit(2);
  }

  // 动态 import：确保上面 loadEnvFile() 已执行，env.ts 的 zod 校验才能通过。
  const { apiEnv } = (await import('../src/cloudflare-env.js')) as {
    apiEnv: Record<string, any>;
  };
  const { pool } = (await import('../src/db.js')) as { pool: { end: () => Promise<void> } };
  const { createCertificateImage } = (await import('../../functions/api/_certificate.ts')) as {
    createCertificateImage: (data: any, seal?: Uint8Array | null) => Promise<Uint8Array>;
  };
  const { getCertificateSeal } = (await import('../../functions/api/_seal.ts')) as {
    getCertificateSeal: () => Promise<Uint8Array | null>;
  };

  // 单例连接池会让进程无法自然退出，结束时显式关闭。
  const shutdown = async (): Promise<void> => {
    try { await pool.end(); } catch { /* ignore */ }
  };

  const DB = apiEnv.DB as any;
  const R2 = apiEnv.R2 as any;

  const { certNo, dryRun, issueDate: issueDateOverride } = args;
  const fileKey = `certificates/${certNo}.png`;

  // ---------- 查记录（按当前数据库数据） ----------
  const record = (await DB.prepare(
    `SELECT id, certificate_no, customer_name_snapshot, plate_no_snapshot, vin_snapshot,
            vehicle_brand_snapshot, vehicle_model_snapshot, product_name_snapshot,
            product_model_snapshot, store_name_snapshot, installation_date,
            warranty_expiry_date, warranty_years_snapshot, warranty_code_id, product_model_id
     FROM warranty_records WHERE certificate_no = ? LIMIT 1`,
  ).bind(certNo).first()) as WarrantyRecordRow | null;

  if (!record) {
    console.error(`错误：未找到证书号为 ${certNo} 的质保记录（warranty_records 无此 certificate_no）。`);
    process.exit(1);
  }

  // ---------- 查历史证书文件行（用 MySQL 直接格式化日期，规避时区漂移） ----------
  const certRows = (await DB.prepare(
    `SELECT version, DATE_FORMAT(created_at, '%Y-%m-%d') AS date_str,
            DATE_FORMAT(created_at, '%Y%m%d%H%i%s') AS ts_str
     FROM certificate_files WHERE warranty_record_id = ? ORDER BY version ASC, created_at ASC`,
  ).bind(record.id).all()).results as CertFileRow[];

  const originalRow = certRows[0] ?? null;                    // 最早一行 = 原始生成
  const currentRow = certRows[certRows.length - 1] ?? null;   // 最新一行 = 当前对象
  const maxVersion = currentRow ? Number(currentRow.version) : 0;
  const newVersion = maxVersion + 1;

  const today = new Date().toISOString().slice(0, 10);
  const issueDate = issueDateOverride
    ?? originalRow?.date_str
    ?? today;
  const issueDateSource = issueDateOverride
    ? '--issue-date 显式指定'
    : (originalRow ? `沿用原生成日期 · certificate_files v${originalRow.version}.created_at` : '无历史行，回退为今天');

  // 备份命名用「当前对象」的生成时间戳，避免二次重出时覆盖掉最初的备份。
  const backupTs = currentRow?.ts_str ?? today.replace(/-/g, '') + '000000';
  const backupKey = `certificates/backup/${certNo}.${backupTs}.png`;

  // ---------- 组装证书数据（与审核通过时一致） ----------
  const codeAndPrice = (await DB.prepare(
    `SELECT wc.code, pm.warranty_price_cents FROM warranty_codes wc, product_models pm
     WHERE wc.id = ? AND pm.id = ?`,
  ).bind(record.warranty_code_id, record.product_model_id).first()) as
    { code: string; warranty_price_cents: number | null } | null;

  const partPriceRows = (await DB.prepare(
    `SELECT cp.name, cli.price_cents FROM claim_prices cli JOIN claim_parts cp ON cp.id = cli.claim_part_id
     WHERE cli.product_model_id = ? AND cli.status = 'active' ORDER BY cp.category, cp.sort_order`,
  ).bind(record.product_model_id).all()).results as Array<{ name: string; price_cents: number }>;

  const partPrices = partPriceRows.map((r) => ({ name: r.name, priceCents: r.price_cents }));

  const data = {
    certificateNo: certNo,
    customerName: record.customer_name_snapshot,
    plateNo: record.plate_no_snapshot || '临时车牌',
    vin: record.vin_snapshot || '-',
    vehicleBrand: record.vehicle_brand_snapshot,
    vehicleModel: record.vehicle_model_snapshot,
    productName: record.product_name_snapshot,
    productModel: record.product_model_snapshot,
    storeName: record.store_name_snapshot,
    installationDate: record.installation_date,
    expiryDate: record.warranty_expiry_date,
    warrantyYears: record.warranty_years_snapshot,
    issueDate,
    warrantyCode: codeAndPrice?.code,
    warrantyPriceCents: codeAndPrice?.warranty_price_cents,
    partPrices,
  };

  // ---------- dry-run：只打印，不写 ----------
  if (dryRun) {
    console.log('===== DRY-RUN（不写任何东西）=====');
    console.log(`证书号      : ${certNo}`);
    console.log(`记录 id     : ${record.id}`);
    console.log(`车主姓名    : ${data.customerName}`);
    console.log(`车膜卷号    : ${data.warrantyCode ?? '-'}`);
    console.log(`品牌车型    : ${data.vehicleBrand} ${data.vehicleModel}`);
    console.log(`车架号      : ${data.vin}`);
    console.log(`质保期限    : ${data.warrantyYears} 年（${fmtDate(data.installationDate)} 至 ${fmtDate(data.expiryDate)}）`);
    console.log(`质保录入单位: ${data.storeName}`);
    console.log(`部位价值条数: ${partPrices.length}`);
    console.log(`签发日期    : ${issueDate}  [${issueDateSource}]`);
    console.log(`对象 key    : ${fileKey}（原地覆盖）`);
    console.log(`备份 key    : ${backupKey}`);
    console.log(`当前版本    : ${maxVersion} → 新版本 ${newVersion}`);
    console.log('=================================');
    console.log('dry-run 结束：未写入对象存储，未写入数据库。');
    await shutdown();
    return;
  }

  // ---------- 备份原对象 ----------
  const existing = await R2.get(fileKey);
  if (existing) {
    await R2.put(backupKey, existing.body, {
      httpMetadata: { contentType: existing.httpMetadata?.contentType || 'image/png' },
    });
    console.log(`已备份原证书 → ${backupKey}`);
  } else {
    console.log(`提示：对象 ${fileKey} 当前不存在，跳过备份（本次将首次生成）。`);
  }

  // ---------- 生成 PNG（复用线上同款配方） ----------
  const seal = await getCertificateSeal();
  if (!seal) console.warn('警告：未加载到印章（/opt/hamorey/assets/seal.jpg），证书将降级为无印章。');

  const png = await createCertificateImage(data, seal);

  // ---------- 原地覆盖上传 ----------
  await R2.put(fileKey, png, { httpMetadata: { contentType: 'image/png' } });
  console.log(`已重出并上传 → ${fileKey}（${png.length} 字节）`);

  // ---------- 插入留痕行（version = 最大 version + 1） ----------
  await DB.prepare(
    `INSERT INTO certificate_files (id, warranty_record_id, file_key, file_url, version, generated_by, created_at)
     VALUES (?, ?, ?, NULL, ?, NULL, datetime('now'))`,
  ).bind(randomUUID(), record.id, fileKey, newVersion).run();
  console.log(`已写入 certificate_files：version=${newVersion}，file_key=${fileKey}`);

  console.log('');
  console.log('完成：');
  console.log(`  证书号    : ${certNo}`);
  console.log(`  车主姓名  : ${data.customerName}`);
  console.log(`  签发日期  : ${issueDate}（${issueDateSource}）`);
  console.log(`  对象 key  : ${fileKey}`);
  console.log(`  备份 key  : ${backupKey}`);
  console.log(`  新版本号  : ${newVersion}`);
  console.log('  未改动 warranty_records / warranty_codes / points_ledger，无需重启 API。');
  await shutdown();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('脚本异常：', err instanceof Error ? err.message : err);
    process.exit(1);
  });
