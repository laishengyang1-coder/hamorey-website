// ============================================================
// StatusBadge — 状态标签（颜色语义化）
// ============================================================

import { cn } from '../../lib/cn';

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: StatusVariant;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  // 组织状态
  active: { label: '启用', variant: 'success' },
  suspended: { label: '暂停', variant: 'warning' },
  disabled: { label: '停用', variant: 'danger' },
  // 用户状态
  locked: { label: '锁定', variant: 'warning' },
  // 质保码状态
  unallocated: { label: '未分配', variant: 'neutral' },
  in_stock: { label: '库存中', variant: 'info' },
  partial_used: { label: '部分使用', variant: 'warning' },
  exhausted: { label: '已用完', variant: 'default' },
  frozen: { label: '已冻结', variant: 'danger' },
  voided: { label: '已作废', variant: 'danger' },
  // 质保记录状态
  draft: { label: '草稿', variant: 'neutral' },
  pending: { label: '待审核', variant: 'warning' },
  rejected: { label: '已驳回', variant: 'danger' },
  expired: { label: '已过期', variant: 'default' },
  // 兑换状态
  approved: { label: '已通过', variant: 'success' },
  shipped: { label: '已发货', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  // 导入批次
  checking: { label: '预检中', variant: 'info' },
  failed: { label: '失败', variant: 'danger' },
  imported: { label: '已导入', variant: 'success' },
  // 产品
  inactive: { label: '已停用', variant: 'neutral' },
  // 线索
  new: { label: '新线索', variant: 'info' },
  contacted: { label: '已联系', variant: 'warning' },
  qualified: { label: '已认证', variant: 'success' },
  closed: { label: '已关闭', variant: 'neutral' },
  // 内容
  draft_ct: { label: '草稿', variant: 'neutral' },
  published: { label: '已发布', variant: 'success' },
  archived: { label: '已归档', variant: 'default' },
  // 库存
  available: { label: '有货', variant: 'success' },
  out_of_stock: { label: '缺货', variant: 'danger' },
  coming_soon: { label: '即将上架', variant: 'info' },
};

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  default: 'bg-[#F1ECE8] text-[#6B605A]',
  success: 'bg-[#EAF3EC] text-[#2F7A47]',
  warning: 'bg-[#FBF3E2] text-[#9A7212]',
  danger: 'bg-[#FBEAEA] text-[#B23A3A]',
  info: 'bg-[#EAF0F6] text-[#3C6893]',
  neutral: 'bg-[#F1ECE8] text-[#6B605A]',
};

export function StatusBadge({ status, label, variant, className }: StatusBadgeProps) {
  const mapping = STATUS_MAP[status] ?? { label: label ?? status, variant: variant ?? 'default' };
  const displayLabel = label ?? mapping.label;
  const displayVariant = variant ?? mapping.variant;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[displayVariant],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {displayLabel}
    </span>
  );
}
