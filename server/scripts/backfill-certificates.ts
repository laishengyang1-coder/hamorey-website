// 补齐旧记录缺失的证书图片或索引，已存在的文件跳过。
// 运行: npx tsx scripts/backfill-certificates.ts
import dotenv from 'dotenv';
import { certificateJob, inWarrantyTransaction, issueQueuedCertificate } from '../../functions/api/_certificate-workflow.ts';

dotenv.config({ path: process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env' });
const { apiEnv } = await import('../src/cloudflare-env.js');
const { pool } = await import('../src/db.js');
const { hasCosConfig } = await import('../src/cos.js');

interface Candidate { id: string; indexed_key: string | null }
const latestKey = `(SELECT cf.file_key FROM certificate_files cf WHERE cf.warranty_record_id=wr.id
  ORDER BY cf.version DESC, cf.created_at DESC LIMIT 1)`;

async function main() {
  if (!hasCosConfig()) throw Error('COS 未配置');
  const { results } = await apiEnv.DB.prepare(`SELECT wr.id, ${latestKey} indexed_key FROM warranty_records wr
    WHERE wr.status='active' AND COALESCE(wr.certificate_no,'')<>'' ORDER BY wr.approved_at`).all<Candidate>();
  let generated = 0, skipped = 0, pending = 0;
  for (const row of results) {
    // Adapter returns null only for a missing object. Stop on an outage or permission error.
    if (row.indexed_key && await apiEnv.R2.head(row.indexed_key)) { skipped++; continue; }
    const queued = await inWarrantyTransaction(apiEnv.DB, async tx => {
      const current = await tx.prepare("SELECT id FROM warranty_records WHERE id=? AND status='active' FOR UPDATE")
        .bind(row.id).first();
      if (!current) return false;
      const latest = await tx.prepare(`SELECT file_key FROM certificate_files WHERE warranty_record_id=?
        ORDER BY version DESC, created_at DESC LIMIT 1`).bind(row.id).first<{file_key: string}>();
      if ((latest?.file_key || null) !== row.indexed_key) return false;
      const job = certificateJob(row.id, null);
      await tx.prepare('INSERT IGNORE INTO certificate_jobs (warranty_record_id,revision,requested_by) VALUES (?,?,?)')
        .bind(...job.params).run();
      return true;
    });
    if (!queued) { skipped++; continue; }
    if (await issueQueuedCertificate(apiEnv, row.id)) generated++;
    else pending++;
  }
  console.log(`记录 ${results.length}，跳过 ${skipped}，已补 ${generated}，等待队列重试或并发处理 ${pending}`);
}

try { await main(); }
finally { await pool.end(); }
