// ============================================================
// GET /api/store/warranty-records/:id — 详情
// PUT /api/store/warranty-records/:id — 驳回后修改重提
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, writeOperationLog, getAuthUser, validateWarrantyPhotoKeys } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

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
    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少记录 ID', 400);
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const record = await queryFirst(
      context.env.DB,
      `SELECT wr.*, wc.code AS warranty_code, pm.display_name AS model_name
       FROM warranty_records wr
       JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       JOIN product_models pm ON wr.product_model_id = pm.id
       WHERE wr.id = ? AND wr.store_id = ?`,
      recordId, user.orgId,
    );
    if (!record) return error('质保记录不存在', 404);

    const photos = await queryAll(
      context.env.DB,
      `SELECT * FROM warranty_photos WHERE warranty_record_id = ? ORDER BY sort_order`,
      recordId,
    );

    const auditLogs = await queryAll(
      context.env.DB,
      `SELECT al.*, u.username AS operator_name
       FROM warranty_audit_logs al LEFT JOIN users u ON al.operator_user_id = u.id
       WHERE al.warranty_record_id = ? ORDER BY al.created_at DESC`,
      recordId,
    );

    return ok({ record, photos, auditLogs });
  } catch (err) {
    console.error('[store/record GET]', err);
    return error('获取记录详情失败', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少记录 ID', 400);

    const record = await queryFirst<{ id: string; status: string; store_id: string }>(
      context.env.DB,
      `SELECT id, status, store_id FROM warranty_records WHERE id = ?`,
      recordId,
    );
    if (!record) return error('质保记录不存在', 404);
    if (record.status !== 'rejected') return error('只有驳回状态的记录可以修改', 400);

    const user = getAuthUser(context.data);
    if (record.store_id !== user?.orgId) return error('无权修改此记录', 403);

    const body = (await context.request.json()) as {
      customer_name?: string;
      customer_phone?: string;
      plate_no?: string;
      vin?: string;
      vehicle_brand?: string;
      vehicle_model?: string;
      installation_date?: string;
      photo_keys?: string[];
    };

    if (body.photo_keys?.length) {
      const photoError = await validateWarrantyPhotoKeys(context.env.R2, user.orgId, body.photo_keys);
      if (photoError) return error(photoError, 400);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.customer_name) { updates.push('customer_name_snapshot = ?'); params.push(body.customer_name); }
    if (body.customer_phone) { updates.push('customer_phone_snapshot = ?'); params.push(body.customer_phone); }
    if (body.plate_no) { updates.push('plate_no_snapshot = ?'); params.push(body.plate_no); }
    if (body.vin !== undefined) { updates.push('vin_snapshot = ?'); params.push(body.vin || null); }
    if (body.vehicle_brand) { updates.push('vehicle_brand_snapshot = ?'); params.push(body.vehicle_brand); }
    if (body.vehicle_model) { updates.push('vehicle_model_snapshot = ?'); params.push(body.vehicle_model); }
    if (body.installation_date) { updates.push('installation_date = ?'); params.push(body.installation_date); }

    updates.push("status = 'pending', current_reject_reason = NULL, submitted_at = datetime('now'), updated_at = datetime('now')");
    params.push(recordId);

    await execute(context.env.DB, `UPDATE warranty_records SET ${updates.join(', ')} WHERE id = ?`, ...params);

    // 重新提交审核日志
    const auditId = generateId();
    await execute(context.env.DB,
      `INSERT INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, operator_user_id, created_at)
       VALUES (?, ?, 'resubmit', 'rejected', 'pending', ?, datetime('now'))`,
      auditId, recordId, user?.userId);

    // 更新照片（如果提供）
    if (body.photo_keys && body.photo_keys.length > 0) {
      await execute(context.env.DB, `DELETE FROM warranty_photos WHERE warranty_record_id = ?`, recordId);
      for (let i = 0; i < body.photo_keys.length; i++) {
        await execute(context.env.DB,
          `INSERT INTO warranty_photos (id, warranty_record_id, file_key, sort_order, uploaded_by, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          generateId(), recordId, body.photo_keys[i], i + 1, user?.userId);
      }
    }

    await writeOperationLog(context.env.DB, user?.userId || null, 'resubmit_warranty', 'warranty_records', recordId, null, getClientIP(context.request));

    return ok(null, '修改已重新提交，等待审核');
  } catch (err) {
    console.error('[store/record PUT]', err);
    return error('修改失败', 500);
  }
};
