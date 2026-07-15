// ============================================================
// GET  /api/province/warranty-codes — 省代质保码库存
// POST /api/province/warranty-codes/allocate — 划拨给下属门店
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryAll, queryFirst, batch, parsePagination, writeOperationLog, getAuthUser } from '../_lib';
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
    const transferable = url.searchParams.get('transferable') === '1';
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortDir = url.searchParams.get('sort_dir') === 'asc' ? 'ASC' : 'DESC';
    const { page, pageSize, offset } = parsePagination(url);
    const sortColumns: Record<string, string> = {
      code: 'code',
      model_name: 'model_name',
      batch_no: 'batch_no',
      used_count: 'used_count',
      usage_limit: 'usage_limit',
      status: 'status',
      created_at: 'created_at',
    };
    const orderBy = sortColumns[sortBy] || sortColumns.created_at;

    const conditions: string[] = [];
    const params: unknown[] = [user?.orgId];

    if (status) { conditions.push('status = ?'); params.push(status); }
    if (transferable) {
      conditions.push("status IN ('in_stock', 'partial_used')");
      conditions.push('used_count < usage_limit');
    }
    if (keyword) {
      conditions.push('(code LIKE ? OR model_name LIKE ? OR model_code LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const usageSql = `SELECT warranty_code_id, COUNT(*) AS actual_used_count
                      FROM warranty_records
                      WHERE status IN ('pending', 'active', 'expired')
                      GROUP BY warranty_code_id`;
    const baseSql = `FROM (
        SELECT wc.id, wc.code, wc.product_model_id, wc.imported_product_name, wc.batch_no,
               wc.import_batch_id, wc.owner_org_id, wc.usage_limit,
               MIN(COALESCE(wu.actual_used_count, 0), wc.usage_limit) AS used_count,
               CASE
                 WHEN wc.status IN ('frozen', 'voided') THEN wc.status
                 WHEN COALESCE(wu.actual_used_count, 0) >= wc.usage_limit THEN 'exhausted'
                 WHEN COALESCE(wu.actual_used_count, 0) > 0 THEN 'partial_used'
                 ELSE 'in_stock'
               END AS status,
               wc.created_at, pm.model_code, pm.display_name AS model_name
        FROM warranty_codes wc
        JOIN product_models pm ON wc.product_model_id = pm.id
        LEFT JOIN (${usageSql}) wu ON wu.warranty_code_id = wc.id
        WHERE wc.owner_org_id = ?
      ) codes`;

    const [items, totalRow] = await Promise.all([
      queryAll(
        context.env.DB,
        `SELECT *
         ${baseSql}
         ${where}
         ORDER BY ${orderBy} ${sortDir}, created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt ${baseSql} ${where}`, ...params),
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
    if (!user) return error('未登录', 401);

    const targetStore = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT id FROM organizations WHERE id = ? AND parent_id = ? AND type = 'STORE' AND status = 'active'`,
      body.to_store_id, user.orgId,
    );
    if (!targetStore) return error('目标门店不存在、已停用或不属于当前省代', 403);

    const statements: Array<{ sql: string; params: unknown[] }> = [];
    let allocated = 0;

    const allocatedIds: string[] = [];

    for (const codeId of [...new Set(body.code_ids)]) {
      const code = await queryFirst<{ owner_org_id: string; status: string; used_count: number; usage_limit: number }>(
        context.env.DB,
        `SELECT wc.owner_org_id, wc.status,
                MIN(COALESCE(wu.actual_used_count, 0), wc.usage_limit) AS used_count,
                wc.usage_limit
         FROM warranty_codes wc
         LEFT JOIN (
           SELECT warranty_code_id, COUNT(*) AS actual_used_count
           FROM warranty_records
           WHERE status IN ('pending', 'active', 'expired')
           GROUP BY warranty_code_id
         ) wu ON wu.warranty_code_id = wc.id
         WHERE wc.id = ?`,
        codeId,
      );
      if (!code || code.owner_org_id !== user?.orgId) continue;
      if (!['in_stock', 'partial_used'].includes(code.status) || code.used_count >= code.usage_limit) continue;
      allocated += 1;
      allocatedIds.push(codeId);

      const allocId = generateId();
      statements.push({
        sql: `INSERT INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, created_at)
              VALUES (?, ?, ?, ?, 'allocate', ?, datetime('now'))`,
        params: [allocId, codeId, user?.orgId, body.to_store_id, user?.userId],
      });
      statements.push({
        sql: `UPDATE warranty_codes
              SET owner_org_id = ?,
                  status = CASE WHEN used_count > 0 THEN 'partial_used' ELSE 'in_stock' END
              WHERE id = ?`,
        params: [body.to_store_id, codeId],
      });
    }

    if (allocated === 0) return error('没有可划拨的质保码', 400);
    await batch(context.env.DB, statements);

    await writeOperationLog(context.env.DB, user?.userId || null, 'province_allocate', 'warranty_codes', null,
      { code_ids: allocatedIds, to_store_id: body.to_store_id }, getClientIP(context.request));

    return ok({ allocated }, '划拨成功');
  } catch (err) {
    console.error('[province/allocate]', err);
    return error('划拨失败', 500);
  }
};
