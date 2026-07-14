// ============================================================
// PUT /api/province/account — 省代修改密码
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, execute, sha256 , getAuthUser} from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const body = await context.request.json() as { old_password?: string; new_password?: string };
    if (!body.old_password) return error('原密码不能为空', 400);
    if (!body.new_password || body.new_password.length < 6) return error('新密码不能少于6位', 400);

    const dbUser = await queryFirst<{ password_hash: string }>(
      context.env.DB, `SELECT password_hash FROM users WHERE id = ?`, user.userId);
    if (!dbUser) return error('用户不存在', 404);

    const oldHash = await sha256(body.old_password);
    if (oldHash !== dbUser.password_hash) return error('原密码错误', 400);

    const newHash = await sha256(body.new_password);
    await execute(context.env.DB,
      `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`, newHash, user.userId);

    return ok(null, '密码修改成功');
  } catch (err) {
    console.error('[province/account PUT]', err);
    return error('修改密码失败', 500);
  }
};
