// ============================================================
// GET/POST/PUT /api/admin/organizations — 总部管理省代/门店
// GET  ?type=PROVINCE|STORE&province=&status=&page=&pageSize=
// POST 创建省代或直属门店
// PUT  /api/admin/organizations/:id 编辑
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, parsePagination, writeOperationLog, getAuthUser, deleteOrganizationWithDependencies } from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
}

/** GET /api/admin/organizations — 省代/门店列表 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || '';
    const province = url.searchParams.get('province') || '';
    const status = url.searchParams.get('status') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type && type !== 'HQ') {
      conditions.push(`o.type = ?`);
      params.push(type);
    } else if (!type) {
      conditions.push(`o.type != 'HQ'`);
    }

    if (province) {
      conditions.push(`o.province = ?`);
      params.push(province);
    }

    if (status) {
      conditions.push(`o.status = ?`);
      params.push(status);
    }

    if (keyword) {
      conditions.push(`(o.name LIKE ? OR o.code LIKE ? OR o.contact_name LIKE ?)`);
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      queryAll(
        context.env.DB,
        `SELECT o.*,
                (SELECT COUNT(*) FROM organizations sub WHERE sub.parent_id = o.id) AS child_count
         FROM organizations o ${where}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        ...params,
        pageSize,
        offset,
      ),
      queryFirst<{ cnt: number }>(
        context.env.DB,
        `SELECT COUNT(*) AS cnt FROM organizations o ${where}`,
        ...params,
      ),
    ]);

    const total = totalRow?.cnt ?? 0;

    return ok({ items, total, page, pageSize });
  } catch (err) {
    console.error('[admin/organizations GET]', err);
    return error('获取组织列表失败', 500);
  }
};

/** POST /api/admin/organizations — 创建省代或直属门店 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      code?: string;
      type?: string;
      parent_id?: string;
      name?: string;
      province?: string;
      city?: string;
      address?: string;
      contact_name?: string;
      phone?: string;
    };

    // 校验
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.code) errors.push({ field: 'code', message: '组织编码不能为空' });
    if (!body.type || !['PROVINCE', 'STORE'].includes(body.type))
      errors.push({ field: 'type', message: '组织类型必须为 PROVINCE 或 STORE' });
    if (!body.name) errors.push({ field: 'name', message: '组织名称不能为空' });
    if (errors.length > 0) return validationError(errors);

    // 检查编码唯一性
    const existing = await queryFirst(
      context.env.DB,
      `SELECT id FROM organizations WHERE code = ?`,
      body.code,
    );
    if (existing) return error('组织编码已存在', 409);

    const id = generateId();
    const user = getAuthUser(context.data);

    await execute(
      context.env.DB,
      `INSERT INTO organizations (id, code, type, parent_id, name, province, city, address, contact_name, phone, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now'))`,
      id,
      body.code,
      body.type,
      body.parent_id || null,
      body.name,
      body.province || null,
      body.city || null,
      body.address || null,
      body.contact_name || null,
      body.phone || null,
      user?.userId || null,
    );

    // 为新增门店自动创建官网公开资料（默认服务点、立即公开）
    if (body.type === 'STORE') {
      const existingProfile = await queryFirst(
        context.env.DB,
        `SELECT id FROM store_public_profiles WHERE organization_id = ?`,
        id,
      );
      if (!existingProfile) {
        const profileId = generateId();
        await execute(
          context.env.DB,
          `INSERT INTO store_public_profiles (id, organization_id, public_name, auth_level, province, city, address, phone, is_public, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, 'Service_Point', ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))`,
          profileId,
          id,
          body.name,
          body.province || null,
          body.city || null,
          body.address || null,
          body.phone || null,
        );
      }
    }

    await writeOperationLog(
      context.env.DB,
      user?.userId || null,
      'create_organization',
      'organization',
      id,
      body,
      getClientIP(context.request),
    );

    const created = await queryFirst(context.env.DB, `SELECT * FROM organizations WHERE id = ?`, id);
    return ok(created, '创建成功');
  } catch (err) {
    console.error('[admin/organizations POST]', err);
    return error('创建组织失败', 500);
  }
};

/** PUT /api/admin/organizations/:id — 编辑组织 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const parts = url.pathname.split('/');
    const orgId = parts[parts.length - 1];

    if (!orgId || orgId === 'organizations') {
      return error('缺少组织 ID', 400);
    }

    const body = (await context.request.json()) as {
      name?: string;
      province?: string;
      city?: string;
      address?: string;
      contact_name?: string;
      phone?: string;
      status?: string;
    };

    const existing = await queryFirst<{ id: string; type: string }>(context.env.DB, `SELECT id, type FROM organizations WHERE id = ?`, orgId);
    if (!existing) return error('组织不存在', 404);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.province !== undefined) { updates.push('province = ?'); params.push(body.province); }
    if (body.city !== undefined) { updates.push('city = ?'); params.push(body.city); }
    if (body.address !== undefined) { updates.push('address = ?'); params.push(body.address); }
    if (body.contact_name !== undefined) { updates.push('contact_name = ?'); params.push(body.contact_name); }
    if (body.phone !== undefined) { updates.push('phone = ?'); params.push(body.phone); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }

    if (updates.length === 0) return error('没有需要更新的字段', 400);

    updates.push("updated_at = datetime('now')");
    params.push(orgId);

    await execute(
      context.env.DB,
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`,
      ...params,
    );

    // 同步更新门店的官网公开资料（只同步基础字段，不覆盖授权等级/营业时间等）
    if (existing.type === 'STORE') {
      const profile = await queryFirst<{ id: string }>(
        context.env.DB,
        `SELECT id FROM store_public_profiles WHERE organization_id = ?`,
        orgId,
      );
      if (profile) {
        const profileUpdates: string[] = [];
        const profileParams: unknown[] = [];
        if (body.name !== undefined) { profileUpdates.push('public_name = ?'); profileParams.push(body.name); }
        if (body.province !== undefined) { profileUpdates.push('province = ?'); profileParams.push(body.province); }
        if (body.city !== undefined) { profileUpdates.push('city = ?'); profileParams.push(body.city); }
        if (body.address !== undefined) { profileUpdates.push('address = ?'); profileParams.push(body.address); }
        if (body.phone !== undefined) { profileUpdates.push('phone = ?'); profileParams.push(body.phone); }
        if (profileUpdates.length > 0) {
          profileUpdates.push("updated_at = datetime('now')");
          profileParams.push(profile.id);
          await execute(
            context.env.DB,
            `UPDATE store_public_profiles SET ${profileUpdates.join(', ')} WHERE id = ?`,
            ...profileParams,
          );
        }
      } else {
        // 若门店此前无公开资料，自动补一条
        const orgName =
          body.name ??
          (await queryFirst<{ name: string }>(context.env.DB, `SELECT name FROM organizations WHERE id = ?`, orgId))?.name ??
          '';
        const profileId = generateId();
        await execute(
          context.env.DB,
          `INSERT INTO store_public_profiles (id, organization_id, public_name, auth_level, province, city, address, phone, is_public, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, 'Service_Point', ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))`,
          profileId,
          orgId,
          orgName,
          body.province ?? null,
          body.city ?? null,
          body.address ?? null,
          body.phone ?? null,
        );
      }
    }

    const user = getAuthUser(context.data);
    await writeOperationLog(
      context.env.DB,
      user?.userId || null,
      'update_organization',
      'organization',
      orgId,
      body,
      getClientIP(context.request),
    );

    const updated = await queryFirst(context.env.DB, `SELECT * FROM organizations WHERE id = ?`, orgId);
    return ok(updated, '更新成功');
  } catch (err) {
    console.error('[admin/organizations PUT]', err);
    return error('更新组织失败', 500);
  }
};

/** DELETE /api/admin/organizations/:id — 删除组织（级联删除关联数据） */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const parts = url.pathname.split('/');
    const orgId = parts[parts.length - 1];
    if (!orgId || orgId === 'organizations') return error('缺少组织 ID', 400);

    const org = await queryFirst<{ id: string; type: string; name: string }>(
      context.env.DB,
      `SELECT id, type, name FROM organizations WHERE id = ?`,
      orgId,
    );
    if (!org) return error('组织不存在', 404);
    if (org.type === 'HQ') return error('总部组织不可删除', 400);

    // 级联删除组织及其关联数据
    await deleteOrganizationWithDependencies(context.env.DB, orgId);

    const user = getAuthUser(context.data);
    await writeOperationLog(
      context.env.DB,
      user?.userId || null,
      'delete_organization',
      'organization',
      orgId,
      { deleted_type: org.type, deleted_name: org.name },
      getClientIP(context.request),
    );

    return ok(null, '删除成功');
  } catch (err) {
    console.error('[admin/organizations DELETE]', err);
    return error('删除组织失败：' + (err instanceof Error ? err.message : '未知错误'), 500);
  }
};
