// ============================================================
// backfill-certificates.ts — 补齐缺失的质保证书长图 PNG
// 背景：生产环境曾因 sharp 未声明进 server 包依赖，自动/手动审核时
// 证书长图生成失败（certFileKey=''），但 certificate_no 已写入记录。
// 本脚本扫描 active 且 certificate_no 非空、但 COS 中缺少
// certificates/{certificate_no}.png 的记录，重新生成并上传。
// 幂等：仅补缺失项；已存在的跳过。
// 运行：cd /opt/hamorey/apps/api && npx tsx scripts/backfill-certificates.ts
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import COS from 'cos-nodejs-sdk-v5';
import { createCertificateImage, type CertificateData } from '../../functions/api/_certificate.ts';
import { getCertificateSeal } from '../../functions/api/_seal.ts';

dotenv.config({ path: process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env' });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in env file`);
  return v;
}

const MYSQL_HOST = required('MYSQL_HOST');
const MYSQL_PORT = Number(required('MYSQL_PORT') || '3306');
const MYSQL_USER = required('MYSQL_USER');
const MYSQL_PASSWORD = required('MYSQL_PASSWORD');
const MYSQL_DATABASE = required('MYSQL_DATABASE');
const COS_BUCKET = required('COS_BUCKET');
const COS_REGION = required('COS_REGION');

const cos = new COS({
  SecretId: required('COS_SECRET_ID'),
  SecretKey: required('COS_SECRET_KEY'),
});

interface CertRow {
  id: string;
  certificate_no: string;
  warranty_code_id: string;
  product_model_id: string;
  customer_name_snapshot: string;
  plate_no_snapshot: string | null;
  vin_snapshot: string | null;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  product_name_snapshot: string;
  product_model_snapshot: string;
  store_name_snapshot: string;
  installation_date: string;
  warranty_years_snapshot: number;
  approved_at: string | null;
}

function headExists(key: string): Promise<boolean> {
  return new Promise((resolve) => {
    cos.headObject({ Bucket: COS_BUCKET, Region: COS_REGION, Key: key }, (err) => {
      resolve(!err);
    });
  });
}

function putPng(key: string, body: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    cos.putObject(
      { Bucket: COS_BUCKET, Region: COS_REGION, Key: key, Body: body, ContentType: 'image/png' },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

async function main() {
  const conn = await mysql.createConnection({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    timezone: '+08:00',
  });

  const [rows] = await conn.query<CertRow[]>(
    `SELECT id, certificate_no, warranty_code_id, product_model_id,
            customer_name_snapshot, plate_no_snapshot, vin_snapshot,
            vehicle_brand_snapshot, vehicle_model_snapshot,
            product_name_snapshot, product_model_snapshot, store_name_snapshot,
            installation_date, warranty_years_snapshot, approved_at
     FROM warranty_records
     WHERE status = 'active' AND certificate_no IS NOT NULL AND certificate_no != ''
     ORDER BY approved_at ASC`,
  );
  console.log(`共 ${rows.length} 条 active 记录（含 certificate_no）`);

  const seal = await getCertificateSeal();
  if (!seal) console.warn('印章读取失败，证书将无印章（继续）');

  let missing = 0;
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of rows) {
    const key = `certificates/${r.certificate_no}.png`;
    if (await headExists(key)) {
      skipped += 1;
      continue;
    }
    missing += 1;

    try {
      // 质保码 + 官方指导价
      const [codeRows] = await conn.query(
        `SELECT wc.code, pm.warranty_price_cents FROM warranty_codes wc, product_models pm
         WHERE wc.id = ? AND pm.id = ?`,
        [r.warranty_code_id, r.product_model_id],
      );
      const codeAndPrice = (codeRows as { code: string; warranty_price_cents: number | null }[])[0];

      // 分部位报价
      const [partRows] = await conn.query(
        `SELECT cp.name, cli.price_cents FROM claim_prices cli
         JOIN claim_parts cp ON cp.id = cli.claim_part_id
         WHERE cli.product_model_id = ? AND cli.status = 'active'
         ORDER BY cp.category, cp.sort_order`,
        [r.product_model_id],
      );
      const partPrices = (partRows as { name: string; price_cents: number }[]).map((p) => ({
        name: p.name,
        priceCents: p.price_cents,
      }));

      // 到期日：施工日期 + 质保年限
      const install = new Date(r.installation_date);
      install.setFullYear(install.getFullYear() + (r.warranty_years_snapshot || 5));
      const expiryDate = install.toISOString().split('T')[0];
      const issueDate = r.approved_at ? r.approved_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

      const data: CertificateData = {
        certificateNo: r.certificate_no,
        customerName: r.customer_name_snapshot,
        plateNo: r.plate_no_snapshot || '临时车牌',
        vin: r.vin_snapshot || '-',
        vehicleBrand: r.vehicle_brand_snapshot,
        vehicleModel: r.vehicle_model_snapshot,
        productName: r.product_name_snapshot,
        productModel: r.product_model_snapshot,
        storeName: r.store_name_snapshot,
        installationDate: r.installation_date,
        expiryDate,
        warrantyYears: r.warranty_years_snapshot,
        issueDate,
        warrantyCode: codeAndPrice?.code,
        warrantyPriceCents: codeAndPrice?.warranty_price_cents ?? null,
        partPrices,
      };

      const png = await createCertificateImage(data, seal);
      await putPng(key, Buffer.from(png));
      generated += 1;
      if (generated % 10 === 0) console.log(`...已补 ${generated} 张（${r.certificate_no}）`);
    } catch (err) {
      failed += 1;
      console.error(`补生成失败 ${r.certificate_no}:`, err);
    }
  }

  console.log(`完成：总 ${rows.length}，已存在 ${skipped}，缺失 ${missing}，本次补生成 ${generated}，失败 ${failed}`);
  await conn.end();
}

main().catch((err) => {
  console.error('脚本执行失败', err);
  process.exit(1);
});
