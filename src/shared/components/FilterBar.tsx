// ============================================================
// FilterBar — 筛选工具栏
// 组合 Input/Select 的通用筛选表单
// 支持两种用法：
//   1. fields 模式：声明式 filter 字段
//   2. children 模式：自定义子组件 + onSearch
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../lib/cn';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'search-select' | 'date-range';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  width?: string;
}

/** 可搜索下拉选择：输入关键字本地过滤 options，点选后回填 label */
function SearchSelectField({ field, value, onChange, baseClass }: { field: FilterField; value: string; onChange: (v: string) => void; baseClass: string }) {
  const [kw, setKw] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = (field.options || []).find((o) => o.value === value);
  const filtered = (field.options || []).filter((o) => o.label.toLowerCase().includes(kw.trim().toLowerCase()));

  return (
    <div ref={boxRef} className="relative">
      <input
        className={cn(baseClass, 'w-full')}
        placeholder={field.placeholder || field.label}
        value={open ? kw : (selected?.label || '')}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setKw(e.target.value); setOpen(true); }}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">无匹配项</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setKw(''); }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-[#5C1A1A]/5 ${o.value === value ? 'text-[#5C1A1A] font-medium' : 'text-gray-700'}`}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface FilterBarProps {
  fields?: FilterField[];
  onFilter?: (values: Record<string, string>) => void;
  onReset?: () => void;
  initialValues?: Record<string, string>;
  className?: string;
  // children 模式
  children?: React.ReactNode;
  onSearch?: () => void | Promise<void>;
}

export function FilterBar({ fields, onFilter, onReset, initialValues = {}, className, children, onSearch }: FilterBarProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (onSearch) {
        onSearch();
        return;
      }
      // fields 模式：过滤空值
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v) filtered[k] = v;
      }
      onFilter?.(filtered);
    },
    [values, onFilter, onSearch],
  );

  const handleReset = useCallback(() => {
    const empty: Record<string, string> = {};
    (fields || []).forEach((f) => { empty[f.key] = ''; });
    setValues(empty);
    onReset?.();
  }, [fields, onReset]);

  // children 模式
  if (children) {
    return (
      <form onSubmit={handleSubmit} className={cn('flex flex-wrap items-end gap-3 mb-4', className)}>
        {children}
        <div className="flex items-center gap-2 pb-px">
          <button
            type="submit"
            className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors"
          >
            查询
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            重置
          </button>
        </div>
      </form>
    );
  }

  // fields 模式
  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-wrap items-end gap-3', className)}>
      {(fields || []).map((field) => {
        const baseClass = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400';
        return (
          <div key={field.key} style={field.width ? { width: field.width } : undefined}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <select
                className={cn(baseClass, 'w-full')}
                value={values[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              >
                <option value="">全部</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === 'search-select' ? (
              <SearchSelectField
                field={field}
                value={values[field.key] || ''}
                onChange={(v) => handleChange(field.key, v)}
                baseClass={baseClass}
              />
            ) : (
              <input
                type="text"
                className={cn(baseClass, 'w-full')}
                placeholder={field.placeholder}
                value={values[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-2 pb-px">
        <button
          type="submit"
          className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors"
        >
          查询
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          重置
        </button>
      </div>
    </form>
  );
}
