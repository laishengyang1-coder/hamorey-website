// ============================================================
// GET /api/province/dashboard — 省代数据看板
//   - 默认：返回省代业务概览汇总
//   - type=store-ranking             ：该省代下属门店按质保数排行
//   - type=product-ranking           ：该省代下产品按质保数排行
//   - type=national-points-ranking   ：全国门店质保积分排行
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

    // 排行榜查询
    if (type === 'store-ranking') {
      const rows = await queryAll<{ name: string; count: number }>(db,
        `SELECT o.name, COUNT(wr.id) AS count FROM warranty_records wr
         JOIN organizations o ON o.id = wr.store_id
         WHERE wr.status = 'active' AND o.parent_id = ?
         GROUP BY o.name ORDER BY count DESC LIMIT 10`,
        orgId
      );
      return ok(rows);
    }
    if (type === 'product-ranking') {
      const rows = await queryAll<{ name: string; count: number }>(db,
        `SELECT COALESCE(NULLIF(wr.product_model_snapshot, ''), pm.display_name, wr.product_name_snapshot, '未命名产品') AS name,
                COUNT(wr.id) AS count
         FROM warranty_records wr
         LEFT JOIN product_models pm ON pm.id = wr.product_model_id
         WHERE wr.status = 'active' AND wr.province_org_id = ?
         GROUP BY COALESCE(NULLIF(wr.product_model_snapshot, ''), pm.display_name, wr.product_name_snapshot, '未命名产品')
         ORDER BY count DESC, name ASC
         LIMIT 10`,
        orgId
      );
      return ok(rows);
    }
    if (type === 'national-points-ranking') {
      const rows = await queryAll<{ name: string; count: number; province: string; city: string }>(db,
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
         LIMIT 20`,
      );
      return ok(rows);
    }

    // 汇总概览
    const [storeCount, codeCount, recordCount, pendingCount, todayRecords, points] = await Promise.all([
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM organizations WHERE parent_id = ? AND type = 'STORE'`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_codes WHERE owner_org_id = ? AND status IN ('in_stock','partial_used')`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE province_org_id = ? AND status NOT IN ('draft')`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE province_org_id = ? AND status = 'pending'`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE province_org_id = ? AND date(created_at) = date('now')`, orgId),
      queryFirst<{ available: number; frozen: number }>(db,
        `SELECT COALESCE(SUM(CASE WHEN change_type IN ('award','adjust','release') THEN points_change WHEN change_type IN ('deduct','revoke') THEN -points_change ELSE 0 END),0) AS available, COALESCE(SUM(CASE WHEN change_type='freeze' THEN frozen_change WHEN change_type IN ('release','deduct') THEN -frozen_change ELSE 0 END),0) AS frozen FROM points_ledger WHERE organization_id = ?`, orgId),
    ]);

    return ok({
      storeCount: storeCount?.cnt ?? 0,
      codeCount: codeCount?.cnt ?? 0,
      recordCount: recordCount?.cnt ?? 0,
      pendingCount: pendingCount?.cnt ?? 0,
      todayRecords: todayRecords?.cnt ?? 0,
      availablePoints: points?.available ?? 0,
      frozenPoints: points?.frozen ?? 0,
    });
  } catch (err) {
    console.error('[province/dashboard GET]', err);
    return error('获取看板数据失败', 500);
  }
};
