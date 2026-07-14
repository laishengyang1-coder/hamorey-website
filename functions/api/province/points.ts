// ============================================================
// GET /api/province/points — 省代积分余额+流水
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, getOrgPoints, parsePagination , getAuthUser} from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    const url = new URL(context.request.url);
    const { page, pageSize, offset } = parsePagination(url);

    const points = await getOrgPoints(context.env.DB, user!.orgId);
    const ledger = await queryAll(
      context.env.DB,
      `SELECT * FROM points_ledger WHERE organization_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      user!.orgId, pageSize, offset,
    );
    const totalRow = await queryAll<{ cnt: number }>(
      context.env.DB,
      `SELECT COUNT(*) AS cnt FROM points_ledger WHERE organization_id = ?`,
      user!.orgId,
    );

    return ok({
      available: points.available,
      frozen: points.frozen,
      ledger: ledger,
      total: totalRow[0]?.cnt ?? 0,
      page,
      pageSize,
    });
  } catch (err) { console.error('[province/points]', err); return error('获取积分失败', 500); }
};
