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
    const isLookup = url.searchParams.has('limit');
    const lookupLimit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    const { page, pageSize, offset } = parsePagination(url);
    const sortBy = url.searchParams.get('sort_by') || 'code';
    const sortDir = url.searchParams.get('sort_dir') === 'desc' ? 'DESC' : 'ASC';
    const sortColumns: Record<string, string> = {
      code: 'wc.code',
      model_name: 'pm.display_name',
      batch_no: 'wc.batch_no',
      used_count: 'wc.used_count',
      usage_limit: 'wc.usage_limit',
      status: 'wc.status',
      created_at: 'wc.created_at',
    };
    const orderBy = sortColumns[sortBy] || sortColumns.code;

    const conditions = [
      'wc.owner_org_id = ?',
      "wc.status IN ('in_stock', 'partial_used')",
      'wc.used_count < wc.usage_limit',
    ];
    const params: unknown[] = [user.orgId];

    if (q) {
      conditions.push('wc.code LIKE ?');
      params.push(`%${q}%`);
    }

    const items = await queryAll(
      context.env.DB,
      `SELECT wc.id, wc.code, wc.status, wc.batch_no, wc.used_count, wc.usage_limit,
              pm.display_name AS model_name, pm.model_code
       FROM warranty_codes wc
       JOIN product_models pm ON wc.product_model_id = pm.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy} ${sortDir}, wc.created_at DESC
       LIMIT ?${isLookup ? '' : ' OFFSET ?'}`,
      ...params,
      isLookup ? lookupLimit : pageSize,
      ...(isLookup ? [] : [offset]),
    );
    const totalRow = isLookup
      ? { cnt: items.length }
      : await queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt FROM warranty_codes wc WHERE ${conditions.join(' AND ')}`,
        ...params,
      );

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[store/warranty-codes GET]', err);
    return error('查询质保码失败', 500);
  }
};
