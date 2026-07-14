// ============================================================
// GET  /api/admin/reviews/:id — 审核详情
// POST /api/admin/reviews/:id/approve — 审核通过
// POST /api/admin/reviews/:id/reject — 驳回
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, batch, writeOperationLog, writePointsLedger , getAuthUser} from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

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
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    const { width } = page.getSize();
    let y = 780;

    // 标题
    page.drawText('和膜 HAMOREY', { x: 50, y, size: 24, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 35;
    page.drawText('整车质保证书', { x: 50, y, size: 18, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;

    // 证书编号
    page.drawText(`证书编号：${certNo}`, { x: 50, y, size: 11, font });
    y -= 25;

    // 分隔线
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 30;

    // 信息区域
    const infoLines = [
      ['车主姓名', record.customer_name_snapshot],
      ['车牌号', record.plate_no_snapshot],
      ['车架号(VIN)', record.vin_snapshot || '-'],
      ['车辆品牌', record.vehicle_brand_snapshot],
      ['车辆型号', record.vehicle_model_snapshot],
      ['产品名称', record.product_name_snapshot],
      ['产品型号', record.product_model_snapshot],
      ['施工门店', record.store_name_snapshot],
      ['施工日期', record.installation_date],
      ['质保到期', expiryDateStr],
      ['质保年限', `${record.warranty_years_snapshot} 年`],
    ];

    for (const [label, value] of infoLines) {
      page.drawText(`${label}：`, { x: 50, y, size: 11, font: fontBold });
      page.drawText(value, { x: 160, y, size: 11, font });
      y -= 22;
    }

    y -= 30;
    page.drawText('本证书由和膜 HAMOREY 官方签发，可通过官网 hemoppf.com 查询真伪。', {
      x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
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
          updated_at = datetime('now') WHERE id = ?`,
    params: [certNo, expiryDateStr, user?.userId || null, storePoints, provincePoints, recordId],
  });

  // 2. 更新质保码使用次数
  statements.push({
    sql: `UPDATE warranty_codes SET used_count = used_count + 1,
          status = CASE WHEN used_count + 1 >= usage_limit THEN 'exhausted' ELSE status END
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

  await batch(env.DB, statements);

  // 5-6. 积分/返利流水（事务外，D1 batch 已足够）
  if (storePoints > 0) {
    await writePointsLedger(env.DB, record.store_id, 'award', storePoints, 0, 'warranty', recordId, `质保审核通过: ${certNo}`, user?.userId || null);
  }
  if (provincePoints > 0 && record.province_org_id) {
    await writePointsLedger(env.DB, record.province_org_id, 'award', provincePoints, 0, 'warranty', recordId, `门店质保返利: ${certNo}`, user?.userId || null);
  }

  // 7. 操作日志
  await writeOperationLog(env.DB, user?.userId || null, 'approve_warranty', 'warranty_records', recordId, { certNo }, ip);

  return ok({ recordId, certNo, certFileKey }, '审核通过');
}

async function handleReject(context: any, recordId: string): Promise<Response> {
  const { env } = context;
  const body = (await context.request.json()) as { reason?: string };
  if (!body.reason) return error('请填写驳回原因', 400);

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
