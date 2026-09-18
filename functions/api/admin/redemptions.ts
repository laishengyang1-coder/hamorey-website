// ============================================================
// GET /api/admin/redemptions — 兑换列表
// POST /api/admin/redemptions/:id/approve — 审核通过
// POST /api/admin/redemptions/:id/reject — 审核拒绝
// POST /api/admin/redemptions/:id/ship — 发货
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { batch, composeAddressText, generateId, queryFirst, queryAll, execute, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env { DB: D1Database; }

/**
 * 收货地址取「快照优先、实时兜底」，并标明来源：
 * - `snapshot`：下单当时冻结的地址，权威；
 * - `live`：这条单没有快照（历史数据），退回 addresses 表的**当前值** ——
 *   addresses 在 MySQL 里没有外键保护、门店可改可删，所以前端必须提示「可能已被修改」。
 */
function withShippingAddress(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const snapshotAddress = (row.address_snapshot as string | null) || '';
    const live = {
      recipient_name: (row.addr_recipient_name as string | null) || null,
      phone: (row.addr_phone as string | null) || null,
      province: (row.addr_province as string | null) || null,
      city: (row.addr_city as string | null) || null,
      district: (row.addr_district as string | null) || null,
      detail_address: (row.addr_detail as string | null) || null,
    };
    const hasLive = Boolean(live.recipient_name || live.province || live.detail_address);

    // 丢掉只为兜底而查出来的 addr_* 中间列，避免响应里多出一堆冗余字段
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (!key.startsWith('addr_')) mapped[key] = value;
    }

    mapped.recipient_name = (row.recipient_name_snapshot as string | null) || live.recipient_name || null;
    mapped.recipient_phone = (row.recipient_phone_snapshot as string | null) || live.phone || null;
    mapped.address_text = snapshotAddress || composeAddressText(live) || null;
    mapped.address_source = snapshotAddress ? 'snapshot' : (hasLive ? 'live' : null);
    return mapped;
  });
}

