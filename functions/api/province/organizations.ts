// ============================================================
// GET/POST/PUT /api/province/organizations — 省代管理下属门店
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const items = await queryAll(context.env.DB,
      `SELECT * FROM organizations WHERE parent_id = ? AND type = 'STORE' ORDER BY created_at DESC`,
      user.orgId);
    return ok({ items });
  } catch (err) {
    console.error('[province/organizations GET]', err);
    return error('获取门店列表失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const body = await context.request.json() as {
      code?: string; name?: string; province?: string; city?: string;
      contact_name?: string; phone?: string;
    };
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.code) errors.push({ field: 'code', message: '门店编码不能为空' });
    if (!body.name) errors.push({ field: 'name', message: '门店名称不能为空' });
    if (errors.length > 0) return validationError(errors);

    const existing = await queryFirst(context.env.DB, `SELECT id FROM organizations WHERE code = ?`, body.code);
    if (existing) return error('门店编码已存在', 409);

    const id = generateId();
    await execute(context.env.DB,
      `INSERT INTO organizations (id, code, type, parent_id, name, province, city, contact_name, phone, status, created_by, created_at, updated_at)
       VALUES (?, ?, 'STORE', ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now'))`,
      id, body.code, user.orgId, body.name, body.province || null, body.city || null,
      body.contact_name || null, body.phone || null, user.userId,
    );

    await writeOperationLog(context.env.DB, user.userId, 'create_store', 'organization', id, body, getClientIP(context.request));
    const item = await queryFirst(context.env.DB, `SELECT * FROM organizations WHERE id = ?`, id);
    return ok(item, '创建成功');
  } catch (err) {
    console.error('[province/organizations POST]', err);
    return error('创建门店失败', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    const url = new URL(context.request.url);
    const parts = url.pathname.split('/');
    const orgId = parts[parts.length - 1];
    if (!orgId || orgId === 'organizations') return error('缺少门店 ID', 400);

    const existing = await queryFirst(context.env.DB, `SELECT id FROM organizations WHERE id = ? AND parent_id = ?`, orgId, user?.orgId);
    if (!existing) return error('门店不存在或无权限', 404);

    const body = await context.request.json() as Record<string, unknown>;
    const updates: string[] = [];
    const params: unknown[] = [];
    const fields = ['name', 'province', 'city', 'contact_name', 'phone', 'status'];
    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
    }
    if (updates.length === 0) return error('没有需要更新的字段', 400);
    updates.push("updated_at = datetime('now')");
    params.push(orgId);
    await execute(context.env.DB, `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const item = await queryFirst(context.env.DB, `SELECT * FROM organizations WHERE id = ?`, orgId);
    return ok(item, '更新成功');
  } catch (err) {
    console.error('[province/organizations PUT]', err);
    return error('更新门店失败', 500);
  }
};
