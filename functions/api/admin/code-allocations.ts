// ============================================================
// GET /api/admin/code-allocations — 总部库存流转记录
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { parsePagination, queryAll, queryFirst } from '../_lib';
import { error, ok } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const keyword = url.searchParams.get('keyword')?.trim() || '';
    const action = url.searchParams.get('action') || '';
    const dateStart = url.searchParams.get('dateStart')?.trim() || '';
    const dateEnd = url.searchParams.get('dateEnd')?.trim() || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];

    // 只接受 YYYY-MM-DD，非法值直接忽略（避免拼出坏日期把整条查询打死）
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const nextDay = (day: string) => {
      const d = new Date(`${day}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().slice(0, 10);
    };

    if (action) {
      conditions.push('ca.action = ?');
      params.push(action);
    }
    // created_at 存的是本地墙钟，所以按 [当天 00:00:00, 次日 00:00:00) 取闭开区间
    if (DATE_RE.test(dateStart)) {
      conditions.push('ca.created_at >= ?');
      params.push(`${dateStart} 00:00:00`);
    }
    if (DATE_RE.test(dateEnd)) {
      conditions.push('ca.created_at < ?');
      params.push(`${nextDay(dateEnd)} 00:00:00`);
    }
    if (keyword) {
      const like = `%${keyword}%`;
      // 2026-10-09 起也匹配「备注」与「内部批次号」，否则搜单据号/订货单日期一律搜不到
      conditions.push(`(
        wc.code LIKE ?
        OR wc.imported_product_name LIKE ?
        OR pm.model_code LIKE ?
        OR pm.display_name LIKE ?
        OR from_org.name LIKE ?
        OR to_org.name LIKE ?
        OR ca.reason LIKE ?
        OR wc.import_batch_id LIKE ?
        OR wc.batch_no LIKE ?
      )`);
      params.push(like, like, like, like, like, like, like, like, like);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const from = `
      FROM code_allocations ca
      INNER JOIN warranty_codes wc ON wc.id = ca.warranty_code_id
      LEFT JOIN product_models pm ON pm.id = wc.product_model_id
      LEFT JOIN organizations from_org ON from_org.id = ca.from_org_id
      LEFT JOIN organizations to_org ON to_org.id = ca.to_org_id
      LEFT JOIN users operator ON operator.id = ca.operator_user_id
      ${where}
    `;

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB, `
        SELECT
          ca.id,
          ca.action,
          ca.reason,
          ca.created_at,
          wc.code,
          wc.imported_product_name,
          pm.model_code,
          pm.display_name AS model_name,
          from_org.name AS from_org_name,
          to_org.name AS to_org_name,
          operator.username AS operator_name
        ${from}
        ORDER BY ca.created_at DESC, ca.id DESC
        LIMIT ? OFFSET ?
      `, ...params, pageSize, offset),
      queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt ${from}`, ...params),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[admin/code-allocations GET]', err);
    return error('获取库存流转记录失败', 500);
  }
};
