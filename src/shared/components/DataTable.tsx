// ============================================================
// DataTable — 通用数据表格（排序/分页/空状态/加载状态）
// ============================================================

import React, { useMemo, useState } from 'react';
import { cn } from '../../lib/cn';

export interface Column {
  key: string;
  title: React.ReactNode;
  dataIndex?: string;
  width?: string;
  sortable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, record: any, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  // Accept any record-like array — type safety is handled by column render functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, unknown>[] | null;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  rowKey?: string | ((record: Record<string, unknown>) => string);
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (key: string, dir: 'asc' | 'desc') => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick?: (record: any) => void;
  className?: string;
  // Shorthand pagination object from usePagination hook
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagination?: any;
}

export function DataTable({
  columns,
  data,
  loading = false,
  error = null,
  emptyText = '暂无数据',
  rowKey = 'id',
  page: pageProp,
  pageSize = 20,
  total: totalProp,
  onPageChange,
  onPageSizeChange,
  sortKey: sortKeyProp,
  sortDir: sortDirProp,
  onSortChange,
  onRowClick,
  className,
  pagination,
}: DataTableProps) {
  // Support both explicit page/total/onPageChange and pagination shorthand
  const page = pagination?.page ?? pageProp ?? 1;
  const activePageSize = pagination?.pageSize ?? pageSize;
  const total = pagination?.total ?? totalProp ?? 0;
  const handlePageChange = onPageChange ?? pagination?.setPage;
  const handlePageSizeChange = onPageSizeChange ?? pagination?.setPageSize;
  const [localSortKey, setLocalSortKey] = useState<string | null>(null);
  const [localSortDir, setLocalSortDir] = useState<'asc' | 'desc'>('asc');
  const sortKey = sortKeyProp ?? localSortKey;
  const sortDir = sortDirProp ?? localSortDir;
  const [jumpPage, setJumpPage] = useState('');

  const handleSort = (key: string) => {
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    if (onSortChange) {
      onSortChange(key, nextDir);
      return;
    }
    setLocalSortKey(key);
    setLocalSortDir(nextDir);
  };

  const getRowKey = (record: Record<string, unknown>, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    return String(record[rowKey] ?? index);
  };

  const totalPages = Math.max(1, Math.ceil(total / activePageSize));
  const sortedData = useMemo(() => {
    if (!data || !sortKey || onSortChange) return data;
    const column = columns.find((col) => col.key === sortKey);
    const valueKey = column?.dataIndex ?? sortKey;

    return [...data].sort((a, b) => {
      const aValue = a[valueKey];
      const bValue = b[valueKey];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDir === 'asc' ? -1 : 1;
      if (bValue == null) return sortDir === 'asc' ? 1 : -1;

      const aNumber = Number(aValue);
      const bNumber = Number(bValue);
      const result = !Number.isNaN(aNumber) && !Number.isNaN(bNumber)
        ? aNumber - bNumber
        : String(aValue).localeCompare(String(bValue), 'zh-CN', { numeric: true });
      return sortDir === 'asc' ? result : -result;
    });
  }, [columns, data, onSortChange, sortDir, sortKey]);

  const changePageSize = (nextPageSize: number) => {
    handlePageSizeChange?.(nextPageSize);
    handlePageChange?.(1);
    setJumpPage('');
  };

  const submitJump = (event: React.FormEvent) => {
    event.preventDefault();
    if (!jumpPage.trim()) return;
    const target = Math.min(totalPages, Math.max(1, Number(jumpPage)));
    if (!Number.isFinite(target)) return;
    handlePageChange?.(target);
    setJumpPage('');
  };

  // 渲染状态
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper-raised)]">
        <div className="p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--paper-border-strong)] border-t-[#5C1A1A]" />
          <p className="mt-3 text-sm text-[var(--paper-muted)]">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#F0D5D5] bg-[#FBEAEA] p-12 text-center">
        <p className="text-sm text-[#B23A3A]">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-[var(--paper-border)] bg-[var(--paper-raised)] overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--paper-border)] bg-[#F6F1ED]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-[var(--paper-muted)] uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--paper-text)]',
                    col.className,
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.title}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-[#5C1A1A]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--paper-border)]">
            {(!sortedData || sortedData.length === 0) ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-[var(--paper-muted)]">
                  {emptyText}
                </td>
              </tr>
            ) : (
              sortedData.map((record, index) => (
                <tr
                  key={getRowKey(record, index)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-[var(--burgundy-tint)]',
                  )}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((col) => {
                    const value = col.dataIndex ? record[col.dataIndex] : record[col.key];
                    return (
                      <td key={col.key} className={cn('px-4 py-3 text-[var(--paper-text-soft)]', col.className)}>
                        {col.render ? col.render(value, record, index) : String(value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--paper-border)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--paper-muted)]">
            <span>共 {total} 条，第 {page}/{totalPages} 页</span>
            {handlePageSizeChange && (
              <label className="inline-flex items-center gap-2">
                每页
                <select
                  value={activePageSize}
                  onChange={(event) => changePageSize(Number(event.target.value))}
                  className="rounded-md border border-[var(--paper-border)] bg-white px-2 py-1 text-sm text-[var(--paper-text-soft)] focus:border-[#5C1A1A] focus:outline-none focus:ring-1 focus:ring-[#5C1A1A]"
                >
                  {[20, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                条
              </label>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={submitJump} className="flex items-center gap-1">
              <span className="text-sm text-[var(--paper-muted)]">跳至</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(event) => setJumpPage(event.target.value)}
                className="h-8 w-16 rounded-md border border-[var(--paper-border)] bg-white px-2 text-sm text-[var(--paper-text-soft)] focus:border-[#5C1A1A] focus:outline-none focus:ring-1 focus:ring-[#5C1A1A]"
              />
              <button
                type="submit"
                className="rounded-md px-2.5 py-1.5 text-sm text-[var(--paper-text-soft)] hover:bg-[var(--burgundy-tint)] transition-colors"
              >
                确定
              </button>
            </form>
            <button
              className="rounded-md px-3 py-1.5 text-sm text-[var(--paper-text-soft)] hover:bg-[var(--burgundy-tint)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={page <= 1}
              onClick={() => handlePageChange?.(page - 1)}
            >
              上一页
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    pageNum === page
                      ? 'bg-[#5C1A1A] text-white'
                      : 'text-[var(--paper-text-soft)] hover:bg-[var(--burgundy-tint)]',
                  )}
                  onClick={() => handlePageChange?.(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="rounded-md px-3 py-1.5 text-sm text-[var(--paper-text-soft)] hover:bg-[var(--burgundy-tint)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={page >= totalPages}
              onClick={() => handlePageChange?.(page + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
