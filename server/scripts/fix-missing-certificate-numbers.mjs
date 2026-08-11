#!/usr/bin/env node
// ============================================================
// 给缺少 certificate_no 的活跃质保记录补发证书编号
// 用法: HAMOREY_ENV_FILE=/etc/hamorey/api.env node scripts/fix-missing-certificate-numbers.mjs [--apply]
// 默认 dry-run 只打印；加 --apply 才写库
// ============================================================
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

const APPLY = process.argv.includes('--apply');
const envFile = process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env';
const env = {};
for (const line of readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const db = await mysql.createPool({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT),
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  decimalNumbers: true,
  timezone: 'Z',
});

function genCertNo() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  return `HM-${y}${mo}-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

try {
  const [rows] = await db.query(
    `SELECT id, installation_date, product_model_id, certificate_no
       FROM warranty_records
      WHERE status = 'active' AND (certificate_no IS NULL OR certificate_no = '')
      ORDER BY installation_date`,
  );
  console.log(`待补证书号记录: ${rows.length} 条`);
  if (rows.length === 0) {
    console.log('无需处理');
    process.exit(0);
  }

  // 生成证书号（避免与现有冲突）
  const existing = new Set();
  const [cur] = await db.query(`SELECT certificate_no FROM warranty_records WHERE certificate_no IS NOT NULL`);
  for (const r of cur) existing.add(r.certificate_no);

  let assigned = 0;
  for (const r of rows) {
    let certNo = genCertNo();
    while (existing.has(certNo)) certNo = genCertNo();
    existing.add(certNo);
    console.log(`${APPLY ? '[APPLY]' : '[DRY]  '} ${r.id.slice(0, 24)}... 施工日期 ${String(r.installation_date).slice(0, 10)} -> ${certNo}`);
    if (APPLY) {
      await db.query(
        `UPDATE warranty_records SET certificate_no = ? WHERE id = ? AND (certificate_no IS NULL OR certificate_no = '')`,
        [certNo, r.id],
      );
    }
    assigned++;
  }

  console.log(`\n${APPLY ? '已补发' : 'DRY-RUN 预览'} ${assigned} 个证书编号`);
  if (!APPLY) console.log('\n确认无误后加 --apply 正式写入');
  await db.end();
} catch (e) {
  console.error('执行失败:', e.message || e);
  await db.end();
  process.exit(1);
}
