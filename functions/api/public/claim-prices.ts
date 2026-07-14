// ============================================================
// GET /api/public/claim-prices — 公开查询报价
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const modelCode = url.searchParams.get('model_code');

    if (!modelCode) {
      // 返回所有活跃报价（按型号+部位）
      const prices = await queryAll(
        context.env.DB,
        `SELECT cprice.id, pm.model_code, pm.display_name AS model_name,
                cpart.name AS part_name, cpart.category,
                cprice.price_cents, cprice.effective_from, cprice.effective_to
         FROM claim_prices cprice
         JOIN product_models pm ON cprice.product_model_id = pm.id
         JOIN claim_parts cpart ON cprice.claim_part_id = cpart.id
         WHERE cprice.status = 'active'
           AND cprice.effective_from <= datetime('now')
           AND (cprice.effective_to IS NULL OR cprice.effective_to >= datetime('now'))
         ORDER BY pm.model_code, cpart.sort_order`,
      );
      return ok({ prices });
    }

    // 按型号筛选
    const prices = await queryAll(
      context.env.DB,
      `SELECT cprice.id, pm.model_code, pm.display_name AS model_name,
              cpart.name AS part_name, cpart.category,
              cprice.price_cents, cprice.effective_from, cprice.effective_to
       FROM claim_prices cprice
       JOIN product_models pm ON cprice.product_model_id = pm.id
       JOIN claim_parts cpart ON cprice.claim_part_id = cpart.id
       WHERE pm.model_code = ? AND cprice.status = 'active'
         AND cprice.effective_from <= datetime('now')
         AND (cprice.effective_to IS NULL OR cprice.effective_to >= datetime('now'))
       ORDER BY cpart.sort_order`,
      modelCode,
    );

    return ok({ model_code: modelCode, prices });
  } catch (err) {
    console.error('[public/claim-prices]', err);
    return error('查询报价失败', 500);
  }
};
