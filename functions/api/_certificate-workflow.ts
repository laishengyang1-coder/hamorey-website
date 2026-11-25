import { generateId } from './_lib';
import { createCertificateImage, type CertificateData } from './_certificate';
import { getCertificateSeal } from './_seal';

type Tx = Pick<D1Database, 'prepare'>;
type Database = D1Database & { transaction<T>(run: (tx: Tx) => Promise<T>): Promise<T> };
type CertificateStorage = {
  put(key: string, body: Uint8Array, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
};
export type CertificateEnv = { DB: D1Database; R2: CertificateStorage; CERTIFICATE_BUCKET?: CertificateStorage };
type Statement = { sql: string; params: unknown[] };

export function validInstallDate(input: unknown): input is string {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const parsed = new Date(input + 'T00:00:00Z');
  return input >= '1000-01-01' && !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === input;
}

export function warrantyExpiry(date: Date | string, years: number): string {
  const d = new Date(date);
  d.setUTCFullYear(d.getUTCFullYear() + Number(years));
  return d.toISOString().slice(0, 10);
}

export function certificateJob(recordId: string, userId: string | null): Statement {
  return {
    sql: 'REPLACE INTO certificate_jobs (warranty_record_id, revision, requested_by) VALUES (?, ?, ?)',
    params: [recordId, generateId(), userId],
  };
}

export function inWarrantyTransaction<T>(db: D1Database, run: (tx: Tx) => Promise<T>): Promise<T> {
  return (db as Database).transaction(run);
}

// The status update is the first statement. A losing reviewer must never run the side effects.
export async function commitReview(db: D1Database, [first, ...rest]: Statement[]): Promise<boolean> {
  return inWarrantyTransaction(db, async (tx) => {
    const update = await tx.prepare(first.sql).bind(...first.params).run();
    if (!update.meta.changes) return false;
    for (const step of rest) await tx.prepare(step.sql).bind(...step.params).run();
    return true;
  });
}

interface Source {
  id: string; certificate_no: string; status: string; product_model_id: string;
  customer_name_snapshot: string; plate_no_snapshot: string; vin_snapshot: string;
  vehicle_brand_snapshot: string; vehicle_model_snapshot: string; product_name_snapshot: string;
  product_model_snapshot: string; store_name_snapshot: string; warranty_years_snapshot: number;
  installed: string; expires: string; approved: string | null; created: string;
  warranty_code_id: string;
}

async function loadImageData(tx: Tx, r: Source, issueDate: string): Promise<CertificateData> {
  const product = await tx.prepare(`SELECT wc.code, pm.warranty_price_cents, p.category
    FROM product_models pm LEFT JOIN products p ON p.id = pm.product_id
    JOIN warranty_codes wc ON wc.id = ? WHERE pm.id = ?`)
    .bind(r.warranty_code_id, r.product_model_id)
    .first<{ code: string; warranty_price_cents: number | null; category: string | null }>();
  const prices = await tx.prepare(`SELECT cp.name, cli.price_cents FROM claim_prices cli
    JOIN claim_parts cp ON cp.id = cli.claim_part_id WHERE cli.product_model_id = ?
    AND cli.status = 'active' ORDER BY cp.category, cp.sort_order`)
    .bind(r.product_model_id).all<{ name: string; price_cents: number }>();
  return {
    certificateNo: r.certificate_no, customerName: r.customer_name_snapshot,
    plateNo: r.plate_no_snapshot || '临时车牌', vin: r.vin_snapshot || '-',
    vehicleBrand: r.vehicle_brand_snapshot, vehicleModel: r.vehicle_model_snapshot,
    productName: r.product_name_snapshot, productModel: r.product_model_snapshot,
    storeName: r.store_name_snapshot, installationDate: r.installed, expiryDate: r.expires,
    warrantyYears: r.warranty_years_snapshot, issueDate, warrantyCode: product?.code,
    productCategory: product?.category, warrantyPriceCents: product?.warranty_price_cents,
    partPrices: prices.results.map(row => ({ name: row.name, priceCents: row.price_cents })),
  };
}

async function render(data: CertificateData) {
  return createCertificateImage(data, await getCertificateSeal());
}

export async function issueQueuedCertificate(env: CertificateEnv, recordId: string, renderImage = render): Promise<string | null> {
  // Every writer locks the warranty before its queue row, including an edit during generation.
  // A process crash releases both locks and leaves the committed job available for a retry.
  return inWarrantyTransaction(env.DB, async tx => {
    const record = await tx.prepare(`SELECT wr.*, DATE_FORMAT(installation_date,'%Y-%m-%d') installed,
      DATE_FORMAT(warranty_expiry_date,'%Y-%m-%d') expires, DATE_FORMAT(approved_at,'%Y-%m-%d') approved,
      DATE_FORMAT(created_at,'%Y-%m-%d') created FROM warranty_records wr WHERE id = ? FOR UPDATE`)
      .bind(recordId).first<Source>();
    const job = await tx.prepare(`SELECT revision, requested_by, attempts FROM certificate_jobs
      WHERE warranty_record_id = ? AND next_attempt_at <= NOW() FOR UPDATE`)
      .bind(recordId).first<{revision: string; requested_by: string | null; attempts: number}>();
    if (!job) return null;
    if (!record || !['active','expired'].includes(record.status) || !record.certificate_no) {
      await tx.prepare('DELETE FROM certificate_jobs WHERE warranty_record_id = ?').bind(recordId).run();
      return null;
    }
    const files = await tx.prepare(`SELECT version, file_key, DATE_FORMAT(created_at,'%Y-%m-%d') issued
      FROM certificate_files WHERE warranty_record_id = ? ORDER BY version, created_at`)
      .bind(recordId).all<{version: number; file_key: string; issued: string}>();
    const first = files.results[0];
    const issueDate = first && !first.file_key.startsWith('certificates/generated/')
      ? first.issued : record.approved || first?.issued || record.created;
    const version = (files.results[files.results.length - 1]?.version ?? 0) + 1;
    const key = `certificates/generated/${record.certificate_no}/${job.revision}.png`;
    const data = await loadImageData(tx, record, issueDate);
    try {
      const image = await renderImage(data);
      await (env.CERTIFICATE_BUCKET || env.R2).put(key, image, { httpMetadata: { contentType: 'image/png' } });
    } catch {
      await tx.prepare(`UPDATE certificate_jobs SET
        next_attempt_at = TIMESTAMPADD(MINUTE, LEAST(60, POW(2, LEAST(6, attempts))), NOW()),
        attempts = attempts + 1 WHERE warranty_record_id = ?`).bind(recordId).run();
      if (!job.attempts) {
        await tx.prepare(`INSERT INTO operation_logs (id, user_id, action, target_type, target_id, detail_json, created_at)
          VALUES (?, NULL, 'certificate_retry_alert', 'warranty_records', ?, ?, NOW())`)
          .bind(generateId(), recordId, JSON.stringify({ message: '证书签发失败，已安排自动重试' })).run();
      }
      console.error('[certificate] 签发或上传失败，已安排重试');
      return null;
    }
    await tx.prepare(`INSERT INTO certificate_files (id, warranty_record_id, file_key, file_url,
      version, generated_by, created_at) VALUES (?, ?, ?, NULL, ?, ?, NOW())`)
      .bind(generateId(), recordId, key, version, job.requested_by).run();
    await tx.prepare('DELETE FROM certificate_jobs WHERE warranty_record_id = ?').bind(recordId).run();
    return key;
  });
}

// Commit already succeeded; storage or indexing failures must never repeat the approval or its points.
export async function tryIssueCertificate(env: CertificateEnv, id: string) {
  try { return await issueQueuedCertificate(env, id); }
  catch { console.error('[certificate] 签发事务失败，队列将自动重试'); return null; }
}
