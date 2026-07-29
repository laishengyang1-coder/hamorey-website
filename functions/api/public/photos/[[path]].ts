// ============================================================
// GET /api/public/photos/* — 读取对象存储图片（施工照片按组织权限校验）
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
    const pathname = url.pathname;
    const fileKey = decodeURIComponent(pathname.replace(/^\/api\/public\/photos\//, ''));
    if (!fileKey || fileKey.includes('..')) return error('无效的图片路径', 400);

    // reward-covers 是公开商品封面，不要求登录。新版本小程序优先走 COS
    // 直链；这里保留为旧版客户端与直链失败时的兼容回退。
    if (fileKey.startsWith('reward-covers/')) {
      const object = await context.env.R2.get(fileKey);
      if (!object) return error('图片不存在', 404);
      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': String(object.size),
          'X-Content-Type-Options': 'nosniff',
        },
        status: 200,
      });
    }

    const authUser = getAuthUser(context.data);
    if (!authUser) return error('请先登录', 401);

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
