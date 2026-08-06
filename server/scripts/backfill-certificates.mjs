// ============================================================
// backfill-certificates.mjs — 历史质保证书长图(PNG)批量生成
// 为 active 且已有 certificate_no 的质保生成 PNG 长图并上传 COS、写入 certificate_files。
// 模板复用 functions/api/_certificate.ts（SVG→PNG，含印章+部位价值表）。
// 用法: node --experimental-strip-types backfill-certificates.mjs [--dry-run] [--force] [--cert=证书号A,证书号B]
//   --force: 重新生成全部（覆盖已有）
//   --cert=xxx,yyy: 只重新生成指定证书号（可逗号分隔多个），强制覆盖
// ============================================================

import fs from 'node:fs';
import mysql from 'mysql2/promise';
import COS from 'cos-nodejs-sdk-v5';
import { createCertificateImage } from '../../functions/api/_certificate.ts';
import { getCertificateSeal } from '../../functions/api/_seal.ts';

// ---- 读取 /etc/hamorey/api.env ----
const envFile = process.env.API_ENV_FILE || '/etc/hamorey/api.env';
const env = {};
for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const certArg = process.argv.find((a) => a.startsWith('--cert='));
const CERT_FILTER = certArg ? certArg.slice(7).split(',').map((s) => s.trim()).filter(Boolean) : [];

async function main() {
  const db = await mysql.createConnection({
    host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT), user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE, timezone: '+08:00',
  });
  const cos = new COS({ SecretId: env.COS_SECRET_ID, SecretKey: env.COS_SECRET_KEY });
  const seal = await getCertificateSeal();

  const certFilterSql = CERT_FILTER.length > 0
    ? ` AND wr.certificate_no IN (${CERT_FILTER.map(() => '?').join(',')})`
    : '';
  const baseSelect = `SELECT wr.id, wr.certificate_no, wr.customer_name_snapshot, wr.plate_no_snapshot, wr.vin_snapshot,
              wr.vehicle_brand_snapshot, wr.vehicle_model_snapshot, wr.product_name_snapshot, wr.product_model_snapshot,
              wr.store_name_snapshot, wr.installation_date, wr.warranty_expiry_date, wr.warranty_years_snapshot,
              wr.warranty_code_id, wr.product_model_id,
              wc.code AS warranty_code, pm.warranty_price_cents
       FROM warranty_records wr
       LEFT JOIN warranty_codes wc ON wc.id = wr.warranty_code_id
       LEFT JOIN product_models pm ON pm.id = wr.product_model_id`;
  const sql = FORCE || CERT_FILTER.length > 0
    ? `${baseSelect} WHERE wr.status = 'active' AND wr.certificate_no IS NOT NULL AND wr.certificate_no <> ''${certFilterSql}`
    : `${baseSelect} LEFT JOIN certificate_files cf ON cf.warranty_record_id = wr.id
       WHERE wr.status = 'active' AND wr.certificate_no IS NOT NULL AND wr.certificate_no <> '' AND cf.id IS NULL`;

  const [rows] = await db.query(sql, CERT_FILTER.length > 0 ? CERT_FILTER : []);
  console.log(`待${FORCE || CERT_FILTER.length > 0 ? '重新生成' : '补'}证书长图: ${rows.length} 条${DRY_RUN ? '（dry-run 仅预览）' : ''}（印章: ${seal ? '已加载' : '无'}）`);

  let ok = 0, fail = 0;
  const failedList = [];
  for (const r of rows) {
    const certNo = r.certificate_no.trim();
    const key = `certificates/${certNo}.png`;
    try {
      // 查部位价值参考
      const [ppRows] = await db.query(
        `SELECT cp.name, cli.price_cents FROM claim_prices cli JOIN claim_parts cp ON cp.id = cli.claim_part_id
         WHERE cli.product_model_id = ? AND cli.status = 'active' ORDER BY cp.category, cp.sort_order`,
        [r.product_model_id],
      );
      const partPrices = ppRows.map((p) => ({ name: p.name, priceCents: p.price_cents }));
      const data = {
        certificateNo: certNo,
        customerName: r.customer_name_snapshot || '-',
        plateNo: r.plate_no_snapshot || '-',
        vin: r.vin_snapshot || '-',
        vehicleBrand: r.vehicle_brand_snapshot || '-',
        vehicleModel: r.vehicle_model_snapshot || '-',
        productName: r.product_name_snapshot || '-',
        productModel: r.product_model_snapshot || '-',
        storeName: r.store_name_snapshot || '-',
        installationDate: r.installation_date || '-',
        expiryDate: r.warranty_expiry_date || '-',
        warrantyYears: r.warranty_years_snapshot || 1,
        issueDate: new Date().toISOString().slice(0, 10),
        warrantyCode: r.warranty_code,
        warrantyPriceCents: r.warranty_price_cents,
        partPrices,
      };
      if (DRY_RUN) { ok++; continue; }
      const png = await createCertificateImage(data, seal);
      await new Promise((resolve, reject) =>
        cos.putObject({ Bucket: env.COS_BUCKET, Region: env.COS_REGION, Key: key, Body: Buffer.from(png), ContentType: 'image/png' }, (e) => (e ? reject(e) : resolve())),
      );
      const existing = await db.query(`SELECT id FROM certificate_files WHERE warranty_record_id = ? LIMIT 1`, [r.id]);
      if (existing[0].length === 0) {
        await db.query(
          `INSERT INTO certificate_files (id, warranty_record_id, file_key, file_url, version, generated_by, created_at)
           VALUES (?, ?, ?, NULL, 1, NULL, NOW())`,
          [crypto.randomUUID(), r.id, key],
        );
      } else {
        await db.query(`UPDATE certificate_files SET file_key = ?, version = version + 1, created_at = NOW() WHERE warranty_record_id = ?`, [key, r.id]);
      }
      ok++;
      if (ok % 100 === 0) console.log(`  进度: ${ok}/${rows.length}`);
    } catch (e) {
      fail++;
      failedList.push(`${certNo}: ${e.message || e}`);
    }
  }

  console.log(`\n完成: 成功 ${ok} / 失败 ${fail}`);
  if (failedList.length) failedList.slice(0, 20).forEach((f) => console.log('  -', f));
  await db.end();
}

main().catch((e) => { console.error('脚本异常:', e); process.exit(1); });
