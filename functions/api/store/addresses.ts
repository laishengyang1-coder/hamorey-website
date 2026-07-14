// ============================================================
// GET/POST/PUT/DELETE /api/store/addresses — 门店收货地址
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute , getAuthUser} from '../_lib';
import { ok, error, validationError } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    const items = await queryAll(context.env.DB,
      `SELECT * FROM addresses WHERE organization_id = ? ORDER BY is_default DESC, created_at DESC`, user.orgId);
    return ok({ items });
  } catch (err) {
    console.error('[store/addresses GET]', err);
    return error('获取地址失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const body = await context.request.json() as {
      recipient_name?: string; phone?: string; province?: string;
      city?: string; district?: string; detail_address?: string; is_default?: boolean;
    };
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.recipient_name) errors.push({ field: 'recipient_name', message: '收件人不能为空' });
    if (!body.phone) errors.push({ field: 'phone', message: '联系电话不能为空' });
    if (!body.province) errors.push({ field: 'province', message: '省份不能为空' });
    if (!body.city) errors.push({ field: 'city', message: '城市不能为空' });
    if (!body.detail_address) errors.push({ field: 'detail_address', message: '详细地址不能为空' });
    if (errors.length > 0) return validationError(errors);

    if (body.is_default) {
      await execute(context.env.DB, `UPDATE addresses SET is_default = 0 WHERE organization_id = ?`, user.orgId);
    }

    const id = generateId();
    await execute(context.env.DB,
      `INSERT INTO addresses (id, organization_id, recipient_name, phone, province, city, district, detail_address, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      id, user.orgId, body.recipient_name, body.phone, body.province, body.city,
      body.district || null, body.detail_address, body.is_default ? 1 : 0);
    const item = await queryFirst(context.env.DB, `SELECT * FROM addresses WHERE id = ?`, id);
    return ok(item, '创建成功');
  } catch (err) {
    console.error('[store/addresses POST]', err);
    return error('创建地址失败', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    const parts = new URL(context.request.url).pathname.split('/');
    const id = parts[parts.length - 1];
    if (!id || id === 'addresses') return error('缺少地址 ID', 400);

    const existing = await queryFirst(context.env.DB, `SELECT id FROM addresses WHERE id = ? AND organization_id = ?`, id, user?.orgId);
    if (!existing) return error('地址不存在', 404);

    const body = await context.request.json() as Record<string, unknown>;
    if (body.is_default) {
      await execute(context.env.DB, `UPDATE addresses SET is_default = 0 WHERE organization_id = ?`, user?.orgId);
    }
    const updates: string[] = [];
    const params: unknown[] = [];
    const fields = ['recipient_name', 'phone', 'province', 'city', 'district', 'detail_address', 'is_default'];
    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(typeof body[f] === 'boolean' ? (body[f] ? 1 : 0) : body[f]); }
    }
    if (updates.length === 0) return error('没有需要更新的字段', 400);
    updates.push("updated_at = datetime('now')");
    params.push(id);
    await execute(context.env.DB, `UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const item = await queryFirst(context.env.DB, `SELECT * FROM addresses WHERE id = ?`, id);
    return ok(item, '更新成功');
  } catch (err) {
    console.error('[store/addresses PUT]', err);
    return error('更新地址失败', 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    const parts = new URL(context.request.url).pathname.split('/');
    const id = parts[parts.length - 1];
    if (!id || id === 'addresses') return error('缺少地址 ID', 400);
    await execute(context.env.DB, `DELETE FROM addresses WHERE id = ? AND organization_id = ?`, id, user?.orgId);
    return ok(null, '删除成功');
  } catch (err) {
    console.error('[store/addresses DELETE]', err);
    return error('删除地址失败', 500);
  }
};
