// ============================================================
// 和膜 HAMOREY — 格式化工具函数
// 日期/手机号脱敏/金额/文本处理
// ============================================================

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 */
export function formatDateTime(date: string | Date | null): string {
  if (!date) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--';
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * 手机号脱敏：隐藏中间4位
 * 13800138000 → 138****8000
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * 姓名脱敏：保留姓，名用*代替
 * 张三 → 张* ; 欧阳娜娜 → 欧***
 */
export function maskName(name: string): string {
  if (!name) return name;
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(name.length - 1)}`;
}

/**
 * 金额：分 → 元
 * 129900 → 1299.00
 */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * 金额：分 → 元（带 ¥ 符号）
 */
export function formatPriceWithSymbol(cents: number): string {
  return `¥${formatPrice(cents)}`;
}

/**
 * 截断文本并添加省略号
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * 质保状态到期判断
 */
export function isWarrantyExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry < now;
}

/**
 * 计算质保剩余天数
 */
export function warrantyDaysRemaining(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 质保状态文案
 */
export function warrantyStatusText(
  status: string,
  expiryDate: string | null,
): { text: string; color: string } {
  if (status === 'active' && isWarrantyExpired(expiryDate)) {
    return { text: '已到期', color: 'text-status-error' };
  }
  const labels: Record<string, { text: string; color: string }> = {
    draft: { text: '草稿', color: 'text-content-muted' },
    pending: { text: '待审核', color: 'text-status-warning' },
    rejected: { text: '已驳回', color: 'text-status-error' },
    active: { text: '已生效', color: 'text-status-success' },
    expired: { text: '已到期', color: 'text-status-error' },
    voided: { text: '已作废', color: 'text-content-muted' },
  };
  return labels[status] ?? { text: status, color: 'text-content-secondary' };
}
