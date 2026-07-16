// ============================================================
// GET /api/store/dashboard — 门店数据看板
//   - 默认：返回门店业务概览汇总
//   - type=national-points-ranking ：全国门店质保积分排行 + 自店排名
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    const db = context.env.DB;
    const orgId = user.orgId;
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type');

    // 全国积分排行（含自店排名）
    if (type === 'national-points-ranking') {
      const [rows, myPointsRow] = await Promise.all([
        queryAll<{ name: string; count: number; province: string; city: string; org_id: string }>(db,
          `SELECT o.name, o.province, o.city, o.id AS org_id,
                  COALESCE(SUM(pl.points_change), 0) AS count
           FROM points_ledger pl
           JOIN organizations o ON o.id = pl.organization_id
           JOIN warranty_records wr ON wr.id = pl.related_id AND wr.store_id = pl.organization_id
           WHERE pl.change_type = 'award'
             AND pl.related_type = 'warranty'
             AND wr.status = 'active'
           GROUP BY o.id
           ORDER BY count DESC, o.name ASC
           LIMIT 20`,
        ),
        queryFirst<{ points: number }>(db,
          `SELECT COALESCE(SUM(pl.points_change), 0) AS points
           FROM points_ledger pl
           JOIN warranty_records wr ON wr.id = pl.related_id AND wr.store_id = pl.organization_id
           WHERE pl.change_type = 'award'
             AND pl.related_type = 'warranty'
             AND wr.status = 'active'
             AND pl.organization_id = ?`,
          orgId,
        ),
      ]);

      // 查询自店排名（有多少门店积分比我们高）
      const myPoints = myPointsRow?.points ?? 0;
      let myRank = rows.length + 1; // 默认排在最末之后
      if (myPoints > 0) {
        const rankRow = await queryFirst<{ rank: number }>(db,
          `SELECT COUNT(*) + 1 AS rank FROM (
             SELECT o.id, COALESCE(SUM(pl.points_change), 0) AS pts
             FROM points_ledger pl
             JOIN organizations o ON o.id = pl.organization_id
             JOIN warranty_records wr ON wr.id = pl.related_id AND wr.store_id = pl.organization_id
             WHERE pl.change_type = 'award'
               AND pl.related_type = 'warranty'
               AND wr.status = 'active'
             GROUP BY o.id
             HAVING pts > ?
           )`,
          myPoints,
        );
        myRank = rankRow?.rank ?? 1;
      }

      // 获取自店名称
      const store = await queryFirst<{ name: string }>(db,
        `SELECT name FROM organizations WHERE id = ?`, orgId,
      );

      return ok({
        ranking: rows,
        myRank: { rank: myRank, points: myPoints, name: store?.name || '本店' },
      });
    }

    const [codeCount, recordCount, pendingCount, rejectedCount, points] = await Promise.all([
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_codes WHERE owner_org_id = ? AND status IN ('in_stock','partial_used')`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE store_id = ? AND status NOT IN ('draft')`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE store_id = ? AND status = 'pending'`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE store_id = ? AND status = 'rejected'`, orgId),
      queryFirst<{ available: number; frozen: number }>(db,
        `SELECT COALESCE(SUM(CASE WHEN change_type IN ('award','adjust','release') THEN points_change WHEN change_type IN ('deduct','revoke') THEN -points_change ELSE 0 END),0) AS available, COALESCE(SUM(CASE WHEN change_type='freeze' THEN frozen_change WHEN change_type IN ('release','deduct') THEN -frozen_change ELSE 0 END),0) AS frozen FROM points_ledger WHERE organization_id = ?`, orgId),
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
