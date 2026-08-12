// ============================================================
// GET  /api/admin/warranty-codes — 总部质保码列表（状态筛选/批次/型号/归属）
// POST /api/admin/warranty-codes — 总部手动新增单个质保码（直接分配给门店，可立即用于录入质保）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryAll, queryFirst, execute, parsePagination, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);

    // 质保码库存树形可视化
    if (url.searchParams.get('type') === 'tree') {
      const [hq, provinces, stores] = await Promise.all([
        queryFirst<{ id: string; name: string; total: number; available: number }>(
          context.env.DB,
          `SELECT o.id, o.name, COUNT(wc.id) AS total, COALESCE(SUM(CASE WHEN wc.status='in_stock' THEN 1 ELSE 0 END),0) AS available FROM organizations o LEFT JOIN warranty_codes wc ON wc.owner_org_id=o.id WHERE o.type='HQ' GROUP BY o.id`,
        ),
        queryAll<{ id: string; name: string; province: string; total: number; available: number }>(
          context.env.DB,
          `SELECT o.id, o.name, o.province, COUNT(wc.id) AS total, COALESCE(SUM(CASE WHEN wc.status='in_stock' THEN 1 ELSE 0 END),0) AS available FROM organizations o LEFT JOIN warranty_codes wc ON wc.owner_org_id=o.id WHERE o.type='PROVINCE' GROUP BY o.id ORDER BY total DESC`,
        ),
        queryAll<{ id: string; name: string; parent_id: string; province: string; city: string; total: number; available: number }>(
          context.env.DB,
          `SELECT o.id, o.name, o.parent_id, o.province, o.city, COUNT(wc.id) AS total, COALESCE(SUM(CASE WHEN wc.status='in_stock' THEN 1 ELSE 0 END),0) AS available FROM organizations o LEFT JOIN warranty_codes wc ON wc.owner_org_id=o.id WHERE o.type='STORE' GROUP BY o.id ORDER BY total DESC, o.code ASC`,
        ),
      ]);
      // 按 parent_id 分组门店
      const storeMap: Record<string, typeof stores> = {};
      for (const s of stores) {
        const pid = s.parent_id || '';
        if (!storeMap[pid]) storeMap[pid] = [];
        storeMap[pid].push(s);
      }
      const tree = {
        hq: hq ? { name: hq.name, total: hq.total, available: hq.available } : { name: '总部', total: 0, available: 0 },
        provinces: provinces.map((p) => ({
          ...p,
          stores: storeMap[p.id] || [],
          storeCount: (storeMap[p.id] || []).length,
        })),
      };
      return ok(tree);
    }

    const status = url.searchParams.get('status') || '';
    const batchNo = url.searchParams.get('batch_no') || '';
    const modelId = url.searchParams.get('product_model_id') || '';
    const ownerId = url.searchParams.get('owner_org_id') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortDir = url.searchParams.get('sort_dir') === 'asc' ? 'ASC' : 'DESC';
    const { page, pageSize, offset } = parsePagination(url);
    const sortColumns: Record<string, string> = {
      code: 'code',
      model_name: 'model_name',
      batch_no: 'batch_no',
      owner_name: 'owner_name',
      used_count: 'used_count',
      usage_limit: 'usage_limit',
      status: 'status',
      created_at: 'created_at',
    };
    const orderBy = sortColumns[sortBy] || sortColumns.created_at;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (batchNo) { conditions.push('wc.batch_no = ?'); params.push(batchNo); }
    if (modelId) { conditions.push('wc.product_model_id = ?'); params.push(modelId); }
    if (ownerId) { conditions.push('wc.owner_org_id = ?'); params.push(ownerId); }
    if (keyword) {
      conditions.push('(wc.code LIKE ? OR wc.imported_product_name LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const baseWhere = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const resultConditions: string[] = [];
    const resultParams: unknown[] = [];
    if (status) { resultConditions.push('status = ?'); resultParams.push(status); }
    const resultWhere = resultConditions.length > 0 ? `WHERE ${resultConditions.join(' AND ')}` : '';
    const usageSql = `SELECT warranty_code_id, COUNT(*) AS actual_used_count
                      FROM warranty_records
                      WHERE status IN ('pending', 'active', 'expired')
                      GROUP BY warranty_code_id`;
    const listSql = `FROM (
        SELECT wc.id, wc.code, wc.product_model_id, wc.imported_product_name, wc.batch_no,
               wc.import_batch_id, wc.owner_org_id, wc.usage_limit,
               MIN(COALESCE(wu.actual_used_count, 0), wc.usage_limit) AS used_count,
               CASE
                 WHEN wc.status IN ('frozen', 'voided') THEN wc.status
                 WHEN COALESCE(wu.actual_used_count, 0) >= wc.usage_limit THEN 'exhausted'
                 WHEN COALESCE(wu.actual_used_count, 0) > 0 THEN 'partial_used'
                 WHEN wc.owner_org_id IS NULL THEN 'unallocated'
                 ELSE 'in_stock'
               END AS status,
               wc.created_at, pm.model_code, pm.display_name AS model_name, o.name AS owner_name
        FROM warranty_codes wc
        JOIN product_models pm ON wc.product_model_id = pm.id
        LEFT JOIN organizations o ON wc.owner_org_id = o.id
        LEFT JOIN (${usageSql}) wu ON wu.warranty_code_id = wc.id
        ${baseWhere}
      ) codes`;

    const [items, totalRow] = await Promise.all([
      queryAll(
        context.env.DB,
        `SELECT *
         ${listSql}
         ${resultWhere}
         ORDER BY ${orderBy} ${sortDir}, created_at DESC
         LIMIT ? OFFSET ?`,
        ...params, ...resultParams, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt ${listSql} ${resultWhere}`,
        ...params, ...resultParams,
      ),
    ]);

    const total = totalRow?.cnt ?? 0;
    return ok({ items, total, page, pageSize });
  } catch (err) {
    console.error('[admin/warranty-codes GET]', err);
    return error('获取质保码列表失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    if (user.role !== 'HQ_ADMIN') return error('仅总部可手动新增质保码', 403);

    const body = (await context.request.json()) as {
      code?: string;
      product_model_id?: string;
      store_id?: string;
      batch_no?: string;
      usage_limit?: number;
    };

    // 校验必填
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.code || !body.code.trim()) errors.push({ field: 'code', message: '质保码不能为空' });
    if (!body.product_model_id) errors.push({ field: 'product_model_id', message: '请选择产品型号' });
    if (!body.store_id) errors.push({ field: 'store_id', message: '请选择所属门店' });
    if (errors.length > 0) return validationError(errors);

    const code = body.code!.trim();

    // 质保码唯一性
    const existing = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT id FROM warranty_codes WHERE code = ? COLLATE NOCASE`,
      code,
    );
    if (existing) return error('该质保码已存在', 409);

    // 产品型号必须有效且启用
    const model = await queryFirst<{ display_name: string; usage_limit: number; status: string }>(
      context.env.DB,
      `SELECT display_name, usage_limit, status FROM product_models WHERE id = ?`,
      body.product_model_id,
    );
    if (!model) return error('产品型号不存在', 404);
    if (model.status !== 'active') return error('该产品型号已停用', 400);

    // 门店必须有效且启用
    const store = await queryFirst<{ id: string; name: string }>(
      context.env.DB,
      `SELECT id, name FROM organizations WHERE id = ? AND type = 'STORE' AND status = 'active'`,
      body.store_id,
    );
    if (!store) return error('所选门店不存在或已停用', 404);

    const usageLimit = Math.max(1, Number(body.usage_limit) || Number(model.usage_limit) || 1);
    const batchNo = (body.batch_no && body.batch_no.trim()) || `MANUAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const codeId = generateId();

    // 直接分配给门店，状态为 in_stock（可立即用于录入质保）
    await execute(
      context.env.DB,
      `INSERT INTO warranty_codes (id, code, product_model_id, imported_product_name, batch_no, import_batch_id, owner_org_id, usage_limit, used_count, status, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 0, 'in_stock', datetime('now'))`,
      codeId, code, body.product_model_id, model.display_name, batchNo, body.store_id, usageLimit,
    );

    await writeOperationLog(
      context.env.DB, user.userId, 'admin_create_warranty_code',
      'warranty_codes', codeId,
      { code, product_model_id: body.product_model_id, store_id: body.store_id, batch_no: batchNo, usage_limit: usageLimit },
      getClientIP(context.request),
    );

    return ok({ id: codeId, code }, '新增成功，质保码已分配给所选门店，可立即用于录入质保');
  } catch (err) {
    console.error('[admin/warranty-codes POST]', err);
    return error('新增质保码失败', 500);
  }
};
