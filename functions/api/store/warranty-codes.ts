// ============================================================
// GET /api/store/warranty-codes — 门店质保码库存
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
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = ['wc.owner_org_id = ?'];
    const params: unknown[] = [user?.orgId];

    if (status) { conditions.push('wc.status = ?'); params.push(status); }
    if (keyword) { conditions.push('wc.code LIKE ?'); params.push(`%${keyword}%`); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT wc.*, pm.model_code, pm.display_name AS model_name
         FROM warranty_codes wc JOIN product_models pm ON wc.product_model_id = pm.id
         ${where} ORDER BY wc.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt FROM warranty_codes wc ${where}`, ...params),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[store/warranty-codes]', err);
    return error('获取质保码库存失败', 500);
  }
};
