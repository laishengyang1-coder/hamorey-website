// ============================================================
// GET /api/public/photos/* — 读取 R2 施工照片（需登录，任意角色）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { getAuthUser, queryFirst } from '../../_lib';
import { error } from '../../_middleware';

interface Env {
  R2: R2Bucket;
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    let authUser = getAuthUser(context.data);

    // 支持 ?token= 参数（用于 <img> 标签无法带 Authorization header）
    if (!authUser) {
      const queryToken = url.searchParams.get('token');
      if (queryToken) {
        const session = await queryFirst<{ user_id: string; username: string; organization_id: string; role: string; org_type: string; org_name: string }>(
          context.env.DB,
          `SELECT s.user_id, u.username, u.organization_id, u.role, o.type AS org_type, o.name AS org_name
           FROM sessions s
           JOIN users u ON s.user_id = u.id
           JOIN organizations o ON u.organization_id = o.id
           WHERE s.token = ? AND s.expires_at > datetime('now') AND u.status = 'active'`,
          queryToken,
        );
        if (session) {
          authUser = { userId: session.user_id, username: session.username, orgId: session.organization_id, role: session.role, orgType: session.org_type, orgName: session.org_name };
        }
      }
    }

    if (!authUser) return error('请先登录', 401);

    const pathname = url.pathname;
    const fileKey = pathname.replace(/^\/api\/public\/photos\//, '');
    if (!fileKey || fileKey.includes('..')) return error('无效的图片路径', 400);

    const object = await context.env.R2.get(fileKey);
    if (!object) return error('图片不存在', 404);

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Content-Length', String(object.size));

    return new Response(object.body, { headers, status: 200 });
  } catch (err) {
    console.error('[public/photos]', err);
    return error('读取图片失败', 500);
  }
};
