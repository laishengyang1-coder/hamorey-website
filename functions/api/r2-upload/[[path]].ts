// ============================================================
// POST /api/r2-upload/* — authenticated warranty photo upload
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  R2: R2Bucket;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface UploadedFile {
  type: string;
  size: number;
  stream(): ReadableStream;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user || user.role !== 'STORE') return error('无权上传施工照片', 403);

    const pathname = new URL(context.request.url).pathname;
    const encodedKey = pathname.replace(/^\/api\/r2-upload\//, '');
    const fileKey = decodeURIComponent(encodedKey);
    const expectedPrefix = `warranty-photos/${user.orgId}/`;

    if (!fileKey.startsWith(expectedPrefix) || fileKey.includes('..')) {
      return error('上传路径无效', 403);
    }

    const form = await context.request.formData();
    const entry = form.get('file') as unknown;
    if (!entry || typeof entry === 'string') return error('缺少图片文件', 400);
    const file = entry as UploadedFile;
    if (!ALLOWED_CONTENT_TYPES.has(file.type)) return error('仅支持 JPG、PNG 或 WebP 图片', 400);
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return error('图片大小必须在 10MB 以内', 400);

    await context.env.R2.put(fileKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { organizationId: user.orgId, uploadedBy: user.userId },
    });

    return ok({ fileKey, size: file.size, contentType: file.type }, '上传成功');
  } catch (err) {
    console.error('[r2-upload]', err);
    return error('图片上传失败', 500);
  }
};
