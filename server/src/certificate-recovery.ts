import type { Pool, RowDataPacket } from 'mysql2/promise';
import { tryIssueCertificate, type CertificateEnv } from '../../functions/api/_certificate-workflow.ts';

export async function probeCertificates(database: Pick<Pool, 'query'>) {
  const [rows] = await database.query<RowDataPacket[]>(`SELECT
    EXISTS (SELECT 1 FROM certificate_jobs WHERE attempts > 0 OR requested_at < NOW() - INTERVAL 5 MINUTE) AS has_delayed_jobs,
    EXISTS (SELECT 1 FROM warranty_records wr WHERE wr.status IN ('active','expired')
      AND COALESCE(wr.approved_at, wr.created_at) < NOW() - INTERVAL 5 MINUTE
      AND NOT EXISTS (SELECT 1 FROM certificate_files cf WHERE cf.warranty_record_id = wr.id)) AS has_missing_files`);
  if (Number(rows[0].has_delayed_jobs) > 0 || Number(rows[0].has_missing_files) > 0) throw new Error('Certificate generation is delayed');
}

export async function recoverCertificates(env: CertificateEnv) {
  // Also discover older interrupted approvals which predate the durable queue.
  await env.DB.prepare(`INSERT IGNORE INTO certificate_jobs (warranty_record_id,revision)
    SELECT wr.id, UUID() FROM warranty_records wr
    WHERE wr.status IN ('active','expired') AND COALESCE(wr.certificate_no,'') <> ''
      AND NOT EXISTS (SELECT 1 FROM certificate_files cf WHERE cf.warranty_record_id = wr.id)
      AND NOT EXISTS (SELECT 1 FROM certificate_jobs j WHERE j.warranty_record_id = wr.id)
    ORDER BY wr.id LIMIT 20`).run();
  const due = await env.DB.prepare(`SELECT warranty_record_id FROM certificate_jobs
    WHERE next_attempt_at <= NOW() ORDER BY next_attempt_at, warranty_record_id LIMIT 20`)
    .all<{warranty_record_id: string}>();
  for (const row of due.results) await tryIssueCertificate(env, row.warranty_record_id);
}

export function startCertificateRecovery(env: CertificateEnv) {
  let running = false;
  async function tick() {
    if (running) return;
    running = true;
    try { await recoverCertificates(env); }
    catch { console.error('[certificate] 无法检查待签发队列'); }
    finally { running = false; }
  }
  void tick();
  const timer = setInterval(() => { void tick(); }, 60_000);
  timer.unref();
  return timer;
}
