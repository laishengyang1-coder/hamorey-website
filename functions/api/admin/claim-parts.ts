// ============================================================
// GET/POST/PUT /api/admin/claim-parts — 报价部位管理
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryAll, execute } from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const items = await queryAll(context.env.DB,
      `SELECT * FROM claim_parts ORDER BY category, sort_order`);
    return ok({ items });
  } catch (err) { console.error('[claim-parts GET]', err); return error('获取部位列表失败', 500); }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { name?: string; category?: string; sort_order?: number };
    if (!body.name || !body.category) return error('缺少必填字段', 400);

    const id = generateId();
    await execute(context.env.DB,
      `INSERT INTO claim_parts (id, name, category, sort_order, status)
       VALUES (?, ?, ?, ?, 'active')`,
      id, body.name, body.category, body.sort_order || 0);
    return ok({ id }, '创建成功');
  } catch (err) { console.error('[claim-parts POST]', err); return error('创建部位失败', 500); }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const partId = url.pathname.split('/').pop();
    if (!partId || partId === 'claim-parts') return error('缺少部位 ID', 400);

    const body = (await context.request.json()) as { name?: string; category?: string; sort_order?: number; status?: string };
    const updates: string[] = []; const params: unknown[] = [];
    if (body.name) { updates.push('name = ?'); params.push(body.name); }
    if (body.category) { updates.push('category = ?'); params.push(body.category); }
    if (body.sort_order != null) { updates.push('sort_order = ?'); params.push(body.sort_order); }
    if (body.status) { updates.push('status = ?'); params.push(body.status); }
    if (updates.length === 0) return error('没有可更新的字段', 400);

    params.push(partId);
    await execute(context.env.DB, `UPDATE claim_parts SET ${updates.join(', ')} WHERE id = ?`, ...params);
    return ok(null, '更新成功');
  } catch (err) { console.error('[claim-parts PUT]', err); return error('更新失败', 500); }
};
