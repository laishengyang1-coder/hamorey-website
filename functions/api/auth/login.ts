// ============================================================
// POST /api/auth/login — 用户名密码登录
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { verifyPassword, hashPassword, createSession, queryFirst, execute } from '../_lib';
import { jsonResponse, ok, error, getClientIP } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const { username, password } = body;

    // 校验必填字段
    if (!username || !password) {
      return error('用户名和密码不能为空', 400);
    }

    // 查询用户
    const user = await queryFirst<{
      id: string;
      organization_id: string;
      username: string;
      password_hash: string;
      role: string;
      status: string;
    }>(
      env.DB,
      `SELECT u.id, u.organization_id, u.username, u.password_hash, u.role, u.status
       FROM users u WHERE u.username = ?`,
      username,
    );

    if (!user) {
      return error('用户名或密码错误', 401);
    }

    if (user.status !== 'active') {
      return error('账号已被停用或锁定，请联系管理员', 403);
    }

    // 验证密码
    if (!(await verifyPassword(password, user.password_hash))) {
      return error('用户名或密码错误', 401);
    }

    if (!user.password_hash.startsWith('pbkdf2$')) {
      await execute(
        env.DB,
        `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
        await hashPassword(password),
        user.id,
      );
    }

    // 查询组织信息
    const org = await queryFirst<{
      id: string;
      type: string;
      name: string;
      province: string | null;
      city: string | null;
      status: string;
    }>(
      env.DB,
      `SELECT id, type, name, province, city, status FROM organizations WHERE id = ?`,
      user.organization_id,
    );

    const expectedRole = org?.type === 'HQ' ? 'HQ_ADMIN' : org?.type;
    if (!org || org.status !== 'active' || expectedRole !== user.role) {
      return error('账号所属组织无效，请联系管理员', 403);
    }

    // 创建 Session
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const { token, expiresAt } = await createSession(env.DB, user.id, clientIP, userAgent);

    // 更新最后登录时间
    await execute(
      env.DB,
      `UPDATE users SET last_login_at = datetime('now') WHERE id = ?`,
      user.id,
    );

    return ok({
      token,
      expiresAt,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        organization: {
          id: org?.id,
          name: org?.name,
          type: org?.type,
          province: org?.province,
          city: org?.city,
        },
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return error('登录失败，请稍后重试', 500);
  }
};
