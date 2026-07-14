// ============================================================
// 和膜 HAMOREY — FormField 表单字段包装
// 统一 label + children + error + hint 布局
// ============================================================

import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-content-secondary">
          {label}
          {required && <span className="ml-0.5 text-status-error">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-status-error">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-content-muted">{hint}</p>
      )}
    </div>
  );
}
