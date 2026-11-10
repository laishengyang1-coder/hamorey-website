// ============================================================
// POST /api/admin/upload-url — HQ_ADMIN 获取上传地址
// 用于积分商城商品封面（默认 reward-covers/）与首页轮播图（banners/）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId , getAuthUser} from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { fileName?: string; contentType?: string; prefix?: string };
    if (!body.fileName) return error('缺少文件名', 400);

    const user = getAuthUser(context.data);
    if (!user || user.role !== 'HQ_ADMIN') return error('仅总部管理员可上传', 403);

    const ext = body.fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp']);
    if (!allowedExtensions.has(ext)) return error('仅支持 JPG、PNG 或 WebP 图片', 400);

    // 白名单前缀，避免客户端拼出任意路径（r2-upload 侧还有一次校验）
    const prefix = body.prefix === 'banners' ? 'banners' : 'reward-covers';
    const fileKey = `${prefix}/${generateId()}.${ext}`;
    const uploadUrl = new URL(`/api/r2-upload/${fileKey}`, context.request.url).toString();

    return ok({
      uploadUrl,
      fileKey,
      expiresIn: 300,
    });
  } catch (err) {
    console.error('[admin/upload-url]', err);
    return error('生成上传URL失败', 500);
  }
};
