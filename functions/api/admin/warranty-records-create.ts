// ============================================================
// POST /api/admin/warranty-records — 总部手动录入一条质保
// 按普通上质保流程：创建为 pending 待审核，10 分钟未审核将自动通过；
// 也可在审核页手动通过。质保码必须属于所选门店且状态可登记。
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, execute, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    if (user.role !== 'HQ_ADMIN') return error('仅总部可手动录入质保', 403);

    const body = (await context.request.json()) as {
      warranty_code?: string;
      store_id?: string;
      customer_name?: string;
      customer_phone?: string;
      plate_no?: string;
      vin?: string;
      vehicle_brand?: string;
      vehicle_model?: string;
      vehicle_year?: string;
      installation_date?: string;
    };

    // 校验必填字段
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.store_id) errors.push({ field: 'store_id', message: '请选择门店' });
    if (!body.warranty_code) errors.push({ field: 'warranty_code', message: '质保码不能为空' });
    if (!body.customer_name) errors.push({ field: 'customer_name', message: '车主姓名不能为空' });
    if (!body.customer_phone) errors.push({ field: 'customer_phone', message: '车主电话不能为空' });
    if (!body.vin) errors.push({ field: 'vin', message: '车架号（VIN）不能为空' });
    if (!body.vehicle_brand) errors.push({ field: 'vehicle_brand', message: '车辆品牌不能为空' });
    if (!body.vehicle_model) errors.push({ field: 'vehicle_model', message: '车辆型号不能为空' });
    if (!body.installation_date) errors.push({ field: 'installation_date', message: '施工日期不能为空' });
    if (errors.length > 0) return validationError(errors);

    // 查询质保码（必须属于所选门店且状态可登记）
    const wc = await queryFirst<{
      id: string;
      code: string;
      product_model_id: string;
      owner_org_id: string;
      status: string;
      usage_limit: number;
      used_count: number;
    }>(
      context.env.DB,
      `SELECT * FROM warranty_codes WHERE code = ? COLLATE NOCASE`,
      body.warranty_code,
    );

    if (!wc) return error('质保码不存在', 404);
    if (wc.owner_org_id !== body.store_id) return error('该质保码不属于所选门店', 403);
    if (wc.status === 'exhausted' || wc.status === 'voided' || wc.status === 'frozen')
      return error(`质保码状态为 ${wc.status}，无法登记`, 400);

    const actualUsage = await queryFirst<{ cnt: number }>(
      context.env.DB,
      `SELECT COUNT(*) AS cnt
       FROM warranty_records
       WHERE warranty_code_id = ? AND status IN ('pending', 'active', 'expired')`,
      wc.id,
    );
    if ((actualUsage?.cnt ?? 0) >= wc.usage_limit) {
      return error('该质保码可使用次数已用完', 400);
    }

    // 查询产品型号
    const model = await queryFirst<{ display_name: string; warranty_years: number | null }>(
      context.env.DB,
      `SELECT display_name, warranty_years FROM product_models WHERE id = ?`,
      wc.product_model_id,
    );
    if (!model) return error('产品型号不存在', 404);

    // 查询产品
    const product = await queryFirst<{ name_cn: string; default_warranty_years: number }>(
      context.env.DB,
      `SELECT name_cn, default_warranty_years FROM products WHERE id = (SELECT product_id FROM product_models WHERE id = ?)`,
      wc.product_model_id,
    );

    // 查询门店（取名称与上级省代）
    const store = await queryFirst<{ name: string; parent_id: string | null }>(
      context.env.DB,
      `SELECT name, parent_id FROM organizations WHERE id = ? AND type = 'STORE'`,
      body.store_id,
    );
    if (!store) return error('所选门店不存在', 404);

    // 查询/创建客户
    let customer = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT id FROM customers WHERE phone = ?`,
      body.customer_phone,
    );
    const customerId = customer?.id || generateId();
    if (!customer) {
      await execute(
        context.env.DB,
        `INSERT INTO customers (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        customerId, body.customer_name, body.customer_phone,
      );
    }

    // 查询/创建车辆（VIN 必填，按 VIN 匹配车辆）
    let vehicle = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT id FROM vehicles WHERE vin = ? AND customer_id = ?`,
      body.vin, customerId,
    );
    const vehicleId = vehicle?.id || generateId();
    if (!vehicle) {
      await execute(
        context.env.DB,
        `INSERT INTO vehicles (id, customer_id, plate_no, vin, brand, model, model_year, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        vehicleId, customerId, body.plate_no || '', body.vin,
        body.vehicle_brand, body.vehicle_model, body.vehicle_year || null,
      );
    }

    // 创建质保记录（按普通流程：pending 待审核）
    const recordId = generateId();
    const warrantyYears = model.warranty_years ?? product?.default_warranty_years ?? 5;

    await execute(
      context.env.DB,
      `INSERT INTO warranty_records (id, warranty_code_id, vehicle_id, customer_id,
        customer_name_snapshot, customer_phone_snapshot, plate_no_snapshot, vin_snapshot,
        vehicle_brand_snapshot, vehicle_model_snapshot,
        store_id, store_name_snapshot, province_org_id,
        product_model_id, product_name_snapshot, product_model_snapshot,
        warranty_years_snapshot, installation_date,
        status, submitted_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'), datetime('now'))`,
      recordId, wc.id, vehicleId, customerId,
      body.customer_name, body.customer_phone, body.plate_no || '', body.vin,
      body.vehicle_brand, body.vehicle_model,
      body.store_id, store.name, store.parent_id || null,
      wc.product_model_id, product?.name_cn || '', model.display_name,
      warrantyYears, body.installation_date,
    );

    // 提交审核日志
    const auditId = generateId();
    await execute(
      context.env.DB,
      `INSERT INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, operator_user_id, created_at)
       VALUES (?, ?, 'submit', 'draft', 'pending', ?, datetime('now'))`,
      auditId, recordId, user.userId,
    );

    await writeOperationLog(context.env.DB, user.userId, 'admin_create_warranty_record', 'warranty_records', recordId,
      { warranty_code: body.warranty_code, store_id: body.store_id, customer: body.customer_name, plate: body.plate_no },
      getClientIP(context.request));

    return ok({ id: recordId }, '录入成功，已进入待审核（10分钟内无人审核将自动通过，也可在审核页手动通过）');
  } catch (err) {
    console.error('[admin/warranty-records POST]', err);
    return error('录入质保记录失败', 500);
  }
};
