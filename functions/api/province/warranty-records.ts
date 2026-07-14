// ============================================================
// GET /api/province/warranty-records — 省代查看下属质保记录
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, queryFirst, parsePagination , getAuthUser} from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const user = getAuthUser(context.data);
    const status = url.searchParams.get('status') || '';
    const storeId = url.searchParams.get('store_id') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    // 找出下属门店 ID 列表
    const subStores = await queryAll<{ id: string }>(
      context.env.DB,
      `SELECT id FROM organizations WHERE parent_id = ? AND type = 'STORE'`,
      user?.orgId,
    );
    const storeIds = subStores.map((s) => s.id);
    if (storeIds.length === 0) return ok({ items: [], total: 0, page, pageSize });

    const conditions: string[] = [`wr.store_id IN (${storeIds.map(() => '?').join(',')})`];
    const params: unknown[] = [...storeIds];

    if (status) { conditions.push('wr.status = ?'); params.push(status); }
    if (storeId) { conditions.push('wr.store_id = ?'); params.push(storeId); }
    if (keyword) {
      conditions.push('(wr.customer_name_snapshot LIKE ? OR wr.plate_no_snapshot LIKE ? OR wc.code LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT wr.*, wc.code AS warranty_code, pm.display_name AS model_name, s.name AS store_name
         FROM warranty_records wr
         JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
         JOIN product_models pm ON wr.product_model_id = pm.id
         LEFT JOIN organizations s ON wr.store_id = s.id
         ${where} ORDER BY wr.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt FROM warranty_records wr ${where}`, ...params),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[province/warranty-records]', err);
    return error('获取质保记录失败', 500);
  }
};
