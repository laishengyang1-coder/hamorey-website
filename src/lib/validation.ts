// ============================================================
// 和膜 HAMOREY — Zod 校验 Schema
// 前后端共享，用于表单校验和 API 输入验证
// ============================================================

import { z } from 'zod';

// === 手机号校验（中国大陆11位） ===
export const phoneSchema = z
  .string()
  .min(1, '请输入手机号')
  .regex(/^1[3-9]\d{9}$/, '请输入正确的11位手机号');

// === 车牌号校验（支持常规车牌和新能源车牌） ===
export const plateNoSchema = z
  .string()
  .min(1, '请输入车牌号')
  .regex(
    /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{5,6}$/,
    '请输入正确的车牌号（如：京A12345）',
  );

// === VIN 校验（17位字母数字，不含I/O/Q） ===
export const vinSchema = z
  .string()
  .min(1, '请输入车架号')
  .length(17, 'VIN应为17位')
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN格式不正确（17位字母数字，不含I/O/Q）');

// === 质保码校验 ===
export const warrantyCodeSchema = z
  .string()
  .min(1, '请输入质保码')
  .min(6, '质保码至少6位')
  .max(32, '质保码最多32位');

// === 质保查询请求 ===
export const warrantyQuerySchema = z.object({
  type: z.enum(['phone', 'plate', 'vin', 'code']),
  value: z.string().min(1, '请输入查询内容').max(32, '输入内容过长'),
});

// === 合作申请表单 ===
export const partnerLeadSchema = z.object({
  name: z
    .string()
    .min(1, '请输入姓名')
    .min(2, '姓名至少2个字符')
    .max(20, '姓名最多20个字符'),
  phone: phoneSchema,
  province: z.string().optional(),
  city: z.string().optional(),
  company_name: z
    .string()
    .max(50, '公司名称最多50个字符')
    .optional()
    .or(z.literal('')),
  business_type: z.string().optional(),
  store_count: z
    .number()
    .int('门店数量需为整数')
    .min(0, '门店数量不能为负数')
    .max(9999, '门店数量过大')
    .optional()
    .or(z.nan()),
  intended_type: z.string().optional(),
  message: z
    .string()
    .max(500, '留言最多500个字符')
    .optional()
    .or(z.literal('')),
  privacy_agreed: z
    .boolean()
    .refine((v) => v === true, '请阅读并同意隐私政策'),
  source: z.string().optional(),
});

// === 合作咨询表单 ===
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, '请输入姓名')
    .min(2, '姓名至少2个字符')
    .max(20, '姓名最多20个字符'),
  phone: phoneSchema,
  email: z
    .string()
    .email('请输入正确的邮箱地址')
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .min(1, '请输入咨询主题')
    .max(50, '主题最多50个字符'),
  message: z
    .string()
    .min(1, '请输入咨询内容')
    .max(1000, '内容最多1000个字符'),
  privacy_agreed: z
    .boolean()
    .refine((v) => v === true, '请阅读并同意隐私政策'),
});

// === 质保码导入校验（单行） ===
export const warrantyCodeImportRowSchema = z.object({
  code: z
    .string()
    .min(1, '质保码不能为空')
    .max(32, '质保码最多32位'),
  batch_no: z
    .string()
    .min(1, '批次号不能为空')
    .max(32, '批次号最多32位'),
  model_code: z
    .string()
    .min(1, '产品型号不能为空')
    .max(32, '产品型号最多32位'),
  product_name: z
    .string()
    .max(100, '产品名称最多100个字符')
    .optional()
    .or(z.literal('')),
});

// === 质保登记表单 ===
export const warrantyRegistrationSchema = z.object({
  warranty_code: warrantyCodeSchema,
  customer_name: z
    .string()
    .min(1, '请输入车主姓名')
    .max(20, '姓名最多20个字符'),
  customer_phone: phoneSchema,
  plate_no: plateNoSchema,
  vin: vinSchema.optional().or(z.literal('')),
  vehicle_brand: z
    .string()
    .min(1, '请输入车辆品牌')
    .max(30, '品牌最多30个字符'),
  vehicle_model: z
    .string()
    .min(1, '请输入车型')
    .max(30, '车型最多30个字符'),
  vehicle_year: z
    .string()
    .regex(/^\d{4}$/, '年份格式不正确')
    .optional()
    .or(z.literal('')),
  installation_date: z
    .string()
    .min(1, '请选择施工日期')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确'),
});

// === 类型推断 ===
export type PartnerLeadFormData = z.infer<typeof partnerLeadSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type WarrantyQueryFormData = z.infer<typeof warrantyQuerySchema>;
export type WarrantyCodeImportRow = z.infer<typeof warrantyCodeImportRowSchema>;
export type WarrantyRegistrationFormData = z.infer<typeof warrantyRegistrationSchema>;
