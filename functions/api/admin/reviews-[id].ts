// ============================================================
// GET  /api/admin/reviews/:id — 审核详情
// POST /api/admin/reviews/:id/approve — 审核通过
// POST /api/admin/reviews/:id/reject — 驳回
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, writeOperationLog, getAuthUser, isOrgPointsExempt } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';
import { certificateJob, commitReview, tryIssueCertificate, warrantyExpiry } from '../_certificate-workflow';
import { notifyWarrantyActivated } from '../_sms';

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
      return await handleApprove(context, recordId);
    }
    if (pathname.endsWith('/reject')) {
      return await handleReject(context, recordId);
    }

    return error('未知操作', 400);
  } catch (err) {
    console.error('[admin/reviews POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE constraint failed') || message.includes('Duplicate entry') || message.includes('ER_DUP_ENTRY') || message.includes('INVALID_WARRANTY_')) {
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
    customer_phone_snapshot: string | null;
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
  const expiryDateStr = warrantyExpiry(record.installation_date, record.warranty_years_snapshot);

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
  let storePoints = pointsRule?.points ?? 0;

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
  // 省代返利：四舍五入取整；门店得分>=1 且返利比例>0 时保底返 1 分（避免 1 分奖品返利为 0）
  let provincePoints = record.province_org_id && rebateRatio > 0 && storePoints > 0 ? Math.max(1, Math.round(storePoints * rebateRatio)) : 0;
  // 豁免组织（如远方集团下属门店）：门店与省代均不发积分、不参与排行等活动
  if (await isOrgPointsExempt(env.DB, record.store_id)) {
    storePoints = 0;
    provincePoints = 0;
  }

  // === 事务：7步原子操作 ===
  const statements: Array<{ sql: string; params: unknown[] }> = [];

  // 1. 更新质保记录状态
  statements.push({
    sql: `UPDATE warranty_records SET status = 'active', certificate_no = ?, warranty_expiry_date = ?,
          approved_at = datetime('now'), approved_by = ?, store_points_awarded = ?, province_points_awarded = ?,
          updated_at = datetime('now') WHERE id = ? AND status = 'pending' AND DATE(installation_date) = ?`,
    params: [certNo, expiryDateStr, user?.userId || null, storePoints, provincePoints, recordId, new Date(record.installation_date).toISOString().slice(0, 10)],
  });

  // 2. 更新质保码使用次数
  statements.push({
    sql: `UPDATE warranty_codes SET status = CASE WHEN status IN ('frozen','voided') THEN status
            WHEN used_count + 1 >= usage_limit THEN 'exhausted' ELSE 'partial_used' END,
          used_count = used_count + 1
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

  statements.push(certificateJob(recordId, user?.userId || null));

  const modelName = record.product_name_snapshot || record.product_model_snapshot || '未知型号';

  // 5-6. 积分/返利流水与审核状态保持同一批次，避免部分成功。
  // 幂等：legacy 历史数据导入/自动审核可能已预发积分或返利流水（points_ledger 存在
  // (organization_id, related_id) 唯一索引），已发过则跳过对应插入，避免撞索引导致 500。
  const awarded = await queryAll<{ organization_id: string }>(
    env.DB,
    `SELECT organization_id FROM points_ledger
     WHERE related_id = ? AND related_type = 'warranty' AND change_type = 'award'`,
    recordId,
  );
  const awardedOrgIds = new Set(awarded.map((l) => l.organization_id));

  if (storePoints > 0 && !awardedOrgIds.has(record.store_id)) {
    statements.push({
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'award', ?, 0, 'warranty', ?, ?, ?, datetime('now'))`,
      params: [generateId(), record.store_id, storePoints, recordId, `质保审核通过: ${modelName}（${certNo}）`, user?.userId || null],
    });
  }
  if (provincePoints > 0 && record.province_org_id && !awardedOrgIds.has(record.province_org_id)) {
    statements.push({
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'award', ?, 0, 'warranty', ?, ?, ?, datetime('now'))`,
      params: [generateId(), record.province_org_id, provincePoints, recordId, `门店质保返利: ${modelName}（${certNo}）`, user?.userId || null],
    });
  }

  // 7. 操作日志
  statements.push({
    sql: `INSERT INTO operation_logs
          (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
          VALUES (?, ?, 'approve_warranty', 'warranty_records', ?, ?, ?, datetime('now'))`,
    params: [generateId(), user?.userId || null, recordId, JSON.stringify({ certNo }), ip],
  });

  if (!await commitReview(env.DB, statements)) return error('记录已变更，请刷新后重试', 409);
  const certFileKey = await tryIssueCertificate(env, recordId);

  // 审核通过后给车主发送质保激活短信。
  // 短信是「尽力而为」的附加能力：notifyWarrantyActivated 内部吞掉全部异常，
  // 未配置密钥或发送失败都只记日志，绝不阻塞/回滚审核结果。
  await notifyWarrantyActivated({
    recordId,
    certNo,
    phone: record.customer_phone_snapshot,
  });

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

  if (!await commitReview(env.DB, statements)) return error('记录已变更，请刷新后重试', 409);
  await writeOperationLog(env.DB, user?.userId || null, 'reject_warranty', 'warranty_records', recordId, { reason: body.reason }, ip);

  return ok(null, '已驳回');
}
