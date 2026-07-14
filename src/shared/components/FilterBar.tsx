// ============================================================
// FilterBar — 筛选工具栏
// 组合 Input/Select 的通用筛选表单
// 支持两种用法：
//   1. fields 模式：声明式 filter 字段
//   2. children 模式：自定义子组件 + onSearch
// ============================================================

import React, { useState, useCallback } from 'react';
import { cn } from '../../lib/cn';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date-range';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  width?: string;
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
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
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
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
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
