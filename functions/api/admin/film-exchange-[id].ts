// ============================================================
// GET  /api/admin/film-exchange/:id — 换膜无忧申请详情（含照片/视频）
// POST /api/admin/film-exchange/:id/approve — 审核通过（免费/收费补膜）
// POST /api/admin/film-exchange/:id/reject  — 驳回
// POST /api/admin/film-exchange/:id/ship    — 标记发货
// POST /api/admin/film-exchange/:id/complete — 标记完成（原质保标已换膜）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, batch, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
}

function extractId(pathname: string): string {
  const parts = pathname.split('/');
  const idx = parts.indexOf('film-exchange');
  return parts[idx + 1] || '';
}

function extractAction(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

/** GET /api/admin/film-exchange/:id — 详情 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const requestId = extractId(new URL(context.request.url).pathname);
    if (!requestId) return error('缺少申请 ID', 400);

    const record = await queryFirst(
      context.env.DB,
      `SELECT r.*, wr.certificate_no, wr.warranty_expiry_date, wr.installation_date,
              wr.vehicle_brand_snapshot, wr.vehicle_model_snapshot, wr.vin_snapshot,
              wc.code AS warranty_code, s.name AS store_name
       FROM film_exchange_requests r
       LEFT JOIN warranty_records wr ON r.warranty_record_id = wr.id
       LEFT JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       LEFT JOIN organizations s ON r.store_id = s.id
       WHERE r.id = ?`,
      requestId,
    );
    if (!record) return error('申请不存在', 404);

    const media = await queryAll(
      context.env.DB,
      `SELECT id, file_key, media_type, sort_order, created_at FROM film_exchange_photos WHERE request_id = ? ORDER BY sort_order`,
      requestId,
    );

    return ok({ record, media });
  } catch (err) {
    console.error('[admin/film-exchange GET detail]', err);
    return error('获取申请详情失败', 500);
  }
};

/** POST — 按 action 分流 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const pathname = new URL(context.request.url).pathname;
    const requestId = extractId(pathname);
    const action = extractAction(pathname);
    if (!requestId) return error('缺少申请 ID', 400);

    switch (action) {
      case 'approve': return handleApprove(context, requestId);
      case 'reject': return handleReject(context, requestId);
      case 'ship': return handleShip(context, requestId);
      case 'complete': return handleComplete(context, requestId);
      default: return error('未知操作', 400);
    }
  } catch (err) {
    console.error('[admin/film-exchange POST]', err);
    return error('操作失败', 500);
  }
};

/** 通过：免费/收费补膜。状态 pending → approved（待发货） */
async function handleApprove(context: any, requestId: string): Promise<Response> {
  const { env } = context;
  const user = getAuthUser(context.data);
  const body = (await context.request.json().catch(() => ({}))) as {
    compensate_type?: string;
    charge_amount?: number;
    review_note?: string;
  };

  const errors: Array<{ field: string; message: string }> = [];
  const compensateType = body.compensate_type || 'free';
  if (!['free', 'charge'].includes(compensateType)) errors.push({ field: 'compensate_type', message: '补偿方式无效' });
  if (compensateType === 'charge') {
    if (body.charge_amount === undefined || body.charge_amount === null || Number(body.charge_amount) <= 0) {
      errors.push({ field: 'charge_amount', message: '收费补膜必须填写有效金额' });
    }
  }
  if (errors.length > 0) return validationError(errors);

  const record = await queryFirst<{ status: string }>(env.DB,
    `SELECT status FROM film_exchange_requests WHERE id = ?`, requestId);
  if (!record) return error('申请不存在', 404);
  if (record.status !== 'pending') return error('该申请不是待审核状态', 400);

  const result = await execute(env.DB,
    `UPDATE film_exchange_requests
     SET status = 'approved', compensate_type = ?, charge_amount = ?, review_note = ?,
         reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    compensateType,
    compensateType === 'charge' ? Number(body.charge_amount) : null,
    body.review_note || null,
    user?.userId || null,
    requestId,
  );
  if ((result.meta?.changes ?? 0) === 0) return error('该申请已被处理，请刷新', 409);

  await writeOperationLog(env.DB, user?.userId || null, 'approve_film_exchange', 'film_exchange_requests', requestId,
    { compensate_type: compensateType, charge_amount: body.charge_amount }, getClientIP(context.request));

  return ok({ requestId }, compensateType === 'charge' ? '已通过（收费补膜），待发货' : '已通过（免费补膜），待发货');
}

/** 驳回：pending → rejected */
async function handleReject(context: any, requestId: string): Promise<Response> {
  const { env } = context;
  const user = getAuthUser(context.data);
  const body = (await context.request.json().catch(() => ({}))) as { reason?: string };
  if (!body.reason) return error('请填写驳回原因', 400);

  const record = await queryFirst<{ status: string }>(env.DB,
    `SELECT status FROM film_exchange_requests WHERE id = ?`, requestId);
  if (!record) return error('申请不存在', 404);
  if (record.status !== 'pending') return error('该申请不是待审核状态', 400);

  const result = await execute(env.DB,
    `UPDATE film_exchange_requests
     SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    body.reason, user?.userId || null, requestId);
  if ((result.meta?.changes ?? 0) === 0) return error('该申请已被处理，请刷新', 409);

  await writeOperationLog(env.DB, user?.userId || null, 'reject_film_exchange', 'film_exchange_requests', requestId,
    { reason: body.reason }, getClientIP(context.request));

  return ok(null, '已驳回');
}

/** 发货：approved → shipped */
async function handleShip(context: any, requestId: string): Promise<Response> {
  const { env } = context;
  const user = getAuthUser(context.data);

  const record = await queryFirst<{ status: string }>(env.DB,
    `SELECT status FROM film_exchange_requests WHERE id = ?`, requestId);
  if (!record) return error('申请不存在', 404);
  if (record.status !== 'approved') return error('该申请当前状态不能发货（需先审核通过）', 400);

  const result = await execute(env.DB,
    `UPDATE film_exchange_requests SET status = 'shipped', updated_at = NOW() WHERE id = ? AND status = 'approved'`,
    requestId);
  if ((result.meta?.changes ?? 0) === 0) return error('该申请已被处理，请刷新', 409);

  await writeOperationLog(env.DB, user?.userId || null, 'ship_film_exchange', 'film_exchange_requests', requestId,
    null, getClientIP(context.request));

  return ok(null, '已标记发货');
}

/** 完成：shipped → completed，并把原质保记录标记为「已换膜」 */
async function handleComplete(context: any, requestId: string): Promise<Response> {
  const { env } = context;
  const user = getAuthUser(context.data);

  const record = await queryFirst<{ status: string; warranty_record_id: string }>(env.DB,
    `SELECT status, warranty_record_id FROM film_exchange_requests WHERE id = ?`, requestId);
  if (!record) return error('申请不存在', 404);
  if (record.status !== 'shipped') return error('该申请当前状态不能完成（需先发货）', 400);

  const statements: Array<{ sql: string; params: unknown[] }> = [
    {
      sql: `UPDATE film_exchange_requests SET status = 'completed', updated_at = NOW() WHERE id = ? AND status = 'shipped'`,
      params: [requestId],
    },
    {
      sql: `UPDATE warranty_records SET film_exchanged = 1, updated_at = NOW() WHERE id = ?`,
      params: [record.warranty_record_id],
    },
  ];
  await batch(env.DB, statements);

  await writeOperationLog(env.DB, user?.userId || null, 'complete_film_exchange', 'film_exchange_requests', requestId,
    { warranty_record_id: record.warranty_record_id }, getClientIP(context.request));

  return ok(null, '已完成，原质保记录已标记为已换膜');
}
