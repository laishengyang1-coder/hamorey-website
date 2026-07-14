// ============================================================
// GET  /api/province/warranty-codes — 省代质保码库存
// POST /api/province/warranty-codes/allocate — 划拨给下属门店
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryAll, queryFirst, execute, batch, parsePagination, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

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
      queryAll(
        context.env.DB,
        `SELECT wc.*, pm.model_code, pm.display_name AS model_name
         FROM warranty_codes wc
         JOIN product_models pm ON wc.product_model_id = pm.id
         ${where}
         ORDER BY wc.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt FROM warranty_codes wc ${where}`, ...params),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[province/warranty-codes GET]', err);
    return error('获取质保码库存失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    if (!url.pathname.endsWith('/allocate')) return error('未知操作', 400);

    const body = (await context.request.json()) as { code_ids?: string[]; to_store_id?: string };
    if (!body.code_ids?.length) return error('请选择质保码', 400);
    if (!body.to_store_id) return error('请选择目标门店', 400);

    const user = getAuthUser(context.data);
    const statements: Array<{ sql: string; params: unknown[] }> = [];

    for (const codeId of body.code_ids) {
      const code = await queryFirst<{ owner_org_id: string }>(
        context.env.DB, `SELECT owner_org_id FROM warranty_codes WHERE id = ?`, codeId,
      );
      if (!code || code.owner_org_id !== user?.orgId) continue;

      const allocId = generateId();
      statements.push({
        sql: `INSERT INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, created_at)
              VALUES (?, ?, ?, ?, 'allocate', ?, datetime('now'))`,
        params: [allocId, codeId, user?.orgId, body.to_store_id, user?.userId],
      });
      statements.push({
        sql: `UPDATE warranty_codes SET owner_org_id = ?, status = 'in_stock' WHERE id = ?`,
        params: [body.to_store_id, codeId],
      });
    }

    await batch(context.env.DB, statements);

    await writeOperationLog(context.env.DB, user?.userId || null, 'province_allocate', 'warranty_codes', null,
      { code_ids: body.code_ids, to_store_id: body.to_store_id }, getClientIP(context.request));

    return ok({ allocated: body.code_ids.length }, '划拨成功');
  } catch (err) {
    console.error('[province/allocate]', err);
    return error('划拨失败', 500);
  }
};
