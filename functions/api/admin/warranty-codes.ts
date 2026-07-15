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
    const status = url.searchParams.get('status') || '';
    const batchNo = url.searchParams.get('batch_no') || '';
    const modelId = url.searchParams.get('product_model_id') || '';
    const ownerId = url.searchParams.get('owner_org_id') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortDir = url.searchParams.get('sort_dir') === 'asc' ? 'ASC' : 'DESC';
    const { page, pageSize, offset } = parsePagination(url);
    const sortColumns: Record<string, string> = {
      code: 'wc.code',
      model_name: 'pm.display_name',
      batch_no: 'wc.batch_no',
      owner_name: 'o.name',
      used_count: 'wc.used_count',
      usage_limit: 'wc.usage_limit',
      status: 'wc.status',
      created_at: 'wc.created_at',
    };
    const orderBy = sortColumns[sortBy] || sortColumns.created_at;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) { conditions.push('wc.status = ?'); params.push(status); }
    if (batchNo) { conditions.push('wc.batch_no = ?'); params.push(batchNo); }
    if (modelId) { conditions.push('wc.product_model_id = ?'); params.push(modelId); }
    if (ownerId) { conditions.push('wc.owner_org_id = ?'); params.push(ownerId); }
    if (keyword) {
      conditions.push('(wc.code LIKE ? OR wc.imported_product_name LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      queryAll(
        context.env.DB,
        `SELECT wc.*, pm.model_code, pm.display_name AS model_name,
                o.name AS owner_name
         FROM warranty_codes wc
         JOIN product_models pm ON wc.product_model_id = pm.id
         LEFT JOIN organizations o ON wc.owner_org_id = o.id
         ${where}
         ORDER BY ${orderBy} ${sortDir}, wc.created_at DESC
         LIMIT ? OFFSET ?`,
        ...params, pageSize, offset,
      ),
      queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt FROM warranty_codes wc ${where}`,
        ...params,
      ),
    ]);

    const total = totalRow?.cnt ?? 0;
    return ok({ items, total, page, pageSize });
  } catch (err) {
    console.error('[admin/warranty-codes GET]', err);
    return error('获取质保码列表失败', 500);
  }
};
