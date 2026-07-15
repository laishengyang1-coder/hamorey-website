// ============================================================
// GET/POST/PUT/DELETE /api/admin/points-rules — 积分规则 CRUD
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryAll, queryFirst, execute, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const items = await queryAll(context.env.DB,
      `SELECT pr.*, pm.model_code, pm.display_name AS model_name
       FROM points_rules pr JOIN product_models pm ON pr.product_model_id = pm.id
       WHERE pm.status = 'active'
       ORDER BY pr.updated_at DESC`);
    return ok({ items });
  } catch (err) { console.error('[points-rules GET]', err); return error('获取积分规则失败', 500); }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { product_model_id?: string; points?: number; effective_from?: string; effective_to?: string };
    if (!body.product_model_id || body.points == null || !body.effective_from) return error('缺少必填字段', 400);

    const model = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT id FROM product_models WHERE id = ? AND status = 'active'`,
      body.product_model_id,
    );
    if (!model) return error('请选择产品管理中启用的产品型号', 400);

    const id = generateId();
    const user = getAuthUser(context.data);
    await execute(context.env.DB,
      `INSERT INTO points_rules (id, product_model_id, points, effective_from, effective_to, status, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))`,
      id, body.product_model_id, body.points, body.effective_from, body.effective_to || null, user?.userId || null);

    await writeOperationLog(context.env.DB, user?.userId || null, 'create_points_rule', 'points_rules', id, body, getClientIP(context.request));
    return ok({ id }, '创建成功');
  } catch (err) { console.error('[points-rules POST]', err); return error('创建积分规则失败', 500); }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const ruleId = url.pathname.split('/').pop();
    if (!ruleId || ruleId === 'points-rules') return error('缺少规则 ID', 400);

    const body = (await context.request.json()) as { points?: number; effective_from?: string; effective_to?: string; status?: string };
    const user = getAuthUser(context.data);
    const updates: string[] = []; const params: unknown[] = [];
    if (body.points != null) { updates.push('points = ?'); params.push(body.points); }
    if (body.effective_from) { updates.push('effective_from = ?'); params.push(body.effective_from); }
    if (body.effective_to !== undefined) { updates.push('effective_to = ?'); params.push(body.effective_to); }
    if (body.status) { updates.push('status = ?'); params.push(body.status); }
    if (updates.length === 0) return error('没有可更新的字段', 400);

    updates.push("updated_at = datetime('now'), updated_by = ?");
    params.push(user?.userId || null, ruleId);

    await execute(context.env.DB, `UPDATE points_rules SET ${updates.join(', ')} WHERE id = ?`, ...params);
    await writeOperationLog(context.env.DB, user?.userId || null, 'update_points_rule', 'points_rules', ruleId, body, getClientIP(context.request));
    return ok(null, '更新成功');
  } catch (err) { console.error('[points-rules PUT]', err); return error('更新失败', 500); }
};
