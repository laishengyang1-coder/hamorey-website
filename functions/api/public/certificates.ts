// ============================================================
// GET /api/public/certificates/:certNo/download — 下载质保证书（PNG 长图）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst } from '../_lib';
import { error } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const parts = url.pathname.split('/');
    const certificatesIndex = parts.indexOf('certificates');
    const certNo = parts[certificatesIndex + 1] || url.searchParams.get('cert_no') || '';

    if (!certNo) return error('缺少证书编号', 400);

    // 查询证书文件
    const cert = await queryFirst<{ file_key: string | null; pending: number }>(
      context.env.DB,
      `SELECT cf.file_key, CASE WHEN j.warranty_record_id IS NULL THEN 0 ELSE 1 END AS pending
       FROM warranty_records wr LEFT JOIN certificate_files cf ON cf.warranty_record_id = wr.id
       LEFT JOIN certificate_jobs j ON j.warranty_record_id = wr.id
       WHERE wr.certificate_no = ? ORDER BY cf.version DESC LIMIT 1`,
      certNo,
    );

    if (cert?.pending) {
      const response = error('证书正在更新，请稍后重试', 503);
      response.headers.set('Retry-After', '60');
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
    if (!cert?.file_key) return error('证书不存在', 404);

    // 从 R2 读取
    const obj = await context.env.R2.get(cert.file_key);
    if (!obj) return error('证书文件不存在', 404);

    const ext = cert.file_key.endsWith('.png') ? 'png' : 'pdf';
    const headers = new Headers();
    if (obj.httpMetadata?.contentType) headers.set('Content-Type', obj.httpMetadata.contentType);
    headers.set('Content-Disposition', `inline; filename="HAMOREY-${certNo}.${ext}"`);
    headers.set('Cache-Control', 'private, no-store');

    return new Response(obj.body, { headers });
  } catch (err) {
    console.error('[public/certificates]', err);
    return error('下载证书失败', 500);
  }
};
