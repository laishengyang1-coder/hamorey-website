import { createCosClient, hasCosConfig } from './cos.js';
import { pingDatabase, pool } from './db.js';
import { env } from './env.js';
import { probeCanary } from './storage-canary.js';
import type { RowDataPacket } from 'mysql2/promise';

type Check = 'ok' | 'missing' | 'error';
type Checks = Record<'api' | 'mysql' | 'cos' | 'cosWrite' | 'certificates', Check>;
interface Probes { mysql: () => Promise<void>; cos?: () => Promise<void>; cosWrite: Check; certificates: () => Promise<void> }

export async function checkServices(probes: Probes) {
  const checks: Checks = { api: 'ok', mysql: 'ok', cos: probes.cos ? 'ok' : 'missing', cosWrite: probes.cosWrite, certificates: 'ok' };
  await Promise.all((['mysql','cos','certificates'] as const).map(async key => {
    if (!probes[key]) return;
    try { await probes[key](); } catch { checks[key] = 'error'; }
  }));
  return { ok: Object.values(checks).every(status => status === 'ok'), checks };
}

export function validateRangeRead(result: { statusCode?: number; Body?: unknown }) {
  if (result.statusCode !== 206 || !Buffer.isBuffer(result.Body) || result.Body.length !== 1) {
    throw new Error('COS range read failed');
  }
}

const cos = createCosClient({ Timeout: 4000, ChunkRetryTimes: 0 });
async function probeObject() {
  let key = env.COS_HEALTH_KEY;
  if (!key) {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT image_file_key FROM banners
      WHERE status = 'active' AND image_file_key LIKE 'banners/%' ORDER BY sort_order, id LIMIT 1`);
    key = rows[0]?.image_file_key;
  }
  if (!key || !cos || !env.COS_BUCKET) throw new Error('Missing COS probe object');
  validateRangeRead(await cos.getObject({ Bucket: env.COS_BUCKET, Region: env.COS_REGION, Key: key, Range: 'bytes=0-0' }));
}

async function probeCertificates() {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT
    EXISTS (SELECT 1 FROM certificate_jobs WHERE attempts > 0 OR requested_at < NOW() - INTERVAL 5 MINUTE) delayed,
    EXISTS (SELECT 1 FROM warranty_records wr WHERE wr.status IN ('active','expired')
      AND COALESCE(wr.approved_at, wr.created_at) < NOW() - INTERVAL 5 MINUTE
      AND NOT EXISTS (SELECT 1 FROM certificate_files cf WHERE cf.warranty_record_id = wr.id)) missing`);
  if (rows[0].delayed || rows[0].missing) throw new Error('Certificate generation is delayed');
}

let writeStatus: Check = 'missing';
let nextWriteAt = 0;
let writeCheckedAt = 0;
async function scheduledWriteProbe() {
  if (Date.now() < nextWriteAt || !cos || !env.COS_BUCKET) return;
  const conn = await pool.getConnection();
  let locked = false;
  try {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT GET_LOCK('hamorey_cos_write_probe_v1', 4) acquired");
    if (!rows[0]?.acquired) return;
    locked = true;
    try {
      await probeCanary(cos, env.COS_BUCKET, env.COS_REGION);
      writeStatus = 'ok';
    } catch { writeStatus = 'error'; }
    writeCheckedAt = Date.now();
    nextWriteAt = writeCheckedAt + (writeStatus === 'ok' ? 15 * 60_000 : 60_000);
    expires = 0;
  } finally {
    try { if (locked) await conn.query("SELECT RELEASE_LOCK('hamorey_cos_write_probe_v1')"); }
    finally { conn.release(); }
  }
}

let cached: Awaited<ReturnType<typeof checkServices>> | undefined;
let expires = 0;
let running: ReturnType<typeof checkServices> | undefined;
export function getServiceHealth() {
  if (cached && Date.now() < expires) return Promise.resolve(cached);
  if (!running) {
    running = checkServices({ mysql: pingDatabase, cos: hasCosConfig() ? probeObject : undefined,
      cosWrite: writeStatus === 'ok' && Date.now() - writeCheckedAt > 17 * 60_000 ? 'error' : writeStatus, certificates: probeCertificates })
      .then(result => {
        cached = result;
        expires = Date.now() + (result.ok ? 30_000 : 5_000);
        return result;
      }).finally(() => { running = undefined; });
  }
  return running;
}

export function startHealthMonitoring() {
  let lastFailure = '';
  let checking = false;
  async function tick() {
    if (checking) return;
    checking = true;
    try {
      try { await scheduledWriteProbe(); }
      catch { writeStatus = 'error'; expires = 0; }
      const { checks } = await getServiceHealth();
      const failure = Object.entries(checks).filter(([,v]) => v !== 'ok').map(([k]) => k).sort().join(',');
      if (failure === lastFailure) return;
      if (failure) console.error('[health] 服务异常', failure);
      else console.log('[health] 服务恢复');
      if (checks.mysql === 'ok') {
        await pool.execute(`INSERT INTO operation_logs
          (id,user_id,action,target_type,target_id,detail_json,created_at)
          VALUES (UUID(),NULL,?,'system',NULL,?,NOW())`,
        [failure ? 'service_health_alert' : 'service_health_recovered', JSON.stringify({ checks })]);
      }
      lastFailure = failure;
    } catch { console.error('[health] 健康告警记录失败'); }
    finally { checking = false; }
  }
  void tick();
  const timer = setInterval(() => { void tick(); }, 60_000);
  timer.unref();
  return timer;
}
