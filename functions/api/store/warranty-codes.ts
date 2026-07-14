// ============================================================
// GET /api/store/warranty-codes — 门店搜索可用质保码（自动补全）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const url = new URL(context.request.url);
    const q = (url.searchParams.get('q') || '').trim();
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') || 10)));

    const conditions = ['wc.owner_org_id = ?', "wc.status IN ('active', 'available', 'in_stock')"];
    const params: unknown[] = [user.orgId];

    if (q) {
      conditions.push('wc.code LIKE ?');
      params.push(`%${q}%`);
    }

    const items = await queryAll(
      context.env.DB,
      `SELECT wc.id, wc.code, wc.status, wc.batch_no,
              pm.display_name AS model_name, pm.model_code
       FROM warranty_codes wc
       JOIN product_models pm ON wc.product_model_id = pm.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY wc.code
       LIMIT ?`,
      ...params,
      limit,
    );

    return ok({ items, total: items.length });
  } catch (err) {
    console.error('[store/warranty-codes GET]', err);
    return error('查询质保码失败', 500);
  }
};
