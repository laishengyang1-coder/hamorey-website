// ============================================================
// GET /api/admin/content-entries — 内容条目列表
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll } from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const page = url.searchParams.get('page') || '';
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (page) { conditions.push('page = ?'); params.push(page); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const items = await queryAll(context.env.DB,
      `SELECT * FROM content_entries ${where} ORDER BY page ASC, sort_order ASC`, ...params);
    return ok({ items });
  } catch (err) {
    console.error('[admin/content-entries GET]', err);
    return error('获取内容列表失败', 500);
  }
};
