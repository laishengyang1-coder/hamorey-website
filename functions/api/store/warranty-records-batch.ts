// ============================================================
// POST /api/store/warranty-records-batch — 一次登记多个产品的质保
// ------------------------------------------------------------
// 场景：一辆车同时贴「车衣 + 前挡 + 侧挡」时，车主/车辆信息只填一次，
//       每个产品选一个质保码，一次提交 → 生成 N 条质保记录、N 张证书。
//
// 设计要点：
// - 一条记录 = 一个产品 = 一个质保码 = 一张证书（沿用现有数据模型与证书生成逻辑）
// - 所有产品共享同一个 customer_id / vehicle_id（只 upsert 一次）
// - 用 batch() 一次性写入：任一条失败则整批回滚，不产生半截数据
// - batch_id 把同一次提交的多条记录归为一组，batch_seq 为组内序号
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import {
  generateId, queryFirst, queryAll, execute, batch, writeOperationLog, getAuthUser, validateWarrantyPhotoKeys,
} from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

const MAX_PRODUCTS = 8;

interface CodeRow {
  id: string;
  code: string;
  product_model_id: string;
  owner_org_id: string;
  status: string;
  usage_limit: number;
  used_count: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      customer_name?: string;
      customer_phone?: string;
      plate_no?: string;
      vin?: string;
      vehicle_brand?: string;
      vehicle_model?: string;
      vehicle_year?: string;
      installation_date?: string;
      products?: Array<{ warranty_code?: string }>;
      photo_keys?: string[];
    };

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    // ---------- 1. 基础校验 ----------
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.customer_name) errors.push({ field: 'customer_name', message: '车主姓名不能为空' });
    if (!body.customer_phone) errors.push({ field: 'customer_phone', message: '车主电话不能为空' });
    if (!body.vin) errors.push({ field: 'vin', message: '车架号（VIN）不能为空' });
    if (!body.vehicle_brand) errors.push({ field: 'vehicle_brand', message: '车辆品牌不能为空' });
    if (!body.vehicle_model) errors.push({ field: 'vehicle_model', message: '车辆型号不能为空' });
    if (!body.installation_date) errors.push({ field: 'installation_date', message: '施工日期不能为空' });

    const products = Array.isArray(body.products) ? body.products : [];
    const codes = products.map((p) => (p?.warranty_code || '').trim()).filter(Boolean);
    if (codes.length === 0) errors.push({ field: 'products', message: '请至少添加一个产品（选择质保码）' });
    if (codes.length > MAX_PRODUCTS) errors.push({ field: 'products', message: `一次最多登记 ${MAX_PRODUCTS} 个产品` });
    if (new Set(codes.map((c) => c.toUpperCase())).size !== codes.length) {
      errors.push({ field: 'products', message: '同一个质保码不能在一辆车里重复使用' });
    }
    if (errors.length > 0) return validationError(errors);

    if (body.photo_keys?.length) {
      const photoError = await validateWarrantyPhotoKeys(context.env.R2, user.orgId, body.photo_keys);
      if (photoError) return error(photoError, 400);
    }

    // ---------- 2. 一次性查出所有码并逐个校验 ----------
    const placeholders = codes.map(() => '?').join(', ');
    const codeRows = await queryAll<CodeRow>(
      context.env.DB,
      `SELECT * FROM warranty_codes WHERE code COLLATE NOCASE IN (${placeholders})`,
      ...codes,
    );
    const byCode = new Map(codeRows.map((r) => [r.code.toUpperCase(), r]));

    const problems: Array<{ field: string; message: string }> = [];
    for (const code of codes) {
      const wc = byCode.get(code.toUpperCase());
      if (!wc) { problems.push({ field: code, message: `质保码 ${code} 不存在` }); continue; }
      if (wc.owner_org_id !== user.orgId) { problems.push({ field: code, message: `质保码 ${code} 不属于本门店` }); continue; }
      if (wc.status === 'exhausted' || wc.status === 'voided' || wc.status === 'frozen') {
        problems.push({ field: code, message: `质保码 ${code} 状态为 ${wc.status}，无法登记` }); continue;
      }
      const usage = await queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt FROM warranty_records
          WHERE warranty_code_id = ? AND status IN ('pending', 'active', 'expired')`,
        wc.id,
      );
      if ((usage?.cnt ?? 0) >= wc.usage_limit) {
        problems.push({ field: code, message: `质保码 ${code} 可使用次数已用完` });
      }
    }
    if (problems.length > 0) return validationError(problems);

    // ---------- 3. 客户 / 车辆只建一次 ----------
    let customer = await queryFirst<{ id: string }>(
      context.env.DB, `SELECT id FROM customers WHERE phone = ?`, body.customer_phone,
    );
    const customerId = customer?.id || generateId();
    if (!customer) {
      await execute(
        context.env.DB,
        `INSERT INTO customers (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        customerId, body.customer_name, body.customer_phone,
      );
    }

    let vehicle = await queryFirst<{ id: string }>(
      context.env.DB, `SELECT id FROM vehicles WHERE vin = ? AND customer_id = ?`, body.vin, customerId,
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

    // ---------- 4. 省代 + 型号信息 ----------
    const province = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT parent_id AS id FROM organizations WHERE id = ? AND type = 'STORE'`,
      user.orgId,
    );

    const modelInfo = new Map<string, { display_name: string; warranty_years: number | null; product_name: string | null }>();
    for (const code of codes) {
      const wc = byCode.get(code.toUpperCase())!;
      if (modelInfo.has(wc.product_model_id)) continue;
      const m = await queryFirst<{ display_name: string; warranty_years: number | null }>(
        context.env.DB, `SELECT display_name, warranty_years FROM product_models WHERE id = ?`, wc.product_model_id,
      );
      const p = await queryFirst<{ name_cn: string; default_warranty_years: number }>(
        context.env.DB,
        `SELECT name_cn, default_warranty_years FROM products WHERE id = (SELECT product_id FROM product_models WHERE id = ?)`,
        wc.product_model_id,
      );
      modelInfo.set(wc.product_model_id, {
        display_name: m?.display_name || '',
        warranty_years: m?.warranty_years ?? p?.default_warranty_years ?? 5,
        product_name: p?.name_cn || '',
      });
    }

    // ---------- 5. 一次性写入 N 条记录 + 日志 + 照片 ----------
    const batchId = generateId();
    const storeName = user.orgName || '';
    const statements: Array<{ sql: string; params: unknown[] }> = [];
    const created: Array<{ id: string; warranty_code: string; model_name: string }> = [];

    codes.forEach((code, index) => {
      const wc = byCode.get(code.toUpperCase())!;
      const mi = modelInfo.get(wc.product_model_id)!;
      const recordId = generateId();

      statements.push({
        sql: `INSERT INTO warranty_records (id, warranty_code_id, vehicle_id, customer_id,
                customer_name_snapshot, customer_phone_snapshot, plate_no_snapshot, vin_snapshot,
                vehicle_brand_snapshot, vehicle_model_snapshot,
                store_id, store_name_snapshot, province_org_id,
                product_model_id, product_name_snapshot, product_model_snapshot,
                warranty_years_snapshot, installation_date,
                status, submitted_at, batch_id, batch_seq, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), ?, ?, datetime('now'), datetime('now'))`,
        params: [
          recordId, wc.id, vehicleId, customerId,
          body.customer_name, body.customer_phone, body.plate_no || '', body.vin,
          body.vehicle_brand, body.vehicle_model,
          user.orgId, storeName, province?.id || null,
          wc.product_model_id, mi.product_name, mi.display_name,
          mi.warranty_years, body.installation_date,
          batchId, index + 1,
        ],
      });

      statements.push({
        sql: `INSERT INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, operator_user_id, created_at)
              VALUES (?, ?, 'submit', 'draft', 'pending', ?, datetime('now'))`,
        params: [generateId(), recordId, user.userId],
      });

      (body.photo_keys || []).forEach((key, i) => {
        statements.push({
          sql: `INSERT INTO warranty_photos (id, warranty_record_id, file_key, sort_order, uploaded_by, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          params: [generateId(), recordId, key, i + 1, user.userId],
        });
      });

      created.push({ id: recordId, warranty_code: wc.code, model_name: mi.display_name });
    });

    // 全部写入在同一次 batch 里：任一条失败 → 整批回滚
    await batch(context.env.DB, statements);

    await writeOperationLog(
      context.env.DB, user.userId || null, 'create_warranty_records_batch', 'warranty_records', batchId,
      {
        batch_id: batchId,
        count: codes.length,
        codes,
        customer: body.customer_name,
        plate: body.plate_no,
      },
      getClientIP(context.request),
    );

    return ok({ batch_id: batchId, count: created.length, records: created }, `提交成功，共 ${created.length} 个产品，等待审核`);
  } catch (err) {
    console.error('[store/warranty-records-batch POST]', err);
    return error('创建质保记录失败', 500);
  }
};
