// ============================================================
// GET /api/public/banners — 小程序首页轮播图（免登录）
// ------------------------------------------------------------
// 只返回 status='active' 的，按 sort_order 升序。
// image_url 由服务端现拼 COS 签名直链（24 小时），
// 同时回传 image_file_key 供客户端走 /api/public/photos/ 兜底。
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

interface SignedUrlBucket {
  getSignedUrl?: (key: string, expiresInSeconds: number) => string;
}

interface BannerRow {
  id: string;
  title: string | null;
  image_file_key: string;
  link_page: string | null;
  sort_order: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const rows = await queryAll<BannerRow>(
      context.env.DB,
      `SELECT id, title, image_file_key, link_page, sort_order
         FROM banners
        WHERE status = 'active'
        ORDER BY sort_order ASC, created_at ASC`,
    );

    const bucket = context.env.R2 as SignedUrlBucket;
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      image_url: bucket.getSignedUrl?.(r.image_file_key, 60 * 60 * 24) || null,
      image_file_key: r.image_file_key,
      link_page: r.link_page,
      sort_order: r.sort_order,
    }));

    return ok({ items, total: items.length });
  } catch (err) {
    console.error('[public/banners GET]', err);
    return error('获取轮播图失败', 500);
  }
};
