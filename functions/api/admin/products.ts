// ============================================================
// GET/POST/PUT /api/admin/products — 产品管理
// GET/POST/PUT /api/admin/product-models — 产品型号管理
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryAll, execute } from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

function isModelRoute(pathname: string): boolean {
  return pathname.includes('/product-models');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    if (isModelRoute(url.pathname)) {
      const productId = url.searchParams.get('product_id') || '';
      const sql = productId
        ? `SELECT pm.*, p.name_cn AS product_name, p.category AS product_category
           FROM product_models pm JOIN products p ON pm.product_id = p.id
           WHERE pm.product_id = ? ORDER BY pm.sort_order`
        : `SELECT pm.*, p.name_cn AS product_name, p.category AS product_category
           FROM product_models pm JOIN products p ON pm.product_id = p.id
           ORDER BY p.sort_order, pm.sort_order`;
      const params = productId ? [productId] : [];
      const items = await queryAll(context.env.DB, sql, ...params);
      return ok({ items });
    }

    const items = await queryAll(context.env.DB, `SELECT * FROM products ORDER BY sort_order`);
    return ok({ items });
  } catch (err) { console.error('[products GET]', err); return error('获取产品列表失败', 500); }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const body = (await context.request.json()) as Record<string, unknown>;

    if (isModelRoute(url.pathname)) {
      if (!body.product_id || !body.model_code || !body.display_name) return error('缺少必填字段', 400);
      const id = generateId();
      await execute(context.env.DB,
        `INSERT INTO product_models (id, product_id, model_code, display_name, warranty_years, status, sort_order)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        id, body.product_id, body.model_code, body.display_name, body.warranty_years || 5, body.sort_order || 0);
      return ok({ id }, '创建成功');
    }

    if (!body.name_cn || !body.category) return error('缺少必填字段', 400);
    const id = generateId();
    await execute(context.env.DB,
      `INSERT INTO products (id, category, name_cn, name_en, default_warranty_years, default_usage_limit, website_visible, warranty_enabled, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      id, body.category, body.name_cn, body.name_en || null, body.default_warranty_years || 5, body.default_usage_limit || 1,
      body.website_visible !== undefined ? (body.website_visible ? 1 : 0) : 1,
      body.warranty_enabled !== undefined ? (body.warranty_enabled ? 1 : 0) : 1,
      body.sort_order || 0);
    return ok({ id }, '创建成功');
  } catch (err) { console.error('[products POST]', err); return error('创建失败', 500); }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const itemId = url.pathname.split('/').pop();
    if (!itemId) return error('缺少 ID', 400);

    const body = (await context.request.json()) as Record<string, unknown>;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (isModelRoute(url.pathname)) {
      if (body.display_name) { updates.push('display_name = ?'); params.push(body.display_name); }
      if (body.model_code) { updates.push('model_code = ?'); params.push(body.model_code); }
      if (body.warranty_years != null) { updates.push('warranty_years = ?'); params.push(body.warranty_years); }
      if (body.sort_order != null) { updates.push('sort_order = ?'); params.push(body.sort_order); }
      if (body.status) { updates.push('status = ?'); params.push(body.status); }
    } else {
      if (body.name_cn) { updates.push('name_cn = ?'); params.push(body.name_cn); }
      if (body.category) { updates.push('category = ?'); params.push(body.category); }
      if (body.sort_order != null) { updates.push('sort_order = ?'); params.push(body.sort_order); }
      if (body.status) { updates.push('status = ?'); params.push(body.status); }
    }

    if (updates.length === 0) return error('没有可更新的字段', 400);
    updates.push("updated_at = datetime('now')");
    params.push(itemId);

    const table = isModelRoute(url.pathname) ? 'product_models' : 'products';
    await execute(context.env.DB, `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, ...params);
    return ok(null, '更新成功');
  } catch (err) { console.error('[products PUT]', err); return error('更新失败', 500); }
};
