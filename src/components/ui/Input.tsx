// ============================================================
// 和膜 HAMOREY — Input 原子组件
// ============================================================

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, wrapperClassName, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 px-4 rounded bg-elevated text-content-primary placeholder:text-content-muted',
            'border border-border-default transition-fast',
            'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-status-error focus:border-status-error focus:ring-status-error',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-status-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-content-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
