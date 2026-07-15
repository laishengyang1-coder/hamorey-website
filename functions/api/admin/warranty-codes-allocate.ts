// ============================================================
// POST /api/admin/warranty-codes/allocate — 总部划拨质保码
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, batch, queryFirst, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      code_ids?: string[];
      to_org_id?: string;
      reason?: string;
    };

    if (!body.code_ids || body.code_ids.length === 0) {
      return error('请选择需要划拨的质保码', 400);
    }
    if (!body.to_org_id) {
      return error('请指定接收方', 400);
    }

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const target = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT id FROM organizations
       WHERE id = ? AND type IN ('PROVINCE', 'STORE') AND status = 'active'`,
      body.to_org_id,
    );
    if (!target) return error('接收方不存在或已停用', 400);

    const statements: Array<{ sql: string; params: unknown[] }> = [];
    const allocatedIds: string[] = [];

    for (const codeId of [...new Set(body.code_ids)]) {
      const code = await queryFirst<{
        owner_org_id: string | null;
        status: string;
        used_count: number;
        usage_limit: number;
      }>(
        context.env.DB,
        `SELECT wc.owner_org_id, wc.status,
                MAX(wc.used_count, COALESCE(wu.actual_used_count, 0)) AS used_count,
                wc.usage_limit
         FROM warranty_codes wc
         LEFT JOIN (
           SELECT warranty_code_id, COUNT(*) AS actual_used_count
           FROM warranty_records
           WHERE status IN ('pending', 'active', 'expired')
           GROUP BY warranty_code_id
         ) wu ON wu.warranty_code_id = wc.id
         WHERE wc.id = ?`,
        codeId,
      );
      if (!code || code.owner_org_id === body.to_org_id) continue;
      if (!['unallocated', 'in_stock', 'partial_used'].includes(code.status)) continue;
      if (code.used_count >= code.usage_limit) continue;

      const allocId = generateId();
      statements.push({
        sql: `INSERT INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, reason, created_at)
              VALUES (?, ?, ?, ?, 'allocate', ?, ?, datetime('now'))`,
        params: [allocId, codeId, code.owner_org_id, body.to_org_id, user.userId, body.reason || null],
      });
      statements.push({
        sql: `UPDATE warranty_codes
              SET owner_org_id = ?,
                  status = CASE WHEN used_count > 0 THEN 'partial_used' ELSE 'in_stock' END
              WHERE id = ?`,
        params: [body.to_org_id, codeId],
      });
      allocatedIds.push(codeId);
    }

    if (allocatedIds.length === 0) return error('没有可划拨的质保码', 400);
    await batch(context.env.DB, statements);

    await writeOperationLog(
      context.env.DB, user?.userId || null, 'allocate_warranty_codes',
      'warranty_codes', null,
      { code_ids: allocatedIds, to_org_id: body.to_org_id, count: allocatedIds.length },
      getClientIP(context.request),
    );

    return ok(
      { allocated: allocatedIds.length, skipped: body.code_ids.length - allocatedIds.length },
      '划拨成功',
    );
  } catch (err) {
    console.error('[admin/allocate]', err);
    return error('划拨失败', 500);
  }
};
