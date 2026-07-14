// ============================================================
// GET /api/admin/points-ledger — 积分流水查询
// POST /api/admin/points-ledger/adjust — 人工调整
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, queryFirst, parsePagination, writePointsLedger, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('organization_id') || '';
    const changeType = url.searchParams.get('change_type') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (orgId) { conditions.push('pl.organization_id = ?'); params.push(orgId); }
    if (changeType) { conditions.push('pl.change_type = ?'); params.push(changeType); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT pl.*, o.name AS organization_name, u.username AS operator_name
         FROM points_ledger pl
         JOIN organizations o ON pl.organization_id = o.id
         LEFT JOIN users u ON pl.operator_user_id = u.id
         ${where} ORDER BY pl.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt FROM points_ledger pl ${where}`, ...params),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) { console.error('[points-ledger GET]', err); return error('获取积分流水失败', 500); }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    if (!url.pathname.endsWith('/adjust')) return error('未知操作', 400);

    const body = (await context.request.json()) as { organization_id?: string; points?: number; reason?: string };
    if (!body.organization_id || !body.points || !body.reason) return error('缺少必填字段（organization_id, points, reason）', 400);

    const user = getAuthUser(context.data);
    const ledgerId = await writePointsLedger(context.env.DB, body.organization_id, 'adjust', body.points, 0, 'manual', null, body.reason, user?.userId || null);
    await writeOperationLog(context.env.DB, user?.userId || null, 'adjust_points', 'points_ledger', ledgerId, body, getClientIP(context.request));

    return ok({ ledgerId }, '调整成功');
  } catch (err) { console.error('[points-ledger POST]', err); return error('调整失败', 500); }
};
