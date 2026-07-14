// ============================================================
// POST /api/store/upload-url — 获取 R2 直传预签名 URL
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
    const ext = body.fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const fileKey = `warranty-photos/${user?.orgId}/${generateId()}.${ext}`;
    const contentType = body.contentType || `image/${ext === 'png' ? 'png' : 'jpeg'}`;

    // R2 presigned URL（Cloudflare R2 支持通过 S3 兼容 API 生成）
    // 这里使用简单的上传方式：直接上传到 R2，返回 key 供后续使用
    // 实际生产环境应使用 presigned URL

    // 生成上传 URL（模拟 presigned URL 模式）
    const uploadUrl = `/api/r2-upload/${fileKey}`;

    return ok({
      uploadUrl,
      fileKey,
      expiresIn: 300,
    });
  } catch (err) {
    console.error('[store/upload-url]', err);
    return error('生成上传URL失败', 500);
  }
};
