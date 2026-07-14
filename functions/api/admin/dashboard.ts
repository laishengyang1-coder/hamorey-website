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
        `SELECT o.name, COUNT(wr.id) AS count FROM warranty_records wr
         JOIN organizations o ON o.id = wr.province_org_id
         WHERE wr.status = 'active' GROUP BY o.name ORDER BY count DESC LIMIT 10`
      ).all();
      return ok(rows.results || []);
    }
    if (type === 'store-ranking') {
      const rows = await db.prepare(
        `SELECT o.name, COUNT(wr.id) AS count FROM warranty_records wr
         JOIN organizations o ON o.id = wr.store_id
         WHERE wr.status = 'active' GROUP BY o.name ORDER BY count DESC LIMIT 10`
      ).all();
      return ok(rows.results || []);
    }
    if (type === 'product-ranking') {
      const rows = await db.prepare(
        `SELECT wr.product_name_snapshot AS name, COUNT(wr.id) AS count FROM warranty_records wr
         WHERE wr.status = 'active' AND wr.product_name_snapshot IS NOT NULL
         GROUP BY wr.product_name_snapshot ORDER BY count DESC LIMIT 10`
      ).all();
      return ok(rows.results || []);
    }

    const [totalOrgs, totalStores, totalCodes, totalRecords, pendingReviews, todayRecords] =
      await Promise.all([
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM organizations WHERE type = 'PROVINCE'`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM organizations WHERE type = 'STORE'`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_codes`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE status NOT IN ('draft')`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE status = 'pending'`),
        queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE date(created_at) = date('now')`),
      ]);

    return ok({
      provinces: totalOrgs?.cnt ?? 0,
      stores: totalStores?.cnt ?? 0,
      totalCodes: totalCodes?.cnt ?? 0,
      totalRecords: totalRecords?.cnt ?? 0,
      pendingReviews: pendingReviews?.cnt ?? 0,
      todayRecords: todayRecords?.cnt ?? 0,
    });
  } catch (err) {
    console.error('[admin/dashboard GET]', err);
    return error('获取看板数据失败', 500);
  }
};
