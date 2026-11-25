// ============================================================
// GET /api/store/dashboard — 门店数据看板
//   - 默认：返回门店业务概览汇总
//   - type=national-points-ranking ：全国门店质保积分排行 + 自店排名
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';
import { countAvailableWarrantyCodes } from '../_warranty-inventory';
import { getNationalStoreRanking } from '../_points-ranking';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    const db = context.env.DB;
    const orgId = user.orgId;
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type');

    // 全国积分排行（**累计获得**口径：只累加 award/adjust，兑换/冻结不影响榜单；含自店排名）
    if (type === 'national-points-ranking') {
      const rows = await getNationalStoreRanking(db, orgId);
      const mine = rows.find(row => row.org_id === orgId);
      return ok({
        ranking: rows.slice(0, 20),
        myRank: mine ? { rank: mine.position, points: mine.count, name: mine.name } : null,
      });
    }

    const [codeCount, recordCount, pendingCount, rejectedCount, points] = await Promise.all([
      countAvailableWarrantyCodes(db, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE store_id = ? AND status NOT IN ('draft')`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE store_id = ? AND status = 'pending'`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE store_id = ? AND status = 'rejected'`, orgId),
      queryFirst<{ available: number; frozen: number }>(db,
        `SELECT COALESCE(SUM(CASE WHEN change_type IN ('award','adjust','release') THEN points_change WHEN change_type IN ('deduct','revoke','freeze') THEN -points_change ELSE 0 END),0) AS available, COALESCE(SUM(CASE WHEN change_type='freeze' THEN frozen_change WHEN change_type IN ('release','deduct') THEN -frozen_change ELSE 0 END),0) AS frozen FROM points_ledger WHERE organization_id = ?`, orgId),
    ]);

    return ok({
      codeCount: codeCount?.cnt ?? 0,
      recordCount: recordCount?.cnt ?? 0,
      pendingCount: pendingCount?.cnt ?? 0,
      rejectedCount: rejectedCount?.cnt ?? 0,
      availablePoints: points?.available ?? 0,
      frozenPoints: points?.frozen ?? 0,
    });
  } catch (err) {
    console.error('[store/dashboard GET]', err);
    return error('获取看板数据失败', 500);
  }
};
