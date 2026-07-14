// ============================================================
// GET /api/auth/me — 获取当前用户信息
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);

    if (!user) {
      return error('未登录', 401);
    }

    return ok({
      id: user.userId,
      username: user.username,
      role: user.role,
      organization: {
        id: user.orgId,
        name: user.orgName,
        type: user.orgType,
      },
    });
  } catch (err) {
    console.error('[auth/me]', err);
    return error('获取用户信息失败', 500);
  }
};
