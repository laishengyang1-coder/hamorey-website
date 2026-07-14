// ============================================================
// GET  /api/admin/reviews/:id — 审核详情
// POST /api/admin/reviews/:id/approve — 审核通过
// POST /api/admin/reviews/:id/reject — 驳回
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, batch, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';
import { createCertificatePdf } from '../_certificate';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

function extractId(pathname: string): string {
  const parts = pathname.split('/');
  // /api/admin/reviews/{id} or /api/admin/reviews/{id}/approve
  const reviewsIdx = parts.indexOf('reviews');
  return parts[reviewsIdx + 1] || '';
}

/** GET /api/admin/reviews/:id */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少审核记录 ID', 400);

    const record = await queryFirst(
      context.env.DB,
      `SELECT wr.*, wc.code AS warranty_code,
              pm.display_name AS model_name
       FROM warranty_records wr
       JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       JOIN product_models pm ON wr.product_model_id = pm.id
       WHERE wr.id = ?`,
      recordId,
    );

    if (!record) return error('质保记录不存在', 404);

    // 查询照片
    const photos = await queryAll(
      context.env.DB,
      `SELECT * FROM warranty_photos WHERE warranty_record_id = ? ORDER BY sort_order`,
      recordId,
    );

    // 查询审核历史
    const auditLogs = await queryAll(
      context.env.DB,
      `SELECT al.*, u.username AS operator_name
       FROM warranty_audit_logs al
       LEFT JOIN users u ON al.operator_user_id = u.id
       WHERE al.warranty_record_id = ?
       ORDER BY al.created_at DESC`,
      recordId,
    );

    return ok({ record, photos, auditLogs });
  } catch (err) {
    console.error('[admin/reviews GET detail]', err);
    return error('获取审核详情失败', 500);
  }
};

/** POST /api/admin/reviews/:id/approve */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const pathname = url.pathname;
    const recordId = extractId(pathname);

    if (!recordId) return error('缺少记录 ID', 400);
    if (pathname.endsWith('/approve')) {
      return handleApprove(context, recordId);
    }
    if (pathname.endsWith('/reject')) {
      return handleReject(context, recordId);
    }

    return error('未知操作', 400);
  } catch (err) {
    console.error('[admin/reviews POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE constraint failed') || message.includes('INVALID_WARRANTY_')) {
      return error('该质保记录已被审核，请刷新列表', 409);
    }
    return error('操作失败', 500);
  }
};

