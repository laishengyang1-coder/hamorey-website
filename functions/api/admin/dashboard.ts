// ============================================================
// GET /api/admin/dashboard — 总部数据看板统计
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst } from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type');

    // 排行榜查询
    if (type === 'province-ranking') {
      const rows = await db.prepare(
        `SELECT o.name, o.province, COUNT(wr.id) AS count FROM warranty_records wr
         JOIN organizations o ON o.id = wr.province_org_id
         WHERE wr.status = 'active' GROUP BY o.id ORDER BY count DESC LIMIT 10`
      ).all();
      return ok(rows.results || []);
    }
    if (type === 'store-ranking') {
      const rows = await db.prepare(
        `SELECT o.name, o.province, o.city, COUNT(wr.id) AS count FROM warranty_records wr
         JOIN organizations o ON o.id = wr.store_id
         WHERE wr.status = 'active' GROUP BY o.id ORDER BY count DESC LIMIT 10`
      ).all();
      return ok(rows.results || []);
    }
    if (type === 'product-ranking') {
      const rows = await db.prepare(
        `SELECT COALESCE(NULLIF(wr.product_model_snapshot, ''), pm.display_name, wr.product_name_snapshot, '未命名产品') AS name,
                COUNT(wr.id) AS count
         FROM warranty_records wr
         LEFT JOIN product_models pm ON pm.id = wr.product_model_id
         WHERE wr.status = 'active'
         GROUP BY COALESCE(NULLIF(wr.product_model_snapshot, ''), pm.display_name, wr.product_name_snapshot, '未命名产品')
         ORDER BY count DESC, name ASC
         LIMIT 10`
      ).all();
      return ok(rows.results || []);
    }

    // 登记方质保积分排行榜（累计获得，不含兑换、人工调整、省代返利）
    if (type === 'points-ranking') {
      const rows = await db.prepare(
        `SELECT o.name, o.province, o.city,
                COALESCE(SUM(pl.points_change), 0) AS count
         FROM points_ledger pl
         JOIN organizations o ON o.id = pl.organization_id
         JOIN warranty_records wr ON wr.id = pl.related_id AND wr.store_id = pl.organization_id
         WHERE pl.change_type = 'award'
           AND pl.related_type = 'warranty'
           AND wr.status = 'active'
         GROUP BY o.id
         ORDER BY count DESC, o.name ASC
         LIMIT 20`
      ).all();
      return ok(rows.results || []);
    }
    const [totalOrgs, totalStores, totalCodes, totalRecords, pendingReviews, todayRecords, totalPointsEarned] =
      await Promise.all([
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM organizations WHERE type = 'PROVINCE'`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM organizations WHERE type = 'STORE'`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_codes`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE status NOT IN ('draft')`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE status = 'pending'`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE date(created_at) = date('now')`),
        queryFirst<{ cnt: number }>(
          db,
          `SELECT COALESCE(SUM(pl.points_change), 0) AS cnt
           FROM points_ledger pl
           JOIN warranty_records wr ON wr.id = pl.related_id AND wr.store_id = pl.organization_id
           WHERE pl.change_type = 'award'
             AND pl.related_type = 'warranty'
             AND wr.status = 'active'`
        ),
      ]);

    return ok({
      provinces: totalOrgs?.cnt ?? 0,
      stores: totalStores?.cnt ?? 0,
      totalCodes: totalCodes?.cnt ?? 0,
      totalRecords: totalRecords?.cnt ?? 0,
      pendingReviews: pendingReviews?.cnt ?? 0,
      todayRecords: todayRecords?.cnt ?? 0,
      totalPointsEarned: totalPointsEarned?.cnt ?? 0,
    });
  } catch (err) {
    console.error('[admin/dashboard GET]', err);
    return error('获取看板数据失败', 500);
  }
};
