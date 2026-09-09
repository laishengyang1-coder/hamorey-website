// ============================================================
// POST /api/store/film-exchange-media-url — 换膜无忧照片/视频上传预签名 URL
// 支持图片 + 视频，路径前缀 film-exchange/<orgId>/
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov']);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { fileName?: string; contentType?: string };
    if (!body.fileName) return error('缺少文件名', 400);

    const user = getAuthUser(context.data);
    if (!user || user.role !== 'STORE') return error('无权上传', 403);

    const ext = body.fileName.split('.').pop()?.toLowerCase() || '';
    const isImage = IMAGE_EXTENSIONS.has(ext);
    const isVideo = VIDEO_EXTENSIONS.has(ext);
    if (!isImage && !isVideo) return error('仅支持 JPG、PNG、WebP 图片或 MP4、MOV 视频', 400);

    const mediaType = isVideo ? 'video' : 'image';
    const fileKey = `film-exchange/${user?.orgId}/${generateId()}.${ext}`;
    const uploadUrl = new URL(`/api/r2-upload/${fileKey}`, context.request.url).toString();

    return ok({ uploadUrl, fileKey, mediaType, expiresIn: 300 });
  } catch (err) {
    console.error('[store/film-exchange-media-url]', err);
    return error('生成上传URL失败', 500);
  }
};
