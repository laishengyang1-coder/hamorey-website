// ============================================================
// POST /api/admin/upload-url — HQ_ADMIN 获取 R2 直传预签名 URL
// 用于积分商城商品封面图上传，使用 reward-covers/ 路径前缀
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
    const body = (await context.request.json()) as { fileName?: string; contentType?: string };
    if (!body.fileName) return error('缺少文件名', 400);

    const user = getAuthUser(context.data);
    if (!user || user.role !== 'HQ_ADMIN') return error('仅总部管理员可上传', 403);

    const ext = body.fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp']);
    if (!allowedExtensions.has(ext)) return error('仅支持 JPG、PNG 或 WebP 图片', 400);

    const fileKey = `reward-covers/${generateId()}.${ext}`;
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
