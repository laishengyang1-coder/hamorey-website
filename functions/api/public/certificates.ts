// ============================================================
// GET /api/public/certificates/:certNo/download — 下载质保证书 PDF
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
    const cert = await queryFirst<{ file_key: string; file_url: string | null }>(
      context.env.DB,
      `SELECT file_key, file_url FROM certificate_files cf
       JOIN warranty_records wr ON cf.warranty_record_id = wr.id
       WHERE wr.certificate_no = ? ORDER BY cf.version DESC LIMIT 1`,
      certNo,
    );

    if (!cert) return error('证书不存在', 404);

    // 从 R2 读取
    const obj = await context.env.R2.get(cert.file_key);
    if (!obj) return error('证书文件不存在', 404);

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('Content-Disposition', `inline; filename="HAMOREY-${certNo}.pdf"`);
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(obj.body, { headers });
  } catch (err) {
    console.error('[public/certificates]', err);
    return error('下载证书失败', 500);
  }
};
