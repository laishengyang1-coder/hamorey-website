// ============================================================
// GET /api/admin/reviews — 待审核列表
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, queryFirst, parsePagination } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get('status') || 'pending';
    const provinceId = url.searchParams.get('province_org_id') || '';
    const storeId = url.searchParams.get('store_id') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];

    conditions.push('wr.status = ?');
    params.push(status);

    if (provinceId) { conditions.push('wr.province_org_id = ?'); params.push(provinceId); }
    if (storeId) { conditions.push('wr.store_id = ?'); params.push(storeId); }
    if (keyword) {
      conditions.push('(wr.customer_name_snapshot LIKE ? OR wr.plate_no_snapshot LIKE ? OR wr.vin_snapshot LIKE ? OR wc.code LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      queryAll(
        context.env.DB,
        `SELECT wr.*, wc.code AS warranty_code,
                pm.display_name AS model_name,
                s.name AS store_name
         FROM warranty_records wr
         JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
         JOIN product_models pm ON wr.product_model_id = pm.id
         LEFT JOIN organizations s ON wr.store_id = s.id
         ${where}
         ORDER BY wr.submitted_at ASC
         LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt FROM warranty_records wr JOIN warranty_codes wc ON wr.warranty_code_id = wc.id ${where}`,
        ...params,
      ),
    ]);

    const total = totalRow?.cnt ?? 0;
    return ok({ items, total, page, pageSize });
  } catch (err) {
    console.error('[admin/reviews GET]', err);
    return error('获取审核列表失败', 500);
  }
};
