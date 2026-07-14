// ============================================================
// 和膜 HAMOREY — 输入智能识别
// 自动识别手机号 / 车牌号 / VIN / 质保码
// ============================================================

import type { WarrantyInputType } from '../types/enums';

export interface DetectResult {
  type: WarrantyInputType;
  value: string;
  label: string;
}

// === 正则规则 ===

/** 中国大陆手机号：11位数字，1开头 */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/**
 * 车牌号：
 * - 常规：省+字母+5位（字母数字）
 * - 新能源：省+字母+6位（字母数字）
 */
const PLATE_REGEX =
  /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{5,6}$/;

/** VIN：17位字母数字，不含 I/O/Q */
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/** 质保码：6-32位字母数字（兜底） */
const CODE_REGEX = /^[A-Za-z0-9\-_]{6,32}$/;

// === 标签映射 ===
const TYPE_LABELS: Record<WarrantyInputType, string> = {
  phone: '手机号',
  plate: '车牌号',
  vin: '车架号(VIN)',
  code: '质保码',
};

/**
 * 智能识别输入类型
 *
 * 规则：
 * 1. 去除首尾空格
 * 2. 英文转大写
 * 3. 依次匹配：手机号 → 车牌 → VIN → 质保码（兜底）
 *
 * @param rawInput 用户原始输入
 * @returns 识别结果，包含类型、规范化后的值和中文标签
 */
export function detectInput(rawInput: string): DetectResult {
  // 去除首尾空格 + 英文转大写
  const value = rawInput.trim().toUpperCase();

  // 优先匹配手机号（纯数字11位）
  if (PHONE_REGEX.test(value)) {
    return { type: 'phone', value, label: TYPE_LABELS.phone };
  }

  // 匹配车牌号
  if (PLATE_REGEX.test(value)) {
    return { type: 'plate', value, label: TYPE_LABELS.plate };
  }

  // 匹配 VIN（恰好17位）
  if (VIN_REGEX.test(value)) {
    return { type: 'vin', value, label: TYPE_LABELS.vin };
  }

  // 兜底：视为质保码
  // 如果长度在6-32之间且为字母数字组合，则识别为质保码
  if (CODE_REGEX.test(value)) {
    return { type: 'code', value, label: TYPE_LABELS.code };
  }

  // 无法识别，默认当作质保码处理（后端会返回无结果）
  return { type: 'code', value, label: TYPE_LABELS.code };
}

/**
 * 获取输入类型的提示文案
 */
export function getInputPlaceholder(): string {
  return '请输入手机号、车牌号、VIN 或质保码';
}

/**
 * 获取输入类型的描述
 */
export function getInputTypeDescription(type: WarrantyInputType): string {
  const descriptions: Record<WarrantyInputType, string> = {
    phone: '11位手机号，如 13800138000',
    plate: '车牌号，如 京A12345',
    vin: '17位车架号(VIN)',
    code: '和膜质保码',
  };
  return descriptions[type];
}
