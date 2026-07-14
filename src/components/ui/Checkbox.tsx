// ============================================================
// 和膜 HAMOREY — Checkbox 原子组件
// ============================================================

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-2.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'mt-0.5 h-4 w-4 rounded-sm border-border-default bg-elevated',
              'text-brand focus:ring-brand focus:ring-offset-0 focus:ring-1',
              'transition-fast cursor-pointer',
              className,
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm text-content-secondary cursor-pointer leading-relaxed select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="text-xs text-status-error ml-6">{error}</p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