/** GET — 兑换列表 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get('status') || '';
    const orgId = url.searchParams.get('orgId') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (orgId) { conditions.push('r.organization_id = ?'); params.push(orgId); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rawItems, totalRow] = await Promise.all([
      queryAll<Record<string, unknown>>(context.env.DB,
        `SELECT r.*, o.name AS org_name,
                a.recipient_name AS addr_recipient_name, a.phone AS addr_phone,
                a.province AS addr_province, a.city AS addr_city,
                a.district AS addr_district, a.detail_address AS addr_detail,
                (SELECT json_group_array(json_object('reward_id',ri.reward_id,'quantity',ri.quantity,'points_per_item',ri.points_per_item,'reward_name_snapshot',ri.reward_name_snapshot))
                 FROM redemption_items ri WHERE ri.redemption_id = r.id) AS items_json
         FROM redemptions r
         LEFT JOIN organizations o ON o.id = r.organization_id
         LEFT JOIN addresses a ON a.id = r.address_id
         ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset),
      queryFirst<{ cnt: number }>(context.env.DB,
        `SELECT COUNT(*) AS cnt FROM redemptions r ${where}`, ...params),
    ]);
    return ok({ items: withShippingAddress(rawItems), total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[admin/redemptions GET]', err);
    return error('获取兑换列表失败', 500);
  }
};

/** POST /api/admin/redemptions/:id/approve */
async function handleApprove(context: any, id: string) {
  const red = await queryFirst<{
    id: string; organization_id: string; total_points: number; status: string;
  }>(context.env.DB, `SELECT * FROM redemptions WHERE id = ?`, id);
  if (!red) return error('兑换单不存在', 404);
  if (red.status !== 'pending') return error('该兑换单状态不是待审核', 400);

  const user = getAuthUser(context.data);
  const operatorId = user?.userId || null;
  await batch(context.env.DB, [
    {
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'deduct', 0, ?, 'redemption', ?, '兑换审核通过，扣除冻结积分', ?, datetime('now'))`,
      params: [generateId(), red.organization_id, red.total_points, red.id, operatorId],
    },
    {
      sql: `UPDATE redemptions
            SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND status = 'pending'`,
      params: [operatorId, id],
    },
    {
      sql: `INSERT INTO operation_logs
            (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
            VALUES (?, ?, 'approve_redemption', 'redemption', ?, ?, ?, datetime('now'))`,
      params: [generateId(), operatorId, id, JSON.stringify({ status: 'approved' }), getClientIP(context.request)],
    },
  ]);

  return ok({ id, status: 'approved' }, '审核通过');
}

/** POST /api/admin/redemptions/:id/reject */
async function handleReject(context: any, id: string) {
  const body = await context.request.json() as { review_note?: string };
  const red = await queryFirst<{
    id: string; organization_id: string; total_points: number; status: string;
  }>(context.env.DB, `SELECT * FROM redemptions WHERE id = ?`, id);
  if (!red) return error('兑换单不存在', 404);
  if (red.status !== 'pending') return error('该兑换单状态不是待审核', 400);

  const user = getAuthUser(context.data);
  const operatorId = user?.userId || null;
  const items = await queryAll<{ reward_id: string; quantity: number }>(
    context.env.DB,
    `SELECT reward_id, quantity FROM redemption_items WHERE redemption_id = ?`,
    id,
  );
  const statements: Array<{ sql: string; params: unknown[] }> = [
    {
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'release', ?, ?, 'redemption', ?, ?, ?, datetime('now'))`,
      params: [generateId(), red.organization_id, red.total_points, red.total_points, red.id, `兑换审核拒绝: ${body.review_note || '无'}`, operatorId],
    },
  ];

  for (const item of items) {
    statements.push({
      sql: `UPDATE rewards
            SET stock_quantity = stock_quantity + ?,
                stock_status = CASE WHEN status = 'active' THEN 'available' ELSE stock_status END,
                updated_at = datetime('now')
            WHERE id = ? AND stock_quantity IS NOT NULL`,
      params: [item.quantity, item.reward_id],
    });
  }

  statements.push(
    {
      sql: `UPDATE redemptions
            SET status = 'rejected', review_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND status = 'pending'`,
      params: [body.review_note || null, operatorId, id],
    },
    {
      sql: `INSERT INTO operation_logs
            (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
            VALUES (?, ?, 'reject_redemption', 'redemption', ?, ?, ?, datetime('now'))`,
      params: [generateId(), operatorId, id, JSON.stringify({ status: 'rejected', note: body.review_note }), getClientIP(context.request)],
    },
  );

  await batch(context.env.DB, statements);

  return ok({ id, status: 'rejected' }, '已拒绝');
}

/** POST /api/admin/redemptions/:id/ship */
async function handleShip(context: any, id: string) {
  const body = await context.request.json() as { tracking_no?: string };
  const red = await queryFirst<{ id: string; status: string }>(
    context.env.DB, `SELECT * FROM redemptions WHERE id = ?`, id);
  if (!red) return error('兑换单不存在', 404);
  if (red.status !== 'approved') return error('该兑换单状态不是已审核，无法发货', 400);

  await execute(context.env.DB,
    `UPDATE redemptions SET status = 'shipped', tracking_no = ?, updated_at = datetime('now') WHERE id = ?`,
    body.tracking_no || null, id);

  const user = getAuthUser(context.data);
  await writeOperationLog(context.env.DB, user?.userId || null, 'ship_redemption',
    'redemption', id, { tracking_no: body.tracking_no }, getClientIP(context.request));

  return ok({ id, status: 'shipped' }, '已发货');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const pathname = new URL(context.request.url).pathname;
  const parts = pathname.split('/');
  // path: /api/admin/redemptions/:id/approve|reject|ship
  const action = parts.pop(); // approve | reject | ship
  const id = parts.pop();     // :id
  if (!id || id === 'redemptions') return error('缺少兑换单 ID', 400);

  try {
    if (action === 'approve') return handleApprove(context, id);
    if (action === 'reject') return handleReject(context, id);
    if (action === 'ship') return handleShip(context, id);
    return error('未知操作', 400);
  } catch (err) {
    console.error('[admin/redemptions POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE constraint failed') || message.includes('INSUFFICIENT_FROZEN_POINTS')) {
      return error('兑换单已被处理，请刷新列表', 409);
    }
    return error('操作失败', 500);
  }
};
