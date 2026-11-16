// ============================================================
// /api/province/warranty-codes-revoke — 省代撤回已划给下属门店的质保码
// ------------------------------------------------------------
//   GET  ?q=&limit=   搜索「我下属门店」名下、仍可撤回的质保码
//   POST { ids, reason }  把选中的码从门店收回省代
//
// 规则（与总部 warranty-codes-revoke 一致，但范围收紧到自己的下属门店）：
// - 只能撤回「我的下属门店」持有的码，不能碰别的省代或省代自己的码
// - 状态必须 in_stock / partial_used，且实际用量未超 usage_limit
// - 撤回写 code_allocations(action='revoke', from=门店, to=省代)，并按用量重算 status
// - 全部走同一个 batch()，任一失败整批回滚
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, batch, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env {
  DB: D1Database;
}

const MAX_BATCH = 50;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const keyword = (url.searchParams.get('q') || '').trim();
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)));

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const params: unknown[] = [user.orgId];
    let keywordSql = '';
    if (keyword) {
      keywordSql = 'AND (wc.code LIKE ? OR pm.display_name LIKE ? OR o.name LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const items = await queryAll(
      context.env.DB,
      `SELECT wc.id, wc.code, wc.owner_org_id, wc.usage_limit,
              (SELECT COUNT(*) FROM warranty_records r
                WHERE r.warranty_code_id = wc.id
                  AND r.status IN ('pending', 'active', 'expired')) AS used_count,
              pm.display_name AS model_name,
              o.name AS store_name, o.code AS store_code
         FROM warranty_codes wc
         JOIN organizations o ON o.id = wc.owner_org_id
         JOIN product_models pm ON pm.id = wc.product_model_id
        WHERE o.parent_id = ?
          AND o.type = 'STORE'
          AND wc.status IN ('in_stock', 'partial_used')
          ${keywordSql}
        HAVING used_count < wc.usage_limit
        ORDER BY wc.code
        LIMIT ?`,
      ...params, limit,
    );

    return ok({ items, total: items.length });
  } catch (err) {
    console.error('[province/codes-revoke GET]', err);
    return error('搜索质保码失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { ids?: string[]; reason?: string };
    const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === 'string') : [];
    if (ids.length === 0) return error('请选择需要撤回的质保码', 400);
    if (ids.length > MAX_BATCH) return error(`一次最多撤回 ${MAX_BATCH} 个质保码`, 400);

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await queryAll<{
      id: string; code: string; owner_org_id: string; status: string;
      usage_limit: number; used_count: number; store_name: string;
    }>(
      context.env.DB,
      `SELECT wc.id, wc.code, wc.owner_org_id, wc.status, wc.usage_limit,
              (SELECT COUNT(*) FROM warranty_records r
                WHERE r.warranty_code_id = wc.id
                  AND r.status IN ('pending', 'active', 'expired')) AS used_count,
              o.name AS store_name
         FROM warranty_codes wc
         JOIN organizations o ON o.id = wc.owner_org_id
        WHERE wc.id IN (${placeholders}) AND o.parent_id = ?`,
      ...ids, user.orgId,
    );

    const skipped: Array<{ code: string; reason: string }> = [];
    const statements: Array<{ sql: string; params: unknown[] }> = [];
    const revoked: string[] = [];
    const reason = (body.reason || '').trim() ||
      '省代撤回门店质保码，库存退回省代';

    for (const id of ids) {
      const row = rows.find((r) => r.id === id);
      if (!row) { skipped.push({ code: id, reason: '不是本人下属门店的码' }); continue; }
      if (!['in_stock', 'partial_used'].includes(row.status)) {
        skipped.push({ code: row.code, reason: `状态 ${row.status} 不可撤回` }); continue;
      }
      if (Number(row.used_count) >= Number(row.usage_limit)) {
        skipped.push({ code: row.code, reason: '可使用次数已用完' }); continue;
      }

      statements.push({
        sql: `INSERT INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, reason, created_at)
              VALUES (?, ?, ?, ?, 'revoke', ?, ?, datetime('now'))`,
        params: [generateId(), row.id, row.owner_org_id, user.orgId, user.userId, `${reason}（原属：${row.store_name}）`],
      });
      statements.push({
        sql: `UPDATE warranty_codes
                 SET owner_org_id = ?,
                     status = CASE WHEN used_count > 0 THEN 'partial_used' ELSE 'in_stock' END
               WHERE id = ?`,
        params: [user.orgId, row.id],
      });
      revoked.push(row.code);
    }

    if (statements.length === 0) {
      return error(`没有可撤回的质保码${skipped.length ? `：${skipped.map((s) => `${s.code} ${s.reason}`).join('；')}` : ''}`, 400);
    }

    await batch(context.env.DB, statements);

    await writeOperationLog(
      context.env.DB, user.userId || null, 'revoke_warranty_codes', 'warranty_codes', null,
      { revoked, skipped, count: revoked.length }, getClientIP(context.request),
    );

    return ok(
      { revoked, skipped, count: revoked.length },
      `已撤回 ${revoked.length} 个质保码${skipped.length ? `，${skipped.length} 个已跳过` : ''}`,
    );
  } catch (err) {
    console.error('[province/codes-revoke POST]', err);
    return error('撤回失败', 500);
  }
};
