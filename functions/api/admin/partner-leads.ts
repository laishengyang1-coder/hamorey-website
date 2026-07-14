// ============================================================
// GET/PUT /api/admin/partner-leads — 合作线索管理
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, execute } from '../_lib';
import { ok, error } from '../_middleware';
import { parsePagination } from '../_lib';

interface Env { DB: D1Database; }

/** GET — 合作线索列表 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const followStatus = url.searchParams.get('followStatus') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (followStatus) { conditions.push('follow_status = ?'); params.push(followStatus); }
    if (keyword) { conditions.push('(name LIKE ? OR phone LIKE ? OR company_name LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB, `SELECT * FROM partner_leads ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, ...params, pageSize, offset),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt FROM partner_leads ${where}`, ...params),
    ]);
    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[admin/partner-leads GET]', err);
    return error('获取线索列表失败', 500);
  }
};

/** PUT /api/admin/partner-leads/:id — 更新跟进状态 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const parts = new URL(context.request.url).pathname.split('/');
    const id = parts[parts.length - 1];
    if (!id || id === 'partner-leads') return error('缺少线索 ID', 400);

    const body = await context.request.json() as {
      follow_status?: string; assigned_to?: string; note?: string;
    };

    const updates: string[] = [];
    const params: unknown[] = [];
    if (body.follow_status) { updates.push('follow_status = ?'); params.push(body.follow_status); }
    if (body.assigned_to) { updates.push('assigned_to = ?'); params.push(body.assigned_to); }
    if (updates.length === 0) return error('没有需要更新的字段', 400);

    updates.push("updated_at = datetime('now')");
    params.push(id);
    await execute(context.env.DB, `UPDATE partner_leads SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const item = await queryFirst(context.env.DB, `SELECT * FROM partner_leads WHERE id = ?`, id);
    return ok(item, '更新成功');
  } catch (err) {
    console.error('[admin/partner-leads PUT]', err);
    return error('更新线索失败', 500);
  }
};
