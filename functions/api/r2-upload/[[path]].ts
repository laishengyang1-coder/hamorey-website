// ============================================================
// POST /api/r2-upload/* — authenticated warranty photo upload
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  R2: R2Bucket;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_CONTENT_TYPES = new Set(['video/mp4', 'video/quicktime', 'application/octet-stream']);

interface UploadedFile {
  type: string;
  size: number;
  stream(): ReadableStream;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('请先登录', 401);

    const pathname = new URL(context.request.url).pathname;
    const encodedKey = pathname.replace(/^\/api\/r2-upload\//, '');
    const fileKey = decodeURIComponent(encodedKey);

    // 路径安全校验
    if (fileKey.includes('..')) return error('上传路径无效', 403);

    // 角色 + 路径前缀校验
    if (user.role === 'STORE' || user.role === 'PROVINCE') {
      const expectedPrefix = `warranty-photos/${user.orgId}/`;
      const filmExchangePrefix = `film-exchange/${user.orgId}/`;
      if (!fileKey.startsWith(expectedPrefix) && !fileKey.startsWith(filmExchangePrefix))
        return error('上传路径无效', 403);
    } else if (user.role === 'HQ_ADMIN') {
      if (!fileKey.startsWith('reward-covers/')) return error('上传路径无效', 403);
    } else {
      return error('无权上传', 403);
    }

    const isFilmExchange = fileKey.startsWith('film-exchange/');

    const form = await context.request.formData();
    const entry = form.get('file') as unknown;
    if (!entry || typeof entry === 'string') return error('缺少文件', 400);
    const file = entry as UploadedFile;

    if (isFilmExchange) {
      // 换膜无忧：支持图片或视频
      const isVideo = VIDEO_CONTENT_TYPES.has(file.type);
      const isImage = IMAGE_CONTENT_TYPES.has(file.type);
      if (!isImage && !isVideo) return error('仅支持 JPG、PNG、WebP 图片或 MP4、MOV 视频', 400);
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size <= 0 || file.size > maxSize)
        return error(isVideo ? '视频大小必须在 50MB 以内' : '图片大小必须在 10MB 以内', 400);
    } else {
      if (!IMAGE_CONTENT_TYPES.has(file.type)) return error('仅支持 JPG、PNG 或 WebP 图片', 400);
      if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) return error('图片大小必须在 10MB 以内', 400);
    }

    await context.env.R2.put(fileKey, file.stream(), {
      // 商品封面使用不可变 UUID 文件名，可被客户端长期缓存；施工照片继续私有。
      httpMetadata: {
        contentType: file.type,
        cacheControl: fileKey.startsWith('reward-covers/')
          ? 'public, max-age=31536000, immutable'
          : 'private, max-age=300',
      },
      customMetadata: { organizationId: user.orgId, uploadedBy: user.userId },
    });

    return ok({ fileKey, size: file.size, contentType: file.type }, '上传成功');
  } catch (err) {
    console.error('[r2-upload]', err);
    return error('图片上传失败', 500);
  }
};
