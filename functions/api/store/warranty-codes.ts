// ============================================================
// GET /api/store/warranty-codes — 门店搜索可用质保码（自动补全）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, queryFirst, getAuthUser, parsePagination } from '../_lib';
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
    const keyword = (url.searchParams.get('keyword') || q).trim();
    const status = url.searchParams.get('status') || '';
    const isLookup = url.searchParams.has('limit');
    const lookupLimit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    const { page, pageSize, offset } = parsePagination(url);
    const sortBy = url.searchParams.get('sort_by') || 'code';
    const sortDir = url.searchParams.get('sort_dir') === 'desc' ? 'DESC' : 'ASC';
    const sortColumns: Record<string, string> = {
      code: 'code',
      model_name: 'model_name',
      batch_no: 'batch_no',
      used_count: 'used_count',
      usage_limit: 'usage_limit',
      status: 'status',
      created_at: 'created_at',
    };
    const orderBy = sortColumns[sortBy] || sortColumns.code;

    const usageSql = `SELECT warranty_code_id, COUNT(*) AS actual_used_count
                      FROM warranty_records
                      WHERE status IN ('pending', 'active', 'expired')
                      GROUP BY warranty_code_id`;
    const baseSql = `FROM (
        SELECT wc.id, wc.code, wc.product_model_id, wc.imported_product_name, wc.batch_no,
               wc.import_batch_id, wc.owner_org_id, wc.usage_limit,
               MAX(wc.used_count, COALESCE(wu.actual_used_count, 0)) AS used_count,
               CASE
                 WHEN wc.status IN ('frozen', 'voided') THEN wc.status
                 WHEN MAX(wc.used_count, COALESCE(wu.actual_used_count, 0)) >= wc.usage_limit THEN 'exhausted'
                 WHEN MAX(wc.used_count, COALESCE(wu.actual_used_count, 0)) > 0 THEN 'partial_used'
                 ELSE 'in_stock'
               END AS status,
               wc.created_at, pm.display_name AS model_name, pm.model_code
        FROM warranty_codes wc
        JOIN product_models pm ON wc.product_model_id = pm.id
        LEFT JOIN (${usageSql}) wu ON wu.warranty_code_id = wc.id
        WHERE wc.owner_org_id = ?
      ) codes`;

    const conditions = [];
    const params: unknown[] = [user.orgId];

    if (isLookup) {
      conditions.push("status IN ('in_stock', 'partial_used')");
      conditions.push('used_count < usage_limit');
    } else if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (keyword) {
      conditions.push('(code LIKE ? OR model_name LIKE ? OR model_code LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const items = await queryAll(
      context.env.DB,
      `SELECT *
       ${baseSql}
       ${where}
       ORDER BY ${orderBy} ${sortDir}, created_at DESC
       LIMIT ?${isLookup ? '' : ' OFFSET ?'}`,
      ...params,
      isLookup ? lookupLimit : pageSize,
      ...(isLookup ? [] : [offset]),
    );
    const totalRow = isLookup
      ? { cnt: items.length }
      : await queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt ${baseSql} ${where}`,
        ...params,
      );

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[store/warranty-codes GET]', err);
    return error('查询质保码失败', 500);
  }
};
