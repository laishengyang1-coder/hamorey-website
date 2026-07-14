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
    const statements: Array<{ sql: string; params: unknown[] }> = [];

    for (const codeId of body.code_ids) {
      // 查询当前归属和状态
      const code = await queryFirst<{ owner_org_id: string; status: string }>(
        context.env.DB,
        `SELECT owner_org_id, status FROM warranty_codes WHERE id = ?`,
        codeId,
      );
      if (!code) continue;
      if (code.status === 'exhausted' || code.status === 'voided') {
        continue; // 已用完或已作废的不能撤回
      }

      const allocId = generateId();
      statements.push({
        sql: `INSERT INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, reason, created_at)
              VALUES (?, ?, ?, NULL, 'revoke', ?, ?, datetime('now'))`,
        params: [allocId, codeId, code.owner_org_id, user?.userId || null, body.reason || null],
      });
      statements.push({
        sql: `UPDATE warranty_codes SET owner_org_id = NULL, status = 'unallocated' WHERE id = ?`,
        params: [codeId],
      });
    }

    await batch(context.env.DB, statements);

    await writeOperationLog(
      context.env.DB, user?.userId || null, 'revoke_warranty_codes',
      'warranty_codes', null,
      { code_ids: body.code_ids, count: body.code_ids.length },
      getClientIP(context.request),
    );

    return ok({ revoked: body.code_ids.length }, '撤回成功');
  } catch (err) {
    console.error('[admin/revoke]', err);
    return error('撤回失败', 500);
  }
};
