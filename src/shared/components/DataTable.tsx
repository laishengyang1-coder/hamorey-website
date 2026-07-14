// ============================================================
// DataTable — 通用数据表格（排序/分页/空状态/加载状态）
// ============================================================

import React, { useState } from 'react';
import { cn } from '../../lib/cn';

export interface Column {
  key: string;
  title: string;
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
  onRowClick,
  className,
  pagination,
}: DataTableProps) {
  // Support both explicit page/total/onPageChange and pagination shorthand
  const page = pagination?.page ?? pageProp ?? 1;
  const total = pagination?.total ?? totalProp ?? 0;
  const handlePageChange = onPageChange ?? pagination?.setPage;
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getRowKey = (record: Record<string, unknown>, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    return String(record[rowKey] ?? index);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 渲染状态
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="mt-3 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                    col.className,
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.title}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-gray-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(!data || data.length === 0) ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={getRowKey(record, index)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50',
                  )}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((col) => {
                    const value = col.dataIndex ? record[col.dataIndex] : record[col.key];
                    return (
                      <td key={col.key} className={cn('px-4 py-3 text-gray-700', col.className)}>
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
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <span className="text-sm text-gray-500">
            共 {total} 条，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    'rounded-md px-3 py-1.5 text-sm',
                    pageNum === page
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                  onClick={() => handlePageChange?.(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
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
