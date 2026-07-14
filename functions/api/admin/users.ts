// ============================================================
// GET/POST/PUT/DELETE /api/admin/users — 总部管理账号
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, sha256, parsePagination, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
}

/** GET /api/admin/users — 用户列表 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const role = url.searchParams.get('role') || '';
    const orgId = url.searchParams.get('organization_id') || '';
    const status = url.searchParams.get('status') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (role) { conditions.push('u.role = ?'); params.push(role); }
    if (orgId) { conditions.push('u.organization_id = ?'); params.push(orgId); }
    if (status) { conditions.push('u.status = ?'); params.push(status); }
    if (keyword) {
      conditions.push('(u.username LIKE ? OR o.name LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      queryAll(
        context.env.DB,
        `SELECT u.id, u.username, u.role, u.status, u.last_login_at, u.created_at, u.updated_at,
                u.organization_id, o.name AS organization_name, o.type AS organization_type
         FROM users u
         JOIN organizations o ON u.organization_id = o.id
         ${where}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt FROM users u JOIN organizations o ON u.organization_id = o.id ${where}`,
        ...params,
      ),
    ]);

    const total = totalRow?.cnt ?? 0;
    return ok({ items, total, page, pageSize });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return error('获取用户列表失败', 500);
  }
};

/** POST /api/admin/users — 创建账号 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      username?: string;
      password?: string;
      role?: string;
      organization_id?: string;
    };

    const errors: Array<{ field: string; message: string }> = [];
    if (!body.username) errors.push({ field: 'username', message: '用户名不能为空' });
    if (!body.password || body.password.length < 6) errors.push({ field: 'password', message: '密码至少 6 位' });
    if (!body.role || !['HQ_ADMIN', 'PROVINCE', 'STORE'].includes(body.role))
      errors.push({ field: 'role', message: '角色无效' });
    if (!body.organization_id) errors.push({ field: 'organization_id', message: '所属组织不能为空' });
    if (errors.length > 0) return validationError(errors);

    // 检查用户名唯一性
    const existing = await queryFirst(
      context.env.DB,
      `SELECT id FROM users WHERE username = ?`,
      body.username,
    );
    if (existing) return error('用户名已存在', 409);

    // 检查组织
    const org = await queryFirst(
      context.env.DB,
      `SELECT id FROM organizations WHERE id = ? AND status = 'active'`,
      body.organization_id,
    );
    if (!org) return error('指定组织不存在或已停用', 400);

    const id = generateId();
    const passwordHash = await sha256(body.password!);
    const user = getAuthUser(context.data);

    await execute(
      context.env.DB,
      `INSERT INTO users (id, organization_id, username, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
      id, body.organization_id, body.username, passwordHash, body.role,
    );

    await writeOperationLog(
      context.env.DB,
      user?.userId || null,
      'create_user',
      'user',
      id,
      { username: body.username, role: body.role },
      getClientIP(context.request),
    );

    const created = await queryFirst(
      context.env.DB,
      `SELECT u.id, u.username, u.role, u.status, u.organization_id,
              o.name AS organization_name
       FROM users u JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = ?`,
      id,
    );
    return ok(created, '创建成功');
  } catch (err) {
    console.error('[admin/users POST]', err);
    return error('创建用户失败', 500);
  }
};

/** PUT /api/admin/users/:id — 编辑/重置密码/停用 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const parts = url.pathname.split('/');
    const userId = parts[parts.length - 1];

    if (!userId || userId === 'users') {
      return error('缺少用户 ID', 400);
    }

    const body = (await context.request.json()) as {
      role?: string;
      organization_id?: string;
      status?: string;
      password?: string;
    };

    const existing = await queryFirst(context.env.DB, `SELECT id FROM users WHERE id = ?`, userId);
    if (!existing) return error('用户不存在', 404);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.role !== undefined) { updates.push('role = ?'); params.push(body.role); }
    if (body.organization_id !== undefined) { updates.push('organization_id = ?'); params.push(body.organization_id); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.password) {
      const hash = await sha256(body.password!);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (updates.length === 0) return error('没有需要更新的字段', 400);

    updates.push("updated_at = datetime('now')");
    params.push(userId);

    await execute(
      context.env.DB,
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      ...params,
    );

    const user = getAuthUser(context.data);
    await writeOperationLog(
      context.env.DB,
      user?.userId || null,
      'update_user',
      'user',
      userId,
      body,
      getClientIP(context.request),
    );

    const updated = await queryFirst(
      context.env.DB,
      `SELECT u.id, u.username, u.role, u.status, u.organization_id, o.name AS organization_name
       FROM users u JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = ?`,
      userId,
    );
    return ok(updated, '更新成功');
  } catch (err) {
    console.error('[admin/users PUT]', err);
    return error('更新用户失败', 500);
  }
};
