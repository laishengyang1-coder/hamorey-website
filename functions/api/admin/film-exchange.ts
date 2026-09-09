// ============================================================
// GET /api/admin/film-exchange — 换膜无忧申请审核列表（总部）
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
    const status = url.searchParams.get('status') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const sort = url.searchParams.get('sort') === 'updated' ? 'updated' : 'created';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];

    // 支持逗号分隔多状态（如 status=completed,rejected 查历史记录）
    if (status) {
      const statusList = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statusList.length === 1) {
        conditions.push('r.status = ?');
        params.push(statusList[0]);
      } else if (statusList.length > 1) {
        conditions.push(`r.status IN (${statusList.map(() => '?').join(',')})`);
        params.push(...statusList);
      }
    }
    if (keyword) {
      conditions.push('(r.customer_name_snapshot LIKE ? OR r.customer_phone_snapshot LIKE ? OR r.plate_no_snapshot LIKE ? OR r.store_name_snapshot LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderCol = sort === 'updated' ? 'r.updated_at' : 'r.created_at';

    const [items, totalRow] = await Promise.all([
      queryAll(
        context.env.DB,
        `SELECT r.* FROM film_exchange_requests r ${where} ORDER BY ${orderCol} DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt FROM film_exchange_requests r ${where}`,
        ...params,
      ),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[admin/film-exchange GET]', err);
    return error('获取换膜审核列表失败', 500);
  }
};
