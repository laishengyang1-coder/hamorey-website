// ============================================================
// GET /api/province/rewards — 可兑换商品列表（省代视角）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll } from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const items = await queryAll(context.env.DB,
      `SELECT * FROM rewards WHERE status = 'active' ORDER BY sort_order ASC, created_at DESC`);
    return ok({ items });
  } catch (err) {
    console.error('[province/rewards GET]', err);
    return error('获取商品列表失败', 500);
  }
};
