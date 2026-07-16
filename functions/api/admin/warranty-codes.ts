// ============================================================
// GET /api/admin/warranty-codes — 总部质保码列表（状态筛选/批次/型号/归属）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, queryFirst, parsePagination } from '../_lib';
import { ok, error } from '../_middleware';

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
          `SELECT o.id, o.name, o.parent_id, o.province, o.city, COUNT(wc.id) AS total, COALESCE(SUM(CASE WHEN wc.status='in_stock' THEN 1 ELSE 0 END),0) AS available FROM organizations o LEFT JOIN warranty_codes wc ON wc.owner_org_id=o.id WHERE o.type='STORE' GROUP BY o.id HAVING total > 0 ORDER BY total DESC`,
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
