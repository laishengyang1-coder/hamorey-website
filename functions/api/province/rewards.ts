// ============================================================
// GET /api/province/rewards — 可兑换商品列表（省代视角）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { getRewardCoverUrl, queryAll } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const items = await queryAll<Record<string, unknown>>(context.env.DB,
      `SELECT * FROM rewards WHERE status = 'active' ORDER BY sort_order ASC, created_at DESC`);
    return ok({
      items: items.map((item) => ({
        ...item,
        cover_url: getRewardCoverUrl(
          context.env.R2,
          typeof item.cover_file_key === 'string' ? item.cover_file_key : null,
        ),
      })),
    });
  } catch (err) {
    console.error('[province/rewards GET]', err);
    return error('获取商品列表失败', 500);
  }
};
