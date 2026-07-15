// ============================================================
// GET/POST /api/warranty-search — 公开质保查询（真实D1查询）
// 第二阶段：从 mock 数据改为真实 D1 + R2 查询
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, queryFirst } from './_lib';
import { ok, error } from './_middleware';

interface Env {
  DB: D1Database;
}

/** 识别输入类型 */
function detectInputType(value: string): string {
  const v = value.trim();
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(v)) return 'vin';
  if (/^[\u4e00-\u9fa5][A-Z0-9]{5,7}$/i.test(v)) return 'plate';
  if (/^1[3-9]\d{9}$/.test(v)) return 'phone';
  return 'code';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const q = url.searchParams.get('q');
    if (!q) return error('请输入查询内容', 400);
    return await doSearch(context.env.DB, q.trim());
  } catch (err) {
    console.error('[warranty-search GET]', err);
    return error('查询失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { type?: string; value?: string };
    if (!body.value) return error('请输入查询内容', 400);
    return await doSearch(context.env.DB, body.value.trim());
  } catch (err) {
    console.error('[warranty-search POST]', err);
    return error('查询失败', 500);
  }
};

async function doSearch(db: D1Database, value: string): Promise<Response> {
  const type = detectInputType(value);

  interface RecordRow {
    id: string; certificate_no: string | null; warranty_code: string;
    customer_name_snapshot: string; plate_no_snapshot: string;
    vin_snapshot: string | null; vehicle_brand_snapshot: string;
    vehicle_model_snapshot: string; product_name_snapshot: string;
    product_model_snapshot: string; warranty_years_snapshot: number;
    warranty_price_cents: number | null;
    installation_date: string; warranty_expiry_date: string | null;
    store_name_snapshot: string; status: string;
  }

  const selectSql = `SELECT wr.*, wc.code AS warranty_code, pm.warranty_price_cents
       FROM warranty_records wr
       JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       LEFT JOIN product_models pm ON wr.product_model_id = pm.id`;

  let records: RecordRow[] = [];
  if (type === 'vin') {
    records = await queryAll<RecordRow>(db,
      `${selectSql}
       WHERE wr.vin_snapshot = ? AND wr.status = 'active'
       ORDER BY wr.installation_date DESC`, value);
  } else if (type === 'plate') {
    records = await queryAll<RecordRow>(db,
      `${selectSql}
       WHERE wr.plate_no_snapshot = ? AND wr.status = 'active'
       ORDER BY wr.installation_date DESC`, value);
  } else if (type === 'phone') {
    records = await queryAll<RecordRow>(db,
      `${selectSql}
       WHERE wr.customer_phone_snapshot = ? AND wr.status = 'active'
       ORDER BY wr.installation_date DESC`, value);
  } else {
    records = await queryAll<RecordRow>(db,
      `${selectSql}
       WHERE wc.code = ? COLLATE NOCASE AND wr.status = 'active'
       ORDER BY wr.installation_date DESC`, value);
  }

  if (records.length === 0) {
    return ok({ vehicles: [], records: [], query_type: type, query_value: value, is_mock: false });
  }

  // 聚合车辆信息
  const vehicleMap = new Map<string, { plate_no: string; vin: string | null; brand: string; model: string; record_count: number }>();
  for (const r of records) {
    const key = `${r.plate_no_snapshot}_${r.vin_snapshot || ''}`;
    if (!vehicleMap.has(key)) {
      vehicleMap.set(key, {
        plate_no: r.plate_no_snapshot,
        vin: r.vin_snapshot,
        brand: r.vehicle_brand_snapshot,
        model: r.vehicle_model_snapshot,
        record_count: 0,
      });
    }
    vehicleMap.get(key)!.record_count++;
  }

  const vehicles = [...vehicleMap.values()];
  const cards = records.map((r) => ({
    id: r.id,
    certificate_no: r.certificate_no,
    warranty_code: r.warranty_code,
    product_name: r.product_name_snapshot,
    product_model: r.product_model_snapshot,
    warranty_price_cents: r.warranty_price_cents,
    installation_date: r.installation_date,
    warranty_expiry_date: r.warranty_expiry_date,
    warranty_years: r.warranty_years_snapshot,
    status: r.status,
    store_name: r.store_name_snapshot,
  }));

  return ok({ vehicles, records: cards, query_type: type, query_value: value, is_mock: false });
}