async function handleApprove(context: any, recordId: string): Promise<Response> {
  const { env } = context;
  const user = getAuthUser(context.data);
  const ip = getClientIP(context.request);

  // 获取记录
  const record = await queryFirst<{
    id: string;
    status: string;
    warranty_code_id: string;
    warranty_years_snapshot: number;
    installation_date: string;
    store_id: string;
    province_org_id: string | null;
    product_model_id: string;
    customer_name_snapshot: string;
    plate_no_snapshot: string;
    vin_snapshot: string;
    vehicle_brand_snapshot: string;
    vehicle_model_snapshot: string;
    store_name_snapshot: string;
    product_name_snapshot: string;
    product_model_snapshot: string;
  }>(
    env.DB,
    `SELECT * FROM warranty_records WHERE id = ?`,
    recordId,
  );

  if (!record) return error('质保记录不存在', 404);
  if (record.status !== 'pending') return error('该记录不是待审核状态', 400);

  // 计算到期日
  const installDate = new Date(record.installation_date);
  const expiryDate = new Date(installDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + record.warranty_years_snapshot);
  const expiryDateStr = expiryDate.toISOString().split('T')[0];

  // 生成证书编号
  const certNo = `HM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${generateId().slice(0, 8).toUpperCase()}`;

  // 查询积分规则
  const pointsRule = await queryFirst<{ points: number }>(
    env.DB,
    `SELECT points FROM points_rules WHERE product_model_id = ? AND status = 'active'
     AND effective_from <= datetime('now') AND (effective_to IS NULL OR effective_to >= datetime('now'))
     ORDER BY effective_from DESC LIMIT 1`,
    record.product_model_id,
  );
  const storePoints = pointsRule?.points ?? 0;

  // 查询返利规则
  const rebateRule = await queryFirst<{ rebate_ratio: number }>(
    env.DB,
    `SELECT rebate_ratio FROM rebate_rules
     WHERE (product_model_id = ? OR is_global = 1) AND status = 'active'
     AND effective_from <= datetime('now') AND (effective_to IS NULL OR effective_to >= datetime('now'))
     ORDER BY is_global ASC, effective_from DESC LIMIT 1`,
    record.product_model_id,
  );
  const rebateRatio = rebateRule?.rebate_ratio ?? 0;
  const provincePoints = Math.round(storePoints * rebateRatio);

  // 生成 PDF 证书
  let certFileKey = '';
  try {
    const pdfBytes = createCertificatePdf({
      certificateNo: certNo,
      customerName: record.customer_name_snapshot,
      plateNo: record.plate_no_snapshot,
      vin: record.vin_snapshot || '-',
      vehicleBrand: record.vehicle_brand_snapshot,
      vehicleModel: record.vehicle_model_snapshot,
      productName: record.product_name_snapshot,
      productModel: record.product_model_snapshot,
      storeName: record.store_name_snapshot,
      installationDate: record.installation_date,
      expiryDate: expiryDateStr,
      warrantyYears: record.warranty_years_snapshot,
    });
    certFileKey = `certificates/${certNo}.pdf`;
    await env.R2.put(certFileKey, pdfBytes, {
      httpMetadata: { contentType: 'application/pdf' },
    });
  } catch (pdfErr) {
    console.error('[PDF generation]', pdfErr);
    // PDF 生成失败不阻塞审核
    certFileKey = '';
  }

  // === 事务：7步原子操作 ===
  const statements: Array<{ sql: string; params: unknown[] }> = [];

  // 1. 更新质保记录状态
  statements.push({
    sql: `UPDATE warranty_records SET status = 'active', certificate_no = ?, warranty_expiry_date = ?,
          approved_at = datetime('now'), approved_by = ?, store_points_awarded = ?, province_points_awarded = ?,
          updated_at = datetime('now') WHERE id = ? AND status = 'pending'`,
    params: [certNo, expiryDateStr, user?.userId || null, storePoints, provincePoints, recordId],
  });

  // 2. 更新质保码使用次数
  statements.push({
    sql: `UPDATE warranty_codes SET used_count = used_count + 1,
          status = CASE WHEN used_count + 1 >= usage_limit THEN 'exhausted' ELSE 'partial_used' END
          WHERE id = ?`,
    params: [record.warranty_code_id],
  });

  // 3. 写审核日志
  const auditLogId = generateId();
  statements.push({
    sql: `INSERT INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, note, operator_user_id, created_at)
          VALUES (?, ?, 'approve', 'pending', 'active', NULL, ?, datetime('now'))`,
    params: [auditLogId, recordId, user?.userId || null],
  });

  // 4. 写入证书文件记录
  if (certFileKey) {
    const certFileId = generateId();
    statements.push({
      sql: `INSERT INTO certificate_files (id, warranty_record_id, file_key, file_url, version, generated_by, created_at)
            VALUES (?, ?, ?, NULL, 1, ?, datetime('now'))`,
      params: [certFileId, recordId, certFileKey, user?.userId || null],
    });
  }

  // 5-6. 积分/返利流水与审核状态保持同一批次，避免部分成功。
  if (storePoints > 0) {
    statements.push({
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'award', ?, 0, 'warranty', ?, ?, ?, datetime('now'))`,
      params: [generateId(), record.store_id, storePoints, recordId, `质保审核通过: ${certNo}`, user?.userId || null],
    });
  }
  if (provincePoints > 0 && record.province_org_id) {
    statements.push({
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'award', ?, 0, 'warranty', ?, ?, ?, datetime('now'))`,
      params: [generateId(), record.province_org_id, provincePoints, recordId, `门店质保返利: ${certNo}`, user?.userId || null],
    });
  }

  // 7. 操作日志
  statements.push({
    sql: `INSERT INTO operation_logs
          (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
          VALUES (?, ?, 'approve_warranty', 'warranty_records', ?, ?, ?, datetime('now'))`,
    params: [generateId(), user?.userId || null, recordId, JSON.stringify({ certNo }), ip],
  });

  try {
    await batch(env.DB, statements);
  } catch (err) {
    if (certFileKey) await env.R2.delete(certFileKey).catch(() => undefined);
    throw err;
  }

  return ok({ recordId, certNo, certFileKey }, '审核通过');
}

async function handleReject(context: any, recordId: string): Promise<Response> {
  const { env } = context;
  const body = (await context.request.json()) as { reason?: string };
  if (!body.reason) return error('请填写驳回原因', 400);

  const record = await queryFirst<{ status: string }>(
    env.DB,
    `SELECT status FROM warranty_records WHERE id = ?`,
    recordId,
  );
  if (!record) return error('质保记录不存在', 404);
  if (record.status !== 'pending') return error('该记录不是待审核状态', 400);

  const user = getAuthUser(context.data);
  const ip = getClientIP(context.request);

  const auditLogId = generateId();
  const statements: Array<{ sql: string; params: unknown[] }> = [
    {
      sql: `UPDATE warranty_records SET status = 'rejected', current_reject_reason = ?, updated_at = datetime('now') WHERE id = ? AND status = 'pending'`,
      params: [body.reason, recordId],
    },
    {
      sql: `INSERT INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, note, operator_user_id, created_at)
            VALUES (?, ?, 'reject', 'pending', 'rejected', ?, ?, datetime('now'))`,
      params: [auditLogId, recordId, body.reason, user?.userId || null],
    },
  ];

  await batch(env.DB, statements);
  await writeOperationLog(env.DB, user?.userId || null, 'reject_warranty', 'warranty_records', recordId, { reason: body.reason }, ip);

  return ok(null, '已驳回');
}
