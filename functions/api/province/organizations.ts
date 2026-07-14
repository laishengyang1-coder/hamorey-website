// ============================================================
// GET/POST/PUT /api/province/organizations — 省代管理下属门店
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, batch, writeOperationLog, getAuthUser, hashPassword } from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const url = new URL(context.request.url);
    const status = url.searchParams.get('status') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') || 200)));
    const offset = (page - 1) * pageSize;

    const conditions = [`parent_id = ?`, `type = 'STORE'`];
    const params: unknown[] = [user.orgId];
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (keyword) {
      conditions.push('(name LIKE ? OR code LIKE ? OR contact_name LIKE ?)');
      const value = `%${keyword}%`;
      params.push(value, value, value);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT * FROM organizations ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset),
      queryFirst<{ count: number }>(context.env.DB,
        `SELECT COUNT(*) AS count FROM organizations ${where}`,
        ...params),
    ]);
    return ok({ items, total: totalRow?.count ?? 0, page, pageSize });
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
      address?: string; contact_name?: string; phone?: string;
      username?: string; password?: string;
    };
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.name) errors.push({ field: 'name', message: '门店名称不能为空' });
    if (!body.username) errors.push({ field: 'username', message: '登录账号不能为空' });
    if (!body.password || body.password.length < 8) errors.push({ field: 'password', message: '登录密码至少 8 位' });
    if (errors.length > 0) return validationError(errors);

    // 自动生成门店编码 MD-xxx
    let code = body.code;
    if (!code) {
      const row = await queryFirst<{ max_code: string | null }>(
        context.env.DB,
        `SELECT MAX(code) AS max_code FROM organizations WHERE type = 'STORE'`,
      );
      const maxCode = row?.max_code || '';
      const numPart = maxCode.replace('MD-', '');
      const next = String(parseInt(numPart || '0', 10) + 1).padStart(3, '0');
      code = `MD-${next}`;
    }

    const existing = await queryFirst(context.env.DB, `SELECT id FROM organizations WHERE code = ?`, code);
    if (existing) return error('门店编码已存在', 409);

    const existingUser = await queryFirst(context.env.DB, `SELECT id FROM users WHERE username = ?`, body.username);
    if (existingUser) return error('登录账号已存在', 409);

    const id = generateId();
    const accountId = generateId();
    const profileId = generateId();
    const passwordHash = await hashPassword(body.password!);
    await batch(context.env.DB, [
      {
        sql: `INSERT INTO organizations (id, code, type, parent_id, name, province, city, address, contact_name, phone, status, created_by, created_at, updated_at)
              VALUES (?, ?, 'STORE', ?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now'))`,
        params: [id, code, user.orgId, body.name, body.province || null, body.city || null,
          body.address || null, body.contact_name || null, body.phone || null, user.userId],
      },
      {
        sql: `INSERT INTO users (id, organization_id, username, password_hash, role, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, 'STORE', 'active', datetime('now'), datetime('now'))`,
        params: [accountId, id, body.username, passwordHash],
      },
      {
        sql: `INSERT INTO store_public_profiles (id, organization_id, public_name, auth_level, province, city, address, phone, is_public, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, 'Service_Point', ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))`,
        params: [profileId, id, body.name, body.province || null, body.city || null, body.address || null, body.phone || null],
      },
    ]);

    const { password: _password, ...logDetail } = body;
    await writeOperationLog(context.env.DB, user.userId, 'create_store', 'organization', id, logDetail, getClientIP(context.request));
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
    const fields = ['name', 'province', 'city', 'address', 'contact_name', 'phone', 'status'];
    if (body.status !== undefined && !['active', 'suspended', 'disabled'].includes(String(body.status))) {
      return error('门店状态无效', 400);
    }
    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
    }
    if (updates.length === 0) return error('没有需要更新的字段', 400);
    updates.push("updated_at = datetime('now')");
    params.push(orgId);
    await execute(context.env.DB, `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, ...params);

    if (body.status !== undefined) {
      const accountStatus = body.status === 'active' ? 'active' : 'disabled';
      await execute(context.env.DB,
        `UPDATE users SET status = ?, updated_at = datetime('now') WHERE organization_id = ? AND role = 'STORE'`,
        accountStatus, orgId);
    }

    const profileFields: Record<string, string> = {
      name: 'public_name', province: 'province', city: 'city', address: 'address', phone: 'phone',
    };
    const profileUpdates: string[] = [];
    const profileParams: unknown[] = [];
    for (const [source, target] of Object.entries(profileFields)) {
      if (body[source] !== undefined) { profileUpdates.push(`${target} = ?`); profileParams.push(body[source]); }
    }
    if (body.status !== undefined) { profileUpdates.push('is_public = ?'); profileParams.push(body.status === 'active' ? 1 : 0); }
    if (profileUpdates.length > 0) {
      profileUpdates.push("updated_at = datetime('now')");
      profileParams.push(orgId);
      await execute(context.env.DB,
        `UPDATE store_public_profiles SET ${profileUpdates.join(', ')} WHERE organization_id = ?`,
        ...profileParams);
    }
    const item = await queryFirst(context.env.DB, `SELECT * FROM organizations WHERE id = ?`, orgId);
    return ok(item, '更新成功');
  } catch (err) {
    console.error('[province/organizations PUT]', err);
    return error('更新门店失败', 500);
  }
};
