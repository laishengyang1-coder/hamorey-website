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
