// ============================================================
// GET /api/public/warranties — 公开质保记录查询
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, sanitizeLegacyValue, sanitizeLegacyProductName } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

function detectInputType(value: string): 'vin' | 'plate' | 'phone' | 'code' {
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(value)) return 'vin';
  if (/^[\u4e00-\u9fa5][A-Z0-9]{5,7}$/i.test(value)) return 'plate';
  if (/^1[3-9]\d{9}$/.test(value)) return 'phone';
  return 'code';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const q = url.searchParams.get('q')?.trim();
    const recordId = url.searchParams.get('id')?.trim();
    const vin = url.searchParams.get('vin');
    const plate = url.searchParams.get('plate');
    const phone = url.searchParams.get('phone');
    const code = url.searchParams.get('code');

    if (!q && !recordId && !vin && !plate && !phone && !code) return error('请提供查询参数', 400);

    let field = '';
    let value = '';
    if (recordId) { field = 'wr.id'; value = recordId; }
    else if (q) {
      const type = detectInputType(q);
      field = type === 'vin' ? 'wr.vin_snapshot'
        : type === 'plate' ? 'wr.plate_no_snapshot'
          : type === 'phone' ? 'wr.customer_phone_snapshot'
            : 'wc.code';
      value = q;
    } else if (vin) { field = 'wr.vin_snapshot'; value = vin.trim(); }
    else if (plate) { field = 'wr.plate_no_snapshot'; value = plate.trim(); }
    else if (phone) { field = 'wr.customer_phone_snapshot'; value = phone.trim(); }
    else if (code) { field = 'wc.code'; value = code.trim(); }

    const comparison = field === 'wr.customer_phone_snapshot' || field === 'wr.id'
      ? `${field} = ?`
      : `${field} = ? COLLATE NOCASE`;

    const records = await queryAll(
      context.env.DB,
      `SELECT wr.id, wr.certificate_no, wc.code AS warranty_code,
              wr.customer_name_snapshot, wr.plate_no_snapshot, wr.vin_snapshot,
              wr.vehicle_brand_snapshot, wr.vehicle_model_snapshot,
              wr.product_name_snapshot, wr.product_model_snapshot,
              pm.model_code, pm.warranty_price_cents,
              wr.warranty_years_snapshot, wr.installation_date,
              wr.warranty_expiry_date, wr.store_name_snapshot, wr.status,
              wr.product_model_id
       FROM warranty_records wr
       JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       LEFT JOIN product_models pm ON wr.product_model_id = pm.id
       WHERE ${comparison} AND wr.status = 'active'
       ORDER BY wr.installation_date DESC`,
      value,
    );

    // 批量查询部位价值参考表（与长图证书数据一致）
    const modelIds = [...new Set(records.map((r: any) => r.product_model_id).filter(Boolean))] as string[];
    const partPriceMap = new Map<string, Array<{ name: string; priceCents: number }>>();
    if (modelIds.length > 0) {
      const placeholders = modelIds.map(() => '?').join(',');
      const partRows = await queryAll(
        context.env.DB,
        `SELECT cli.product_model_id, cp.name AS name, cli.price_cents
           FROM claim_prices cli
           JOIN claim_parts cp ON cp.id = cli.claim_part_id
          WHERE cli.product_model_id IN (${placeholders}) AND cli.status = 'active'
          ORDER BY cp.category, cp.sort_order`,
        ...modelIds,
      );
      for (const row of partRows as any[]) {
        if (!partPriceMap.has(row.product_model_id)) partPriceMap.set(row.product_model_id, []);
        partPriceMap.get(row.product_model_id)!.push({ name: row.name, priceCents: row.price_cents });
      }
    }

    const result = (records as any[]).map((r) => ({
      ...r,
      customer_name_snapshot: sanitizeLegacyValue(r.customer_name_snapshot),
      plate_no_snapshot: sanitizeLegacyValue(r.plate_no_snapshot),
      vehicle_brand_snapshot: sanitizeLegacyValue(r.vehicle_brand_snapshot),
      vehicle_model_snapshot: sanitizeLegacyValue(r.vehicle_model_snapshot),
      product_name_snapshot: sanitizeLegacyProductName(r.product_name_snapshot),
      product_model_snapshot: sanitizeLegacyProductName(r.product_model_snapshot),
      part_prices: r.product_model_id ? partPriceMap.get(r.product_model_id) || [] : [],
    }));

    return ok({ records: result, total: result.length });
  } catch (err) {
    console.error('[public/warranties]', err);
    return error('查询失败', 500);
  }
};
