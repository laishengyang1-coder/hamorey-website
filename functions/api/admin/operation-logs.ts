// ============================================================
// GET /api/admin/operation-logs — 操作日志列表
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll } from '../_lib';
import { ok, error } from '../_middleware';
import { parsePagination } from '../_lib';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const action = url.searchParams.get('action') || '';
    const userId = url.searchParams.get('userId') || '';
    const targetType = url.searchParams.get('targetType') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (action) { conditions.push('ol.action = ?'); params.push(action); }
    if (userId) { conditions.push('ol.user_id = ?'); params.push(userId); }
    if (targetType) { conditions.push('ol.target_type = ?'); params.push(targetType); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT ol.*, u.username AS operator_name
         FROM operation_logs ol
         LEFT JOIN users u ON u.id = ol.user_id
         ${where} ORDER BY ol.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset),
      queryFirst<{ cnt: number }>(context.env.DB,
        `SELECT COUNT(*) AS cnt FROM operation_logs ol ${where}`, ...params),
    ]);
    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[admin/operation-logs GET]', err);
    return error('获取操作日志失败', 500);
  }
};
