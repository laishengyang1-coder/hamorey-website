// ============================================================
// GET  /api/province/warranty-records/:id — 记录详情
// PUT  /api/province/warranty-records/:id — 编辑记录
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, execute, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env {
  DB: D1Database;
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

    const body = (await context.request.json()) as {
      customer_name?: string; customer_phone?: string; plate_no?: string;
      vin?: string; vehicle_brand?: string; vehicle_model?: string;
      installation_date?: string;
    };

    const updates: string[] = [];
    const params: unknown[] = [];
    const fieldMap: Record<string, string> = {
      customer_name: 'customer_name_snapshot', customer_phone: 'customer_phone_snapshot',
      plate_no: 'plate_no_snapshot', vin: 'vin_snapshot',
      vehicle_brand: 'vehicle_brand_snapshot', vehicle_model: 'vehicle_model_snapshot',
      installation_date: 'installation_date',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key as keyof typeof body] !== undefined) { updates.push(`${col} = ?`); params.push(body[key as keyof typeof body]); }
    }
    if (updates.length === 0) return error('没有需要更新的字段', 400);
    updates.push("updated_at = datetime('now')");
    params.push(recordId);

    await execute(context.env.DB, `UPDATE warranty_records SET ${updates.join(', ')} WHERE id = ? AND province_org_id = ?`, ...params, user.orgId);

    await writeOperationLog(context.env.DB, user.userId, 'edit_warranty_record', 'warranty_records', recordId, body, getClientIP(context.request));
    return ok(null, '修改成功');
  } catch (err) {
    console.error('[province/warranty-records PUT]', err);
    return error('修改记录失败', 500);
  }
};
