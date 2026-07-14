// ============================================================
// POST /api/admin/warranty-codes/allocate — 总部划拨质保码
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, execute, batch, queryAll, writeOperationLog , getAuthUser} from '../_lib';
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
    const statements: Array<{ sql: string; params: unknown[] }> = [];
    const now = new Date().toISOString();

    // 批量划拨
    for (const codeId of body.code_ids) {
      const allocId = generateId();
      statements.push({
        sql: `INSERT INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, reason, created_at)
              VALUES (?, ?, ?, ?, 'allocate', ?, ?, datetime('now'))`,
        params: [allocId, codeId, user?.orgId || null, body.to_org_id, user?.userId || null, body.reason || null],
      });
      statements.push({
        sql: `UPDATE warranty_codes SET owner_org_id = ?, status = 'in_stock' WHERE id = ? AND status IN ('unallocated', 'in_stock')`,
        params: [body.to_org_id, codeId],
      });
    }

    await batch(context.env.DB, statements);

    await writeOperationLog(
      context.env.DB, user?.userId || null, 'allocate_warranty_codes',
      'warranty_codes', null,
      { code_ids: body.code_ids, to_org_id: body.to_org_id, count: body.code_ids.length },
      getClientIP(context.request),
    );

    return ok({ allocated: body.code_ids.length }, '划拨成功');
  } catch (err) {
    console.error('[admin/allocate]', err);
    return error('划拨失败', 500);
  }
};
