// ============================================================
// /api/admin/banners — 小程序首页轮播图管理（HQ_ADMIN）
// ------------------------------------------------------------
//   GET    /api/admin/banners       列表（含停用，按 sort_order）
//   POST   /api/admin/banners       新建
//   PUT    /api/admin/banners       批量排序 { ids: [...] }
//   PUT    /api/admin/banners/:id   更新（标题/跳转/排序/启用停用）
//   DELETE /api/admin/banners/:id   删除
//
// 图片只存 key（banners/<uuid>.jpg），URL 由接口用 COS 签名现拼，
// 与「积分商城封面」同一套约定（rewards.cover_file_key）。
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute } from '../_lib';
import { ok, error, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

/** 生产环境的 R2 实际是 CosR2Bucket，支持同步签名 */
interface SignedUrlBucket {
  getSignedUrl?: (key: string, expiresInSeconds: number) => string;
}

function imageUrl(bucket: R2Bucket, key: unknown): string | null {
  const k = typeof key === 'string' ? key : '';
  if (!k) return null;
  return (bucket as SignedUrlBucket).getSignedUrl?.(k, 60 * 60 * 24) || null;
}

/** 取 URL 路径最后一段（:id）；集合路径最后一段是 banners */
function tailSegment(context: { request: Request }): string {
  const parts = new URL(context.request.url).pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

interface BannerRow {
  id: string;
  title: string | null;
  image_file_key: string;
  link_page: string | null;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

function decorate(bucket: R2Bucket, rows: BannerRow[]) {
  return rows.map((r) => ({ ...r, image_url: imageUrl(bucket, r.image_file_key) }));
}

/** GET — 全部轮播图（后台管理用，含停用） */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const rows = await queryAll<BannerRow>(
      context.env.DB,
      `SELECT * FROM banners ORDER BY sort_order ASC, created_at ASC`,
    );
    return ok({ items: decorate(context.env.R2, rows) });
  } catch (err) {
    console.error('[admin/banners GET]', err);
    return error('获取轮播图失败', 500);
  }
};

/** POST — 新建 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      title?: string;
      image_file_key?: string;
      link_page?: string;
      status?: string;
    };

    const errors: Array<{ field: string; message: string }> = [];
    const key = (body.image_file_key || '').trim();
    if (!key) errors.push({ field: 'image_file_key', message: '请先上传图片' });
    else if (!key.startsWith('banners/')) errors.push({ field: 'image_file_key', message: '图片路径不合法' });
    if (body.link_page && !body.link_page.startsWith('/pages/')) {
      errors.push({ field: 'link_page', message: '跳转路径需以 /pages/ 开头（留空表示不可点击）' });
    }
    if (errors.length > 0) return validationError(errors);

    const nextRow = await queryFirst<{ n: number }>(
      context.env.DB,
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM banners`,
    );
    const id = generateId();
    await execute(
      context.env.DB,
      `INSERT INTO banners (id, title, image_file_key, link_page, sort_order, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      id,
      body.title?.trim() || null,
      key,
      body.link_page?.trim() || null,
      nextRow?.n ?? 1,
      body.status === 'inactive' ? 'inactive' : 'active',
    );

    const row = await queryFirst<BannerRow>(context.env.DB, `SELECT * FROM banners WHERE id = ?`, id);
    return ok(row ? decorate(context.env.R2, [row])[0] : null, '已添加');
  } catch (err) {
    console.error('[admin/banners POST]', err);
    return error('新增轮播图失败', 500);
  }
};

/** PUT — 集合路径 = 批量排序；带 :id = 更新单条 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const id = tailSegment(context);

    // ---------- 批量排序 ----------
    if (id === 'banners') {
      const body = (await context.request.json()) as { ids?: string[] };
      const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === 'string') : [];
      if (ids.length === 0) return error('缺少排序列表', 400);
      for (let i = 0; i < ids.length; i += 1) {
        await execute(
          context.env.DB,
          `UPDATE banners SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`,
          i + 1,
          ids[i],
        );
      }
      return ok({ count: ids.length }, '排序已保存');
    }

    // ---------- 更新单条 ----------
    const existing = await queryFirst<BannerRow>(context.env.DB, `SELECT * FROM banners WHERE id = ?`, id);
    if (!existing) return error('轮播图不存在', 404);

    const body = (await context.request.json()) as {
      title?: string | null;
      image_file_key?: string;
      link_page?: string | null;
      sort_order?: number;
      status?: string;
    };

    const sets: string[] = [];
    const params: unknown[] = [];

    if (body.title !== undefined) {
      sets.push('title = ?');
      params.push(body.title?.trim() || null);
    }
    if (body.image_file_key !== undefined) {
      const key = body.image_file_key.trim();
      if (!key.startsWith('banners/')) return error('图片路径不合法', 400);
      sets.push('image_file_key = ?');
      params.push(key);
    }
    if (body.link_page !== undefined) {
      const link = body.link_page?.trim() || null;
      if (link && !link.startsWith('/pages/')) {
        return validationError([{ field: 'link_page', message: '跳转路径需以 /pages/ 开头' }]);
      }
      sets.push('link_page = ?');
      params.push(link);
    }
    if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) {
      sets.push('sort_order = ?');
      params.push(Math.trunc(Number(body.sort_order)));
    }
    if (body.status !== undefined) {
      if (body.status !== 'active' && body.status !== 'inactive') return error('状态不合法', 400);
      sets.push('status = ?');
      params.push(body.status);
    }

    if (sets.length === 0) return error('没有需要更新的字段', 400);
    sets.push(`updated_at = datetime('now')`);
    params.push(id);

    await execute(context.env.DB, `UPDATE banners SET ${sets.join(', ')} WHERE id = ?`, ...params);
    const row = await queryFirst<BannerRow>(context.env.DB, `SELECT * FROM banners WHERE id = ?`, id);
    return ok(row ? decorate(context.env.R2, [row])[0] : null, '已保存');
  } catch (err) {
    console.error('[admin/banners PUT]', err);
    return error('保存轮播图失败', 500);
  }
};

/** DELETE — 删除单条（图片文件保留在 COS，不占业务风险） */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = tailSegment(context);
    if (!id || id === 'banners') return error('缺少轮播图 ID', 400);

    const existing = await queryFirst<{ id: string }>(context.env.DB, `SELECT id FROM banners WHERE id = ?`, id);
    if (!existing) return error('轮播图不存在', 404);

    await execute(context.env.DB, `DELETE FROM banners WHERE id = ?`, id);
    return ok(null, '已删除');
  } catch (err) {
    console.error('[admin/banners DELETE]', err);
    return error('删除轮播图失败', 500);
  }
};
