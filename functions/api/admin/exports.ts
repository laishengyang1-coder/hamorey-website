// ============================================================
// POST /api/admin/exports — 数据导出
// 接收导出配置 → 查询数据 → 生成 CSV → 存 R2 → 返回临时下载 URL
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll } from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; R2: R2Bucket; }

/** 将二维数组转为 CSV 字符串 */
function toCSV(rows: Record<string, unknown>[], columns: string[], headers: string[]): string {
  const lines: string[] = [headers.join(',')];
  for (const row of rows) {
    const line = columns.map((c) => {
      const v = String(row[c] ?? '');
      return v.includes(',') || v.includes('"') || v.includes('\n')
        ? `"${v.replace(/"/g, '""')}"` : v;
    });
    lines.push(line.join(','));
  }
  return lines.join('\n');
}

/** 导出类型对应的字段映射 */
const EXPORT_TYPES: Record<string, { table: string; columns: string[]; headers: string[] }> = {
  warranty_records: {
    table: 'warranty_records',
    columns: ['customer_name_snapshot', 'customer_phone_snapshot', 'plate_no_snapshot', 'vin_snapshot', 'vehicle_brand_snapshot', 'vehicle_model_snapshot', 'product_name_snapshot', 'product_model_snapshot', 'installation_date', 'warranty_expiry_date', 'status', 'store_name_snapshot', 'created_at'],
    headers: ['车主姓名', '车主电话', '车牌号', 'VIN', '品牌', '车型', '产品名称', '产品型号', '施工日期', '质保到期', '状态', '施工门店', '创建时间'],
  },
  warranty_codes: {
    table: 'warranty_codes',
    columns: ['code', 'batch_no', 'imported_product_name', 'usage_limit', 'used_count', 'status', 'created_at'],
    headers: ['质保码', '批次号', '产品名称', '使用上限', '已使用', '状态', '创建时间'],
  },
  partner_leads: {
    table: 'partner_leads',
    columns: ['name', 'phone', 'email', 'province', 'city', 'company_name', 'business_type', 'follow_status', 'created_at'],
    headers: ['姓名', '电话', '邮箱', '省份', '城市', '公司名称', '业务类型', '跟进状态', '创建时间'],
  },
  points_ledger: {
    table: 'points_ledger',
    columns: ['organization_id', 'change_type', 'points_change', 'frozen_change', 'related_type', 'related_id', 'reason', 'created_at'],
    headers: ['组织ID', '变更类型', '积分变更', '冻结变更', '关联类型', '关联ID', '原因', '创建时间'],
  },
  organizations: {
    table: 'organizations',
    columns: ['code', 'type', 'name', 'province', 'city', 'contact_name', 'phone', 'address', 'social_credit_code', 'legal_person', 'status', 'created_at'],
    headers: ['编码', '类型', '名称', '省份', '城市', '联系人', '电话', '地址', '社会统一信用代码', '法人', '状态', '创建时间'],
  },
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { exportType?: string; filters?: Record<string, string> };
    const exportType = body.exportType || 'warranty_records';
    const config = EXPORT_TYPES[exportType];
    if (!config) return error(`不支持的导出类型: ${exportType}`, 400);

    // 构建查询条件
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (body.filters) {
      for (const [key, value] of Object.entries(body.filters)) {
        if (value) { conditions.push(`${key} = ?`); params.push(value); }
      }
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await queryAll<Record<string, unknown>>(
      context.env.DB,
      `SELECT ${config.columns.join(', ')} FROM ${config.table} ${where} ORDER BY created_at DESC LIMIT 10000`,
      ...params,
    );

    const csv = toCSV(rows, config.columns, config.headers);
    const encoder = new TextEncoder();
    const data = encoder.encode('\uFEFF' + csv); // BOM for Excel UTF-8

    // 存到 R2
    const fileKey = `exports/${exportType}_${Date.now()}.csv`;
    await context.env.R2.put(fileKey, data, {
      httpMetadata: { contentType: 'text/csv; charset=utf-8' },
    });

    return ok({ fileKey, total: rows.length, exportType });
  } catch (err) {
    console.error('[admin/exports POST]', err);
    return error('导出失败', 500);
  }
};
