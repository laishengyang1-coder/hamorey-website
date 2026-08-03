// ============================================================
// backfill-certificates.mjs — 历史质保证书 PDF 批量补全（一次性）
// 为 active 且已有 certificate_no 但 certificate_files 无记录的历史质保
// 生成 PDF 证书并上传 COS、写入 certificate_files 记录。
// 用法: node backfill-certificates.mjs [--dry-run]
// ============================================================

import fs from 'node:fs';
import mysql from 'mysql2/promise';
import COS from 'cos-nodejs-sdk-v5';

// ---- 读取 /etc/hamorey/api.env ----
const envFile = process.env.API_ENV_FILE || '/etc/hamorey/api.env';
const env = {};
for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const DRY_RUN = process.argv.includes('--dry-run');

// ---- createCertificatePdf（与 functions/api/_certificate.ts 同步，模板域名 hemoppf.cn）----
function utf16Hex(value) {
  const normalized = String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[·•]/g, ' ').slice(0, 100);
  let result = '';
  for (let i = 0; i < normalized.length; i++) {
    result += normalized.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  }
  return result;
}
function textLine(text, x, y, size, font = 'F1') {
  const encoded = font === 'F2' ? `(${text.replace(/([\\()])/g, '\\$1')})` : `<${utf16Hex(text)}>`;
  return `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm ${encoded} Tj ET`;
}
function fieldLine(label, value, y) {
  const normalized = String(value ?? '-').replace(/[·•]/g, ' ');
  const valueFont = /^[\x20-\x7E]+$/.test(normalized) ? 'F2' : 'F1';
  return [textLine(`${label}：`, 50, y, 12), textLine(normalized, 155, y, 12, valueFont)];
}
function createCertificatePdf(data) {
  const lines = [
    ['证书编号', data.certificateNo], ['车主姓名', data.customerName], ['车牌号', data.plateNo],
    ['车架号 VIN', data.vin || '-'], ['车辆品牌', data.vehicleBrand], ['车辆型号', data.vehicleModel],
    ['产品名称', data.productName], ['产品型号', data.productModel], ['施工门店', data.storeName],
    ['施工日期', data.installationDate], ['质保到期', data.expiryDate], ['质保年限', `${data.warrantyYears} 年`],
  ];
  const content = [
    'q 1 1 1 rg 0 0 595 842 re f Q',
    '0 0 0 rg 0 0 0 RG',
    textLine('和膜', 50, 790, 24),
    textLine('HAMOREY', 115, 790, 24, 'F2'),
    textLine('整车质保证书', 50, 752, 18),
    '0.75 w 50 730 m 545 730 l S',
  ];
  lines.forEach(([label, value], index) => content.push(...fieldLine(label, String(value ?? '-'), 695 - index * 28)));
  content.push(textLine('本证书由和膜 HAMOREY 官方签发，可通过 hemoppf.cn 查询真伪。', 50, 335, 10));
  const stream = content.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 7 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [6 0 R] >>',
    '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf-8');
}

// ---- 主流程 ----
async function main() {
  const db = await mysql.createConnection({
    host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT), user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE, timezone: '+08:00',
  });
  const cos = new COS({ SecretId: env.COS_SECRET_ID, SecretKey: env.COS_SECRET_KEY });

  const [rows] = await db.query(
    `SELECT wr.id, wr.certificate_no, wr.customer_name_snapshot, wr.plate_no_snapshot, wr.vin_snapshot,
            wr.vehicle_brand_snapshot, wr.vehicle_model_snapshot, wr.product_name_snapshot, wr.product_model_snapshot,
            wr.store_name_snapshot, wr.installation_date, wr.warranty_expiry_date, wr.warranty_years_snapshot
     FROM warranty_records wr
     LEFT JOIN certificate_files cf ON cf.warranty_record_id = wr.id
     WHERE wr.status = 'active'
       AND wr.certificate_no IS NOT NULL AND wr.certificate_no <> ''
       AND cf.id IS NULL`,
  );

  console.log(`待补证书: ${rows.length} 条${DRY_RUN ? '（dry-run 仅预览）' : ''}`);
  let ok = 0, fail = 0;
  const failedList = [];

  for (const r of rows) {
    const certNo = r.certificate_no.trim();
    const key = `certificates/${certNo}.pdf`;
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
      installationDate: String(r.installation_date || '').slice(0, 10) || '-',
      expiryDate: String(r.warranty_expiry_date || '').slice(0, 10) || '-',
      warrantyYears: r.warranty_years_snapshot || 1,
    };
    try {
      if (DRY_RUN) { console.log(`[预览] ${certNo} | ${data.customerName} | ${data.plateNo} | ${data.productName}`); ok++; continue; }
      const pdf = createCertificatePdf(data);
      await new Promise((resolve, reject) =>
        cos.putObject({ Bucket: env.COS_BUCKET, Region: env.COS_REGION, Key: key, Body: pdf, ContentType: 'application/pdf' }, (e) => (e ? reject(e) : resolve())),
      );
      const id = crypto.randomUUID();
      await db.query(
        `INSERT INTO certificate_files (id, warranty_record_id, file_key, file_url, version, generated_by, created_at)
         VALUES (?, ?, ?, NULL, 1, NULL, NOW())`,
        [id, r.id, key],
      );
      ok++;
      if (ok % 50 === 0) console.log(`  进度: ${ok}/${rows.length}`);
    } catch (e) {
      fail++;
      failedList.push(`${certNo}: ${e.message || e}`);
    }
  }

  console.log(`\n完成: 成功 ${ok} / 失败 ${fail}`);
  if (failedList.length) {
    console.log('失败明细:');
    failedList.slice(0, 20).forEach((f) => console.log('  -', f));
  }
  await db.end();
}

main().catch((e) => { console.error('脚本异常:', e); process.exit(1); });
