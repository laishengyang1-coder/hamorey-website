// ============================================================
// 和膜 HAMOREY — 数据模型 TypeScript 接口
// 与 schema.sql 表结构一一对应
// ============================================================

import type {
  OrganizationType,
  UserRole,
  AccountStatus,
  OrgStatus,
  ProductCategory,
  ProductStatus,
  ImportBatchStatus,
  WarrantyCodeStatus,
  CodeAllocationAction,
  WarrantyRecordStatus,
  AuditAction,
  PointsChangeType,
  PointsRelatedType,
  StockStatus,
  RedemptionStatus,
  ClaimPartCategory,
  StoreAuthLevel,
  LeadFollowStatus,
  ContentStatus,
  SettingValueType,
} from './enums';

export interface Organization {
  id: string;
  code: string;
  type: OrganizationType;
  parent_id: string | null;
  name: string;
  province: string | null;
  city: string | null;
  address: string | null;
  contact_name: string | null;
  phone: string | null;
  status: OrgStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  status: AccountStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
}

export interface Product {
  id: string;
  category: ProductCategory;
  name_cn: string;
  name_en: string | null;
  default_warranty_years: number;
  default_usage_limit: number;
  website_visible: 0 | 1;
  warranty_enabled: 0 | 1;
  status: ProductStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductModel {
  id: string;
  product_id: string;
  model_code: string;
  display_name: string;
  warranty_years: number | null;
  usage_limit: number | null;
  status: ProductStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ImportBatch {
  id: string;
  file_name: string;
  batch_name: string | null;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  status: ImportBatchStatus;
  error_file_key: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WarrantyCode {
  id: string;
  code: string;
  product_model_id: string;
  imported_product_name: string | null;
  batch_no: string;
  import_batch_id: string | null;
  owner_org_id: string | null;
  usage_limit: number;
  used_count: number;
  status: WarrantyCodeStatus;
  created_at: string;
}

export interface CodeAllocation {
  id: string;
  warranty_code_id: string;
  from_org_id: string | null;
  to_org_id: string | null;
  action: CodeAllocationAction;
  operator_user_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate_no: string;
  vin: string | null;
  brand: string;
  model: string;
  model_year: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarrantyRecord {
  id: string;
  certificate_no: string | null;
  warranty_code_id: string;
  vehicle_id: string;
  customer_id: string;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  plate_no_snapshot: string;
  vin_snapshot: string | null;
  vehicle_brand_snapshot: string;
  vehicle_model_snapshot: string;
  store_id: string;
  store_name_snapshot: string;
  province_org_id: string | null;
  product_model_id: string;
  product_name_snapshot: string;
  product_model_snapshot: string;
  warranty_years_snapshot: number;
  installation_date: string;
  warranty_expiry_date: string | null;
  status: WarrantyRecordStatus;
  current_reject_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  store_points_awarded: number;
  province_points_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface WarrantyPhoto {
  id: string;
  warranty_record_id: string;
  file_key: string;
  thumbnail_key: string | null;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface WarrantyAuditLog {
  id: string;
  warranty_record_id: string;
  action: AuditAction;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  operator_user_id: string | null;
  snapshot_json: string | null;
  created_at: string;
}

export interface CertificateFile {
  id: string;
  warranty_record_id: string;
  file_key: string;
  file_url: string | null;
  version: number;
  generated_by: string | null;
  created_at: string;
}

export interface ClaimPart {
  id: string;
  name: string;
  category: ClaimPartCategory;
  sort_order: number;
  status: ProductStatus;
}

export interface ClaimPrice {
  id: string;
  product_model_id: string;
  claim_part_id: string;
  price_cents: number;
  effective_from: string;
  effective_to: string | null;
  status: ProductStatus;
  updated_by: string | null;
  updated_at: string;
}

export interface PointsRule {
  id: string;
  product_model_id: string;
  points: number;
  effective_from: string;
  effective_to: string | null;
  status: ProductStatus;
  updated_by: string | null;
  updated_at: string;
}

export interface RebateRule {
  id: string;
  product_model_id: string | null;
  rebate_ratio: number;
  is_global: 0 | 1;
  effective_from: string;
  effective_to: string | null;
  status: ProductStatus;
  updated_by: string | null;
  updated_at: string;
}

export interface PointsLedger {
  id: string;
  organization_id: string;
  change_type: PointsChangeType;
  points_change: number;
  frozen_change: number;
  related_type: PointsRelatedType | null;
  related_id: string | null;
  reason: string | null;
  operator_user_id: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  category: string | null;
  name: string;
  cover_file_key: string | null;
  points_required: number;
  stock_quantity: number | null;
  stock_status: StockStatus;
  status: ProductStatus;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  organization_id: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string | null;
  detail_address: string;
  is_default: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  organization_id: string;
  address_id: string | null;
  total_points: number;
  status: RedemptionStatus;
  review_note: string | null;
  tracking_no: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RedemptionItem {
  id: string;
  redemption_id: string;
  reward_id: string;
  quantity: number;
  points_per_item: number;
  reward_name_snapshot: string;
  created_at: string;
}

export interface StorePublicProfile {
  id: string;
  organization_id: string;
  public_name: string;
  auth_level: StoreAuthLevel;
  province: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  business_hours: string | null;
  service_products: string | null;
  image_file_key: string | null;
  is_public: 0 | 1;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  province: string | null;
  city: string | null;
  company_name: string | null;
  business_type: string | null;
  store_count: number | null;
  intended_type: string | null;
  message: string | null;
  privacy_agreed: 0 | 1;
  follow_status: LeadFollowStatus;
  assigned_to: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentEntry {
  id: string;
  page: string;
  section: string;
  title: string | null;
  body: string | null;
  image_file_key: string | null;
  sort_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface OperationLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail_json: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  value_type: SettingValueType;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}
