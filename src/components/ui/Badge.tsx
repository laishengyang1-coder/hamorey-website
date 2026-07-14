// ============================================================
// 和膜 HAMOREY — Badge 原子组件
// ============================================================

import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-elevated text-content-secondary border-border-default',
  brand: 'bg-brand/15 text-content-brand border-brand/30',
  success: 'bg-status-success/15 text-status-success border-status-success/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  error: 'bg-status-error/15 text-status-error border-status-error/30',
  info: 'bg-status-info/15 text-status-info border-status-info/30',
};

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium border transition-fast',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
