// ============================================================
// 和膜 HAMOREY — API 请求/响应类型定义
// ============================================================

import type {
  WarrantyInputType,
  StoreAuthLevel,
  LeadFollowStatus,
} from './enums';
import type {
  StorePublicProfile,
} from './models';

// === 通用响应包装 ===

export interface ApiResponse<T = unknown> {
  code: 'OK' | 'ERROR';
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  code: 'ERROR';
  message: string;
  data: {
    errors: Array<{
      field: string;
      message: string;
    }>;
  };
}

// === 质保查询 ===

export interface WarrantyQueryRequest {
  type: WarrantyInputType;
  value: string;
}

/** 质保查询返回的质保卡展示数据（与 mock API 响应结构一致） */
export interface WarrantyCardData {
  id: string;
  certificate_no: string;
  warranty_code: string;
  product_name: string;
  product_model: string;
  installation_date: string;
  warranty_expiry_date: string | null;
  warranty_years: number;
  status: string;
  store_name: string;
  store_city?: string;
  plate_no_snapshot?: string;
  customer_name_snapshot?: string;
}

export interface WarrantyQueryResult {
  vehicles: WarrantyVehicleGroup[];
  records: WarrantyCardData[];
  is_mock?: boolean;
  query_type?: string;
  query_value?: string;
}

export interface WarrantyVehicleGroup {
  vehicle_id: string;
  plate_no: string;
  vin: string | null;
  brand: string;
  model: string;
  model_year: string | null;
  record_count: number;
}

// === 门店查询 ===

export interface StoreQueryParams {
  province?: string;
  city?: string;
  keyword?: string;
  level?: StoreAuthLevel;
  page?: number;
  pageSize?: number;
}

export interface StoreQueryResult {
  stores: StorePublicProfile[];
  total: number;
  page: number;
  pageSize: number;
}

// === 合作申请 ===

export interface PartnerLeadCreateRequest {
  name: string;
  phone: string;
  province?: string;
  city?: string;
  company_name?: string;
  business_type?: string;
  store_count?: number;
  intended_type?: string;
  message?: string;
  privacy_agreed: boolean;
  source?: string;
}

export interface PartnerLeadCreateResult {
  lead_id: string;
  follow_status: LeadFollowStatus;
}

// === 合作咨询 ===

export interface ContactSubmitRequest {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  privacy_agreed: boolean;
}

export interface ContactSubmitResult {
  id: string;
}

// === 健康检查 ===

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    db: 'ok' | 'error';
  };
}
