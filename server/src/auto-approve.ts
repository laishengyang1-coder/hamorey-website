// ============================================================
// 质保记录自动审核（超时自动通过）
// ------------------------------------------------------------
// 门店提交质保登记后状态为 pending，需总部/省代手动审核。
// 为减少人工负担，提交超过 AUTO_APPROVE_MINUTES（默认 10）分钟
// 仍无人审核的记录，由本后台定时任务自动置为审核通过，
// 流程与人工审核完全一致：生成证书、更新质保码用量、
// 写审计日志、发放门店积分与省代返利。
// ============================================================

import { queryFirst, queryAll, execute, batch, generateId } from '../../functions/api/_lib.ts';
import { createCertificatePdf } from '../../functions/api/_certificate.ts';
import { getCertificateSeal } from '../../functions/api/_seal.ts';

/** 提交后超过多少分钟仍未审核则自动通过 */
export const AUTO_APPROVE_MINUTES = 10;

interface EnvLike {
  DB: any;
  R2: any;
}

interface PendingRecord {
  id: string;
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
}

/**
 * 启动定时任务。默认每分钟扫描一次超时需要自动通过的待审记录。
 * 返回定时器句柄，便于测试时清理。
 */
export function startAutoApproveTimer(env: EnvLike, intervalMs = 60_000): ReturnType<typeof setInterval> {
  const timer = setInterval(() => {
    runAutoApprove(env)
      .then((result) => {
        if (result.approved > 0) {
          console.log(`[auto-approve] 本次自动通过 ${result.approved} 条待审核质保`);
        }
      })
      .catch((err) => {
        console.error('[auto-approve] 定时任务执行失败', err);
      });
  }, intervalMs);

  // 不阻止进程退出（例如无连接时）
  timer.unref?.();
  return timer;
}

/**
 * 扫描并自动通过所有超时待审记录。返回本次通过数量。
 */
export async function runAutoApprove(env: EnvLike): Promise<{ approved: number; scanned: number }> {
  // 时区注意：MySQL 会话时区为东八区，created_at 以「北京时间字面量」存储。
  // 必须用 NOW()（会话时区一致）判断超时，不能用 Node 计算的 UTC 字符串——
  // 否则 MySQL 会把 UTC 字符串当成东八区解释，比 created_at 早 8 小时，导致永远选不中待审记录。
  const pending = await queryAll<PendingRecord>(
    env.DB,
    `SELECT wr.*
     FROM warranty_records wr
     WHERE wr.status = 'pending'
       AND wr.created_at < NOW() - INTERVAL ? MINUTE
       -- Imported legacy rows explicitly marked for manual review must never
       -- become active merely because their historical submit time is old.
       AND NOT EXISTS (
         SELECT 1
         FROM warranty_audit_logs wal
         WHERE wal.warranty_record_id = wr.id
           AND wal.note = '旧小程序后台状态异常，待人工复核'
       )
     ORDER BY wr.created_at ASC
     LIMIT 50`,
    AUTO_APPROVE_MINUTES,
  );

  let approved = 0;
  for (const record of pending) {
    const ok = await autoApproveOne(env, record);
    if (ok) approved += 1;
  }

  return { approved, scanned: pending.length };
}

/**
 * 单条记录自动通过。复用人工审核的完整流程。
 * 返回 true 表示成功通过；false 表示记录已被他人审核（跳过）。
 */
async function autoApproveOne(env: EnvLike, record: PendingRecord): Promise<boolean> {
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
    const seal = await getCertificateSeal();
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
      issueDate: new Date().toISOString().slice(0, 10),
    }, seal);
    certFileKey = `certificates/${certNo}.pdf`;
    await env.R2.put(certFileKey, pdfBytes, {
      httpMetadata: { contentType: 'application/pdf' },
    });
  } catch (pdfErr) {
    console.error('[auto-approve] PDF 生成失败', pdfErr);
    // PDF 生成失败不阻塞审核
    certFileKey = '';
  }

  // 1. 先更新状态（乐观锁），仅当仍处 pending 时生效。
  //    affectedRows = 0 说明已被人工审核，直接跳过避免重复发积分。
  const updateRes = await execute(
    env.DB,
    `UPDATE warranty_records SET status = 'active', certificate_no = ?, warranty_expiry_date = ?,
          approved_at = datetime('now'), approved_by = NULL, store_points_awarded = ?, province_points_awarded = ?,
          updated_at = datetime('now') WHERE id = ? AND status = 'pending'`,
    certNo, expiryDateStr, storePoints, provincePoints, record.id,
  );
  if (!updateRes?.meta?.changes) {
    return false;
  }

  // 2. 其余步骤：质保码+1、审计日志、证书文件、积分流水、操作日志。
  const statements: Array<{ sql: string; params: unknown[] }> = [];

  statements.push({
    sql: `UPDATE warranty_codes SET used_count = used_count + 1,
          status = CASE WHEN used_count + 1 >= usage_limit THEN 'exhausted' ELSE 'partial_used' END
          WHERE id = ?`,
    params: [record.warranty_code_id],
  });

  const auditLogId = generateId();
  statements.push({
    sql: `INSERT INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, note, operator_user_id, created_at)
          VALUES (?, ?, 'approve', 'pending', 'active', ?, NULL, datetime('now'))`,
    params: [auditLogId, record.id, '系统自动通过（提交后超过10分钟未有人审核）'],
  });

  if (certFileKey) {
    const certFileId = generateId();
    statements.push({
      sql: `INSERT INTO certificate_files (id, warranty_record_id, file_key, file_url, version, generated_by, created_at)
            VALUES (?, ?, ?, NULL, 1, NULL, datetime('now'))`,
      params: [certFileId, record.id, certFileKey],
    });
  }

  const modelName = record.product_name_snapshot || record.product_model_snapshot || '未知型号';

  if (storePoints > 0) {
    statements.push({
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'award', ?, 0, 'warranty', ?, ?, NULL, datetime('now'))`,
      params: [generateId(), record.store_id, storePoints, record.id, `质保审核通过(系统自动): ${modelName}（${certNo}）`],
    });
  }
  if (provincePoints > 0 && record.province_org_id) {
    statements.push({
      sql: `INSERT INTO points_ledger
            (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
            VALUES (?, ?, 'award', ?, 0, 'warranty', ?, ?, NULL, datetime('now'))`,
      params: [generateId(), record.province_org_id, provincePoints, record.id, `门店质保返利(系统自动): ${modelName}（${certNo}）`],
    });
  }

  statements.push({
    sql: `INSERT INTO operation_logs
          (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
          VALUES (?, NULL, 'auto_approve_warranty', 'warranty_records', ?, ?, ?, datetime('now'))`,
    params: [generateId(), record.id, JSON.stringify({ certNo }), 'system'],
  });

  try {
    await batch(env.DB, statements);
  } catch (err) {
    if (certFileKey) await env.R2.delete(certFileKey).catch(() => undefined);
    // 回滚已置为 active 的状态，等待下次重试
    await execute(
      env.DB,
      `UPDATE warranty_records SET status = 'pending', certificate_no = NULL, warranty_expiry_date = NULL,
            approved_at = NULL, approved_by = NULL, store_points_awarded = 0, province_points_awarded = 0
       WHERE id = ? AND status = 'active'`,
      record.id,
    );
    throw err;
  }

  return true;
}
