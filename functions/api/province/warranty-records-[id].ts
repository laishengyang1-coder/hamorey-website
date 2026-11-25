// ============================================================
// GET  /api/province/warranty-records/:id — 记录详情
// PUT  /api/province/warranty-records/:id — 编辑记录
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';
import { editWarranty } from '../_edit-warranty';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

function extractId(pathname: string): string {
  const parts = pathname.split('/');
  const idx = parts.indexOf('warranty-records');
  return parts[idx + 1] || '';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少记录 ID', 400);

    const record = await queryFirst(
      context.env.DB,
      `SELECT wr.*, wc.code AS warranty_code, pm.display_name AS model_name
       FROM warranty_records wr
       JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       JOIN product_models pm ON wr.product_model_id = pm.id
       WHERE wr.id = ? AND wr.province_org_id = ?`,
      recordId, user.orgId,
    );
    if (!record) return error('记录不存在或无权访问', 404);

    const photos = await queryAll(
      context.env.DB,
      `SELECT * FROM warranty_photos WHERE warranty_record_id = ? ORDER BY sort_order`,
      recordId,
    );

    return ok({ record, photos });
  } catch (err) {
    console.error('[province/warranty-records GET]', err);
    return error('获取记录失败', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    if (user.role !== 'PROVINCE') return error('无权操作', 403);

    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少记录 ID', 400);

    return await editWarranty(context.env, user, recordId, await context.request.json(), getClientIP(context.request));
  } catch (err) {
    console.error('[province/warranty-records PUT]', err);
    return error('修改记录失败', 500);
  }
};
