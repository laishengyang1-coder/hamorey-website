// ============================================================
// POST /api/auth/logout — 登出（删除当前 Session）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { deleteSession } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return error('未提供认证令牌', 401);
    }

    const token = authHeader.slice(7);
    await deleteSession(context.env.DB, token);

    return ok(null, '已登出');
  } catch (err) {
    console.error('[auth/logout]', err);
    return error('登出失败', 500);
  }
};
