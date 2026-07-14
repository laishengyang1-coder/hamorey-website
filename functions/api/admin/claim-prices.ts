// ============================================================
// GET/POST/PUT/DELETE /api/admin/claim-prices — 报价管理
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryAll, execute, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const modelId = url.searchParams.get('product_model_id') || '';
    const partId = url.searchParams.get('claim_part_id') || '';

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (modelId) { conditions.push('cp.product_model_id = ?'); params.push(modelId); }
    if (partId) { conditions.push('cp.claim_part_id = ?'); params.push(partId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const items = await queryAll(context.env.DB,
      `SELECT cp.*, pm.model_code, pm.display_name AS model_name,
              cpart.name AS part_name, cpart.category AS part_category
       FROM claim_prices cp
       JOIN product_models pm ON cp.product_model_id = pm.id
       JOIN claim_parts cpart ON cp.claim_part_id = cpart.id
       ${where} ORDER BY pm.model_code, cpart.sort_order, cp.effective_from DESC`,
      ...params);
    return ok({ items });
  } catch (err) { console.error('[claim-prices GET]', err); return error('获取报价失败', 500); }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { product_model_id?: string; claim_part_id?: string; price_cents?: number; effective_from?: string; effective_to?: string };
    if (!body.product_model_id || !body.claim_part_id || body.price_cents == null || !body.effective_from) return error('缺少必填字段', 400);

    const id = generateId();
    const user = getAuthUser(context.data);
    await execute(context.env.DB,
      `INSERT INTO claim_prices (id, product_model_id, claim_part_id, price_cents, effective_from, effective_to, status, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'))`,
      id, body.product_model_id, body.claim_part_id, body.price_cents, body.effective_from, body.effective_to || null, user?.userId || null);

    await writeOperationLog(context.env.DB, user?.userId || null, 'create_claim_price', 'claim_prices', id, body, getClientIP(context.request));
    return ok({ id }, '创建成功');
  } catch (err) { console.error('[claim-prices POST]', err); return error('创建报价失败', 500); }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const priceId = url.pathname.split('/').pop();
    if (!priceId || priceId === 'claim-prices') return error('缺少报价 ID', 400);

    const body = (await context.request.json()) as { price_cents?: number; effective_from?: string; effective_to?: string; status?: string };
    const user = getAuthUser(context.data);
    const updates: string[] = []; const params: unknown[] = [];
    if (body.price_cents != null) { updates.push('price_cents = ?'); params.push(body.price_cents); }
    if (body.effective_from) { updates.push('effective_from = ?'); params.push(body.effective_from); }
    if (body.effective_to !== undefined) { updates.push('effective_to = ?'); params.push(body.effective_to); }
    if (body.status) { updates.push('status = ?'); params.push(body.status); }
    if (updates.length === 0) return error('没有可更新的字段', 400);

    updates.push("updated_at = datetime('now'), updated_by = ?");
    params.push(user?.userId || null, priceId);
    await execute(context.env.DB, `UPDATE claim_prices SET ${updates.join(', ')} WHERE id = ?`, ...params);
    return ok(null, '更新成功');
  } catch (err) { console.error('[claim-prices PUT]', err); return error('更新失败', 500); }
};
