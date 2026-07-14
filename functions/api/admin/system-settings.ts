// ============================================================
// GET/PUT /api/admin/system-settings — 系统设置
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, execute , getAuthUser} from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const items = await queryAll(context.env.DB,
      `SELECT * FROM system_settings ORDER BY key ASC`);
    return ok({ items });
  } catch (err) {
    console.error('[admin/system-settings GET]', err);
    return error('获取系统设置失败', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const parts = new URL(context.request.url).pathname.split('/');
    const id = parts[parts.length - 1];
    if (!id || id === 'system-settings') return error('缺少设置 ID', 400);

    const body = await context.request.json() as { value?: string; description?: string };
    const existing = await queryFirst(context.env.DB, `SELECT id FROM system_settings WHERE id = ?`, id);
    if (!existing) return error('设置不存在', 404);

    const updates: string[] = [];
    const params: unknown[] = [];
    if (body.value !== undefined) { updates.push('value = ?'); params.push(body.value); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
    if (updates.length === 0) return error('没有需要更新的字段', 400);

    const user = getAuthUser(context.data);
    updates.push('updated_by = ?'); params.push(user?.userId || null);
    updates.push("updated_at = datetime('now')");
    params.push(id);
    await execute(context.env.DB, `UPDATE system_settings SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const item = await queryFirst(context.env.DB, `SELECT * FROM system_settings WHERE id = ?`, id);
    return ok(item, '更新成功');
  } catch (err) {
    console.error('[admin/system-settings PUT]', err);
    return error('更新系统设置失败', 500);
  }
};
