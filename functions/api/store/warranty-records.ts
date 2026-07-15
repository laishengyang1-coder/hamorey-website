// ============================================================
// GET  /api/store/warranty-records — 门店我的质保记录
// POST /api/store/warranty-records — 创建质保登记（分段提交）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, parsePagination, writeOperationLog, getAuthUser, validateWarrantyPhotoKeys } from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const status = url.searchParams.get('status') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = ['wr.store_id = ?'];
    const params: unknown[] = [user?.orgId];

    if (status) { conditions.push('wr.status = ?'); params.push(status); }
    if (keyword) {
      conditions.push('(wr.customer_name_snapshot LIKE ? OR wr.plate_no_snapshot LIKE ? OR wc.code LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT wr.*, wc.code AS warranty_code, pm.display_name AS model_name
         FROM warranty_records wr
         JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
         JOIN product_models pm ON wr.product_model_id = pm.id
         ${where} ORDER BY wr.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt FROM warranty_records wr ${where}`, ...params),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[store/warranty-records GET]', err);
    return error('获取质保记录失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      warranty_code?: string;
      customer_name?: string;
      customer_phone?: string;
      plate_no?: string;
      vin?: string;
      vehicle_brand?: string;
      vehicle_model?: string;
      vehicle_year?: string;
      installation_date?: string;
      photo_keys?: string[];
    };

    // 校验必填字段
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.warranty_code) errors.push({ field: 'warranty_code', message: '质保码不能为空' });
    if (!body.customer_name) errors.push({ field: 'customer_name', message: '车主姓名不能为空' });
    if (!body.customer_phone) errors.push({ field: 'customer_phone', message: '车主电话不能为空' });
    if (!body.plate_no) errors.push({ field: 'plate_no', message: '车牌号不能为空' });
    if (!body.vehicle_brand) errors.push({ field: 'vehicle_brand', message: '车辆品牌不能为空' });
    if (!body.vehicle_model) errors.push({ field: 'vehicle_model', message: '车辆型号不能为空' });
    if (!body.installation_date) errors.push({ field: 'installation_date', message: '施工日期不能为空' });
    if (errors.length > 0) return validationError(errors);

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    if (body.photo_keys?.length) {
      const photoError = await validateWarrantyPhotoKeys(context.env.R2, user.orgId, body.photo_keys);
      if (photoError) return error(photoError, 400);
    }

    // 查询质保码（必须属于本门店且状态可登记）
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
    if (wc.owner_org_id !== user?.orgId) return error('该质保码不属于本门店', 403);
    if (wc.status === 'exhausted' || wc.status === 'voided' || wc.status === 'frozen')
      return error(`质保码状态为 ${wc.status}，无法登记`, 400);

    const actualUsage = await queryFirst<{ cnt: number }>(
      context.env.DB,
      `SELECT COUNT(*) AS cnt
       FROM warranty_records
       WHERE warranty_code_id = ? AND status IN ('pending', 'active', 'expired')`,
      wc.id,
    );
    const usedCount = Math.max(Number(wc.used_count) || 0, actualUsage?.cnt ?? 0);
    if (usedCount >= wc.usage_limit) {
      return error('该质保码可使用次数已用完', 400);
    }

    // 查询产品型号
    const model = await queryFirst<{
      display_name: string;
      warranty_years: number | null;
    }>(
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

    // 查询/创建车辆
    let vehicle = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT id FROM vehicles WHERE plate_no = ? AND customer_id = ?`,
      body.plate_no, customerId,
    );

    const vehicleId = vehicle?.id || generateId();
    if (!vehicle) {
      await execute(
        context.env.DB,
        `INSERT INTO vehicles (id, customer_id, plate_no, vin, brand, model, model_year, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        vehicleId, customerId, body.plate_no, body.vin || null,
        body.vehicle_brand, body.vehicle_model, body.vehicle_year || null,
      );
    }

    // 查找省代
    const province = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT parent_id AS id FROM organizations WHERE id = ? AND type = 'STORE'`,
      user?.orgId,
    );

    // 创建质保记录
    const recordId = generateId();
    const warrantyYears = model.warranty_years ?? product?.default_warranty_years ?? 5;
    const storeName = user?.orgName || '';

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
      body.customer_name, body.customer_phone, body.plate_no, body.vin || null,
      body.vehicle_brand, body.vehicle_model,
      user?.orgId, storeName, province?.id || null,
      wc.product_model_id, product?.name_cn || '', model.display_name,
      warrantyYears, body.installation_date,
    );

    // 提交审核日志
    const auditId = generateId();
    await execute(
      context.env.DB,
      `INSERT INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, operator_user_id, created_at)
       VALUES (?, ?, 'submit', 'draft', 'pending', ?, datetime('now'))`,
      auditId, recordId, user?.userId,
    );

    // 关联照片
    if (body.photo_keys && body.photo_keys.length > 0) {
      for (let i = 0; i < body.photo_keys.length; i++) {
        const photoId = generateId();
        await execute(
          context.env.DB,
          `INSERT INTO warranty_photos (id, warranty_record_id, file_key, sort_order, uploaded_by, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          photoId, recordId, body.photo_keys[i], i + 1, user?.userId,
        );
      }
    }

    await writeOperationLog(context.env.DB, user?.userId || null, 'create_warranty_record', 'warranty_records', recordId,
      { warranty_code: body.warranty_code, customer: body.customer_name, plate: body.plate_no },
      getClientIP(context.request));

    return ok({ id: recordId }, '提交成功，等待审核');
  } catch (err) {
    console.error('[store/warranty-records POST]', err);
    return error('创建质保记录失败', 500);
  }
};
