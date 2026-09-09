// ============================================================
// GET  /api/store/film-exchange — 门店我的换膜无忧申请列表
// POST /api/store/film-exchange — 提交换膜无忧申请
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, parsePagination, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP, validationError } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

const FILM_TYPE_MAP: Record<string, string> = { ppf: '车衣', window: '窗膜' };

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const url = new URL(context.request.url);
    const status = url.searchParams.get('status') || '';
    const { page, pageSize, offset } = parsePagination(url);

    const conditions: string[] = ['r.store_id = ?'];
    const params: unknown[] = [user.orgId];
    if (status) { conditions.push('r.status = ?'); params.push(status); }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      queryAll(context.env.DB,
        `SELECT r.* FROM film_exchange_requests r ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
        ...params, pageSize, offset),
      queryFirst<{ cnt: number }>(context.env.DB,
        `SELECT COUNT(*) AS cnt FROM film_exchange_requests r ${where}`, ...params),
    ]);

    return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
  } catch (err) {
    console.error('[store/film-exchange GET]', err);
    return error('获取换膜申请失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      warranty_record_id?: string;
      damage_part?: string;
      description?: string;
      media_keys?: Array<{ key: string; media_type: string }>;
    };

    const errors: Array<{ field: string; message: string }> = [];
    if (!body.warranty_record_id) errors.push({ field: 'warranty_record_id', message: '请先选择质保记录' });
    if (!body.media_keys || body.media_keys.length === 0) errors.push({ field: 'media_keys', message: '请上传损坏部位的照片或视频' });
    if (errors.length > 0) return validationError(errors);

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    // 校验质保记录必须属于本门店
    const record = await queryFirst<{
      id: string;
      store_id: string;
      customer_name_snapshot: string;
      customer_phone_snapshot: string;
      plate_no_snapshot: string;
      product_model_id: string;
      product_model_snapshot: string;
      product_name_snapshot: string;
      film_exchanged: number;
    }>(
      context.env.DB,
      `SELECT id, store_id, customer_name_snapshot, customer_phone_snapshot, plate_no_snapshot,
              product_model_id, product_model_snapshot, product_name_snapshot, film_exchanged
       FROM warranty_records WHERE id = ?`,
      body.warranty_record_id,
    );

    if (!record) return error('质保记录不存在', 404);
    if (record.store_id !== user.orgId) return error('该质保记录不属于本门店', 403);
    if (record.film_exchanged === 1) return error('该质保记录已完成过换膜，无法重复申请', 400);

    // 校验媒体文件归属于本门店（路径前缀）
    const mediaKeys = body.media_keys ?? [];
    if (mediaKeys.length > 5) return error('照片/视频最多上传 5 个', 400);
    const prefix = `film-exchange/${user.orgId}/`;
    if (mediaKeys.some((m) => !m.key.startsWith(prefix) || m.key.includes('..'))) {
      return error('部分文件不属于当前门店', 400);
    }
    // 校验文件真实存在
    const heads = await Promise.all(mediaKeys.map((m) => context.env.R2.head(m.key)));
    if (heads.some((h) => !h)) return error('部分文件上传失败，请重新上传', 400);

    // 判定车衣/窗膜：按产品型号 product_id 推断（窗膜产品一般为 window-film 系列）
    const model = await queryFirst<{ product_id: string }>(
      context.env.DB,
      `SELECT product_id FROM product_models WHERE id = ?`,
      record.product_model_id,
    );
    const filmType = model && /window|wf/i.test(model.product_id) ? 'window' : 'ppf';

    const province = await queryFirst<{ id: string }>(
      context.env.DB,
      `SELECT parent_id AS id FROM organizations WHERE id = ? AND type = 'STORE'`,
      user.orgId,
    );

    const requestId = generateId();
    const storeName = user.orgName || '';

    await execute(
      context.env.DB,
      `INSERT INTO film_exchange_requests (id, store_id, store_name_snapshot, province_org_id,
        warranty_record_id, customer_phone_snapshot, customer_name_snapshot, plate_no_snapshot,
        product_model_id, product_model_snapshot, product_name_snapshot,
        film_type, damage_part, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      requestId, user.orgId, storeName, province?.id || null,
      record.id, record.customer_phone_snapshot, record.customer_name_snapshot, record.plate_no_snapshot,
      record.product_model_id, record.product_model_snapshot, record.product_name_snapshot,
      filmType, body.damage_part || null, body.description || null,
    );

    // 关联照片/视频
    for (let i = 0; i < mediaKeys.length; i++) {
      await execute(
        context.env.DB,
        `INSERT INTO film_exchange_photos (id, request_id, file_key, media_type, sort_order, uploaded_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        generateId(), requestId, mediaKeys[i].key, mediaKeys[i].media_type || 'image', i + 1, user.userId,
      );
    }

    await writeOperationLog(context.env.DB, user.userId || null, 'create_film_exchange', 'film_exchange_requests', requestId,
      { warranty_record_id: record.id, customer: record.customer_name_snapshot, plate: record.plate_no_snapshot },
      getClientIP(context.request));

    return ok({ id: requestId }, '换膜申请提交成功，等待总部审核');
  } catch (err) {
    console.error('[store/film-exchange POST]', err);
    return error('提交换膜申请失败', 500);
  }
};
