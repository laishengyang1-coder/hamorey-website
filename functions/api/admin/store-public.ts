// ============================================================
// GET/PUT /api/admin/store-public-profiles — 公开门店资料管理
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, execute } from '../_lib';
import { ok, error } from '../_middleware';
import { parsePagination } from '../_lib';

interface Env { DB: D1Database; }

/** GET — 公开门店资料列表 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const province = url.searchParams.get('province') || '';
    const authLevel = url.searchParams.get('authLevel') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (province) { conditions.push('spp.province = ?'); params.push(province); }
    if (authLevel) { conditions.push('spp.auth_level = ?'); params.push(authLevel); }
    if (keyword) { conditions.push('(spp.public_name LIKE ? OR spp.address LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT spp.*, o.code AS org_code, o.status AS org_status
         FROM store_public_profiles spp
         LEFT JOIN organizations o ON o.id = spp.organization_id
         ${where} ORDER BY spp.sort_order ASC, spp.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset),
      queryFirst<{ cnt: number }>(context.env.DB,
        `SELECT COUNT(*) AS cnt FROM store_public_profiles spp ${where}`, ...params),
    ]);
    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[admin/store-public GET]', err);
    return error('获取门店资料失败', 500);
  }
};

/** PUT /api/admin/store-public-profiles/:id */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const parts = new URL(context.request.url).pathname.split('/');
    const id = parts[parts.length - 1];
    if (!id || id === 'store-public-profiles') return error('缺少 ID', 400);

    const body = await context.request.json() as Record<string, unknown>;
    const existing = await queryFirst(context.env.DB, `SELECT id FROM store_public_profiles WHERE id = ?`, id);
    if (!existing) return error('门店资料不存在', 404);

    const updates: string[] = [];
    const params: unknown[] = [];
    const fields = ['public_name', 'auth_level', 'province', 'city', 'address', 'phone', 'business_hours', 'service_products', 'image_file_key', 'is_public', 'sort_order', 'status'];
    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
    }
    if (updates.length === 0) return error('没有需要更新的字段', 400);
    updates.push("updated_at = datetime('now')");
    params.push(id);
    await execute(context.env.DB, `UPDATE store_public_profiles SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const item = await queryFirst(context.env.DB, `SELECT * FROM store_public_profiles WHERE id = ?`, id);
    return ok(item, '更新成功');
  } catch (err) {
    console.error('[admin/store-public PUT]', err);
    return error('更新失败', 500);
  }
};
