// ============================================================
// GET /api/public/photos/* — 读取 R2 施工照片（按组织权限校验）
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
    const authUser = getAuthUser(context.data);
    if (!authUser) return error('请先登录', 401);

    const pathname = url.pathname;
    const fileKey = decodeURIComponent(pathname.replace(/^\/api\/public\/photos\//, ''));
    if (!fileKey || fileKey.includes('..')) return error('无效的图片路径', 400);

    const object = await context.env.R2.get(fileKey);
    if (!object) return error('图片不存在', 404);

    const ownerOrgId = object.customMetadata?.organizationId
      || fileKey.match(/^warranty-photos\/([^/]+)\//)?.[1]
      || '';
    let allowed = authUser.role === 'HQ_ADMIN';
    if (authUser.role === 'STORE') allowed = ownerOrgId === authUser.orgId;
    if (authUser.role === 'PROVINCE' && ownerOrgId) {
      const childStore = await queryFirst<{ id: string }>(
        context.env.DB,
        `SELECT id FROM organizations WHERE id = ? AND parent_id = ? AND type = 'STORE'`,
        ownerOrgId,
        authUser.orgId,
      );
      allowed = Boolean(childStore);
    }
    if (!allowed) return error('图片不存在', 404);

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'private, max-age=300');
    headers.set('Content-Length', String(object.size));
    headers.set('Vary', 'Authorization');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(object.body, { headers, status: 200 });
  } catch (err) {
    console.error('[public/photos]', err);
    return error('读取图片失败', 500);
  }
};
