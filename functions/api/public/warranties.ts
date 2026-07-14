// ============================================================
// GET /api/public/warranties — 公开质保记录查询
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
    const vin = url.searchParams.get('vin');
    const plate = url.searchParams.get('plate');
    const phone = url.searchParams.get('phone');
    const code = url.searchParams.get('code');

    if (!vin && !plate && !phone && !code) return error('请提供查询参数', 400);

    let field = '';
    let value = '';
    if (vin) { field = 'wr.vin_snapshot'; value = vin; }
    else if (plate) { field = 'wr.plate_no_snapshot'; value = plate; }
    else if (phone) { field = 'wr.customer_phone_snapshot'; value = phone; }
    else if (code) { field = 'wc.code'; value = code; }

    const records = await queryAll(
      context.env.DB,
      `SELECT wr.id, wr.certificate_no, wc.code AS warranty_code,
              wr.customer_name_snapshot, wr.plate_no_snapshot, wr.vin_snapshot,
              wr.vehicle_brand_snapshot, wr.vehicle_model_snapshot,
              wr.product_name_snapshot, wr.product_model_snapshot,
              wr.warranty_years_snapshot, wr.installation_date,
              wr.warranty_expiry_date, wr.store_name_snapshot, wr.status
       FROM warranty_records wr JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       WHERE ${field} = ? AND wr.status = 'active'
       ORDER BY wr.installation_date DESC`,
      value,
    );

    return ok({ records, total: records.length });
  } catch (err) {
    console.error('[public/warranties]', err);
    return error('查询失败', 500);
  }
};
