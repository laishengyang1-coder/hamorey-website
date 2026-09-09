// ============================================================
// GET /api/store/warranty-lookup?phone=xxx — 按手机号查询本门店质保记录
// 供「换膜无忧」申请时选择质保记录，自动带出膜型号/车牌/客户名
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const url = new URL(context.request.url);
    const phone = (url.searchParams.get('phone') || '').trim();
    if (!phone) return error('请输入客户手机号', 400);
    if (!/^\d{4,}$/.test(phone)) return error('手机号格式不正确', 400);

    // 仅查本门店、按手机号精确匹配，按提交时间倒序
    const items = await queryAll(
      context.env.DB,
      `SELECT wr.id, wr.customer_name_snapshot, wr.customer_phone_snapshot,
              wr.plate_no_snapshot, wr.vin_snapshot,
              wr.vehicle_brand_snapshot, wr.vehicle_model_snapshot,
              wr.product_model_id, wr.product_model_snapshot, wr.product_name_snapshot,
              wr.installation_date, wr.status, wr.film_exchanged,
              wc.code AS warranty_code,
              pm.display_name AS model_name
       FROM warranty_records wr
       JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       LEFT JOIN product_models pm ON wr.product_model_id = pm.id
       WHERE wr.store_id = ? AND wr.customer_phone_snapshot = ?
         AND wr.status IN ('active', 'expired')
       ORDER BY wr.created_at DESC
       LIMIT 20`,
      user.orgId, phone,
    );

    return ok({ items, total: items.length });
  } catch (err) {
    console.error('[store/warranty-lookup GET]', err);
    return error('查询质保记录失败', 500);
  }
};
