// ============================================================
// 和膜 HAMOREY — Select 自定义下拉组件
// 使用自定义触发按钮 + 浮层列表替代原生 <select>，彻底消除各平台/内嵌浏览器双箭头与字高偏移
// ============================================================

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  /** 是否禁止重新选回空值（表单必填项可开启，筛选器默认允许重置） */
  disablePlaceholder?: boolean;
  wrapperClassName?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      placeholder,
      disablePlaceholder = false,
      wrapperClassName,
      value = '',
      onChange,
      disabled,
      id,
      name,
    },
    _ref,
  ) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const selectId = id || name;
    const strValue = String(value ?? '');
    const selectedOption = options.find((o) => o.value === strValue);

    useEffect(() => {
      if (!open) return;
      const onPointerDown = (ev: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
          setOpen(false);
        }
      };
      const onKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('mousedown', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [open]);

    const handlePick = (nextValue: string) => {
      setOpen(false);
      if (onChange) {
        const syntheticEvent = {
          target: { value: nextValue, name: name || '' },
          currentTarget: { value: nextValue, name: name || '' },
        } as unknown as ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div ref={rootRef} className={cn('relative flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-content-secondary">
            {label}
          </label>
        )}
        {name && <input type="hidden" name={name} value={strValue} />}

        <button
          type="button"
          id={selectId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          className={cn(
            'h-11 w-full rounded bg-elevated px-4 text-sm flex items-center justify-between gap-2 text-left',
            'border border-border-default transition-fast',
            'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            selectedOption ? 'text-content-primary' : 'text-content-secondary',
            error && 'border-status-error',
            className,
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder || '请选择'}
          </span>
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className={cn(
              'shrink-0 text-content-muted transition-transform duration-150',
              open && 'rotate-180',
            )}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 z-40 max-h-64 overflow-y-auto rounded-md bg-elevated border border-border-subtle shadow-lg py-1"
          >
            {placeholder && !disablePlaceholder && (
              <button
                type="button"
                role="option"
                aria-selected={strValue === ''}
                onClick={() => handlePick('')}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-graphite',
                  strValue === '' ? 'font-semibold text-content-brand bg-brand/6' : 'text-content-secondary',
                )}
              >
                {placeholder}
              </button>
            )}
            {options.map((option) => {
              const active = option.value === strValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handlePick(option.value)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-graphite flex items-center justify-between gap-2',
                    active ? 'font-semibold text-content-brand bg-brand/6' : 'text-content-primary',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <span className="text-xs text-content-brand">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {error && <span className="text-xs text-status-error">{error}</span>}
      </div>
    );
  },
);

Select.displayName = 'Select';
