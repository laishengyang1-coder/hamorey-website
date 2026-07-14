// ============================================================
// GET/POST/PUT/DELETE /api/admin/rewards — 商城商品 CRUD
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute } from '../_lib';
import { ok, error, validationError } from '../_middleware';

interface Env { DB: D1Database; }

/** GET — 商品列表 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category') || '';
    const status = url.searchParams.get('status') || '';

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (status) { conditions.push('status = ?'); params.push(status); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const items = await queryAll(
      context.env.DB,
      `SELECT * FROM rewards ${where} ORDER BY sort_order ASC, created_at DESC`,
      ...params,
    );
    return ok({ items });
  } catch (err) {
    console.error('[admin/rewards GET]', err);
    return error('获取商品列表失败', 500);
  }
};

/** POST — 创建商品 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      category?: string; name?: string; cover_file_key?: string;
      points_required?: number; stock_quantity?: number;
      description?: string; sort_order?: number;
    };
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.name) errors.push({ field: 'name', message: '商品名称不能为空' });
    if (!body.points_required || body.points_required <= 0) errors.push({ field: 'points_required', message: '所需积分必须大于0' });
    if (errors.length > 0) return validationError(errors);

    const id = generateId();
    await execute(context.env.DB,
      `INSERT INTO rewards (id, category, name, cover_file_key, points_required, stock_quantity, stock_status, description, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      id, body.category || null, body.name, body.cover_file_key || null,
      body.points_required, body.stock_quantity ?? null,
      (body.stock_quantity !== undefined && body.stock_quantity > 0) ? 'available' : 'out_of_stock',
      body.description || null, body.sort_order ?? 0,
    );
    const item = await queryFirst(context.env.DB, `SELECT * FROM rewards WHERE id = ?`, id);
    return ok(item, '创建成功');
  } catch (err) {
    console.error('[admin/rewards POST]', err);
    return error('创建商品失败', 500);
  }
};

/** PUT /api/admin/rewards/:id */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const parts = new URL(context.request.url).pathname.split('/');
    const id = parts[parts.length - 1];
    if (!id || id === 'rewards') return error('缺少商品 ID', 400);

    const body = await context.request.json() as Record<string, unknown>;
    const existing = await queryFirst(context.env.DB, `SELECT id FROM rewards WHERE id = ?`, id);
    if (!existing) return error('商品不存在', 404);

    const updates: string[] = [];
    const params: unknown[] = [];
    if (body.category !== undefined) { updates.push('category = ?'); params.push(body.category); }
    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.cover_file_key !== undefined) { updates.push('cover_file_key = ?'); params.push(body.cover_file_key); }
    if (body.points_required !== undefined) { updates.push('points_required = ?'); params.push(body.points_required); }
    if (body.stock_quantity !== undefined) {
      updates.push('stock_quantity = ?'); params.push(body.stock_quantity);
      const sq = Number(body.stock_quantity);
      updates.push('stock_status = ?'); params.push(sq > 0 ? 'available' : 'out_of_stock');
    }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
    if (body.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(body.sort_order); }
    if (updates.length === 0) return error('没有需要更新的字段', 400);

    updates.push("updated_at = datetime('now')");
    params.push(id);
    await execute(context.env.DB, `UPDATE rewards SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const item = await queryFirst(context.env.DB, `SELECT * FROM rewards WHERE id = ?`, id);
    return ok(item, '更新成功');
  } catch (err) {
    console.error('[admin/rewards PUT]', err);
    return error('更新商品失败', 500);
  }
};

/** DELETE /api/admin/rewards/:id — 下架商品 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const parts = new URL(context.request.url).pathname.split('/');
    const id = parts[parts.length - 1];
    if (!id || id === 'rewards') return error('缺少商品 ID', 400);

    await execute(context.env.DB, `UPDATE rewards SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`, id);
    return ok(null, '下架成功');
  } catch (err) {
    console.error('[admin/rewards DELETE]', err);
    return error('下架商品失败', 500);
  }
};
