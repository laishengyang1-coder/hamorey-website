// ============================================================
// 和膜 HAMOREY 共享枚举定义
// 前后端共享，与 schema.sql CHECK 约束保持一致
// ============================================================

/** 组织类型 */
export type OrganizationType = 'HQ' | 'PROVINCE' | 'STORE';

/** 用户角色 */
export type UserRole = 'HQ_ADMIN' | 'PROVINCE' | 'STORE';

/** 账号状态 */
export type AccountStatus = 'active' | 'locked' | 'disabled';

/** 组织状态 */
export type OrgStatus = 'active' | 'suspended' | 'disabled';

/** 产品分类 */
export type ProductCategory =
  | 'window_film'
  | 'ppf'
  | 'color_ppf'
  | 'sunroof_film'
  | 'architectural_film';

/** 产品/型号状态 */
export type ProductStatus = 'active' | 'inactive';

/** 导入批次状态 */
export type ImportBatchStatus = 'checking' | 'failed' | 'imported';

/** 质保码状态 */
export type WarrantyCodeStatus =
  | 'unallocated'
  | 'in_stock'
  | 'partial_used'
  | 'exhausted'
  | 'frozen'
  | 'voided';

/** 质保码流转动作 */
export type CodeAllocationAction = 'allocate' | 'revoke' | 'adjust';

/** 质保记录状态 */
export type WarrantyRecordStatus =
  | 'draft'
  | 'pending'
  | 'rejected'
  | 'active'
  | 'expired'
  | 'voided';

/** 审核动作 */
export type AuditAction = 'submit' | 'reject' | 'resubmit' | 'approve' | 'void';

/** 积分变动类型 */
export type PointsChangeType = 'award' | 'deduct' | 'freeze' | 'release' | 'adjust' | 'revoke';

/** 积分关联类型 */
export type PointsRelatedType = 'warranty' | 'redemption' | 'manual';

/** 商品库存状态 */
export type StockStatus = 'available' | 'out_of_stock' | 'coming_soon';

/** 兑换状态 */
export type RedemptionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shipped'
  | 'completed';

/** 报价部位分类 */
export type ClaimPartCategory = 'window_film' | 'ppf' | 'color_ppf' | 'sunroof_film';

/** 门店授权等级 */
export type StoreAuthLevel = 'HEBC' | 'HSS' | 'Service_Point';

/** 合作线索跟进状态 */
export type LeadFollowStatus = 'new' | 'contacted' | 'qualified' | 'closed';

/** 内容发布状态 */
export type ContentStatus = 'draft' | 'published' | 'archived';

/** 系统设置值类型 */
export type SettingValueType = 'string' | 'integer' | 'boolean' | 'json';

/** 质保查询输入识别类型 */
export type WarrantyInputType = 'phone' | 'plate' | 'vin' | 'code';

// ============================================================
// 枚举值映射（用于 UI 显示中文标签）
// ============================================================

export const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  HQ: '总部',
  PROVINCE: '省代',
  STORE: '门店',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  HQ_ADMIN: '总部管理员',
  PROVINCE: '省代',
  STORE: '门店',
};

export const ORG_STATUS_LABELS: Record<OrgStatus, string> = {
  active: '正常',
  suspended: '暂停',
  disabled: '停用',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: '正常',
  locked: '锁定',
  disabled: '停用',
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  window_film: '窗膜',
  ppf: '隐形车衣',
  color_ppf: 'TPU改色车衣',
  sunroof_film: '天窗冰甲',
  architectural_film: '建筑家居膜',
};

export const PRODUCT_CATEGORY_EN: Record<ProductCategory, string> = {
  window_film: 'Window Film',
  ppf: 'Paint Protection Film',
  color_ppf: 'Color PPF',
  sunroof_film: 'Sunroof Film',
  architectural_film: 'Architectural Film',
};

export const WARRANTY_CODE_STATUS_LABELS: Record<WarrantyCodeStatus, string> = {
  unallocated: '未划拨',
  in_stock: '库存',
  partial_used: '部分使用',
  exhausted: '已用尽',
  frozen: '冻结',
  voided: '作废',
};

export const WARRANTY_RECORD_STATUS_LABELS: Record<WarrantyRecordStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  rejected: '已驳回',
  active: '已生效',
  expired: '已到期',
  voided: '已作废',
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  submit: '提交审核',
  reject: '驳回',
  resubmit: '重新提交',
  approve: '审核通过',
  void: '作废',
};

export const POINTS_CHANGE_TYPE_LABELS: Record<PointsChangeType, string> = {
  award: '发放',
  deduct: '扣除',
  freeze: '冻结',
  release: '释放',
  adjust: '调整',
  revoke: '撤销',
};

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  shipped: '已发货',
  completed: '已完成',
};

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  available: '可兑换',
  out_of_stock: '缺货',
  coming_soon: '即将上线',
};

export const STORE_AUTH_LEVEL_LABELS: Record<StoreAuthLevel, string> = {
  HEBC: '品牌灯塔店',
  HSS: '标准服务中心',
  Service_Point: '区域服务点',
};

export const LEAD_FOLLOW_STATUS_LABELS: Record<LeadFollowStatus, string> = {
  new: '新线索',
  contacted: '已联系',
  qualified: '已合格',
  closed: '已关闭',
};

export const WARRANTY_INPUT_TYPE_LABELS: Record<WarrantyInputType, string> = {
  phone: '手机号',
  plate: '车牌号',
  vin: '车架号',
  code: '质保码',
};
