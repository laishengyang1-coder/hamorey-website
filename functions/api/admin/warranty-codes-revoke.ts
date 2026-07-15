// ============================================================
// POST /api/admin/warranty-codes/revoke — 总部撤回划拨
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, execute, queryFirst, batch, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      code_ids?: string[];
      reason?: string;
    };

    if (!body.code_ids || body.code_ids.length === 0) {
      return error('请选择需要撤回的质保码', 400);
    }

    const user = getAuthUser(context.data);
    if (!user?.orgId) return error('未登录', 401);
    const statements: Array<{ sql: string; params: unknown[] }> = [];
    const revokedIds: string[] = [];

    for (const codeId of [...new Set(body.code_ids)]) {
      // 查询当前归属和状态
      const code = await queryFirst<{ owner_org_id: string; status: string }>(
        context.env.DB,
        `SELECT owner_org_id, status FROM warranty_codes WHERE id = ?`,
        codeId,
      );
      if (!code || code.owner_org_id === user.orgId) continue;
      if (!['in_stock', 'partial_used'].includes(code.status)) continue;

      const allocId = generateId();
      statements.push({
        sql: `INSERT INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, reason, created_at)
              VALUES (?, ?, ?, ?, 'revoke', ?, ?, datetime('now'))`,
        params: [allocId, codeId, code.owner_org_id, user.orgId, user.userId, body.reason || null],
      });
      statements.push({
        sql: `UPDATE warranty_codes
              SET owner_org_id = ?,
                  status = CASE WHEN used_count > 0 THEN 'partial_used' ELSE 'in_stock' END
              WHERE id = ?`,
        params: [user.orgId, codeId],
      });
      revokedIds.push(codeId);
    }

    if (revokedIds.length === 0) return error('没有可撤回的质保码', 400);
    await batch(context.env.DB, statements);

    await writeOperationLog(
      context.env.DB, user?.userId || null, 'revoke_warranty_codes',
      'warranty_codes', null,
      { code_ids: revokedIds, count: revokedIds.length },
      getClientIP(context.request),
    );

    return ok(
      { revoked: revokedIds.length, skipped: body.code_ids.length - revokedIds.length },
      '撤回成功',
    );
  } catch (err) {
    console.error('[admin/revoke]', err);
    return error('撤回失败', 500);
  }
};
