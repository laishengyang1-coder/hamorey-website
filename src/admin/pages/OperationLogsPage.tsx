// ============================================================
// OperationLogsPage — 总部操作日志
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { FilterBar } from '../../shared/components/FilterBar';
import { usePagination } from '../../shared/hooks/usePagination';

interface LogEntry { id: string; user_id: string | null; operator_name: string | null; action: string; target_type: string | null; target_id: string | null; detail_json: string | null; ip_address: string | null; created_at: string; }

export default function OperationLogsPage() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (actionFilter) qs.set('action', actionFilter);
      qs.set('page', String(pagination.page)); qs.set('pageSize', String(pagination.pageSize));
      const res = await apiRequest<{ items: LogEntry[]; total: number }>(`/admin/operation-logs?${qs}`);
      setData(res.items); pagination.setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, [actionFilter, pagination.page, pagination.pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const COLUMNS: Column[] = [
    { key: 'created_at', title: '时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 16) },
    { key: 'operator_name', title: '操作人', dataIndex: 'operator_name' },
    { key: 'action', title: '操作', dataIndex: 'action' },
    { key: 'target_type', title: '目标类型', dataIndex: 'target_type' },
    { key: 'target_id', title: '目标ID', dataIndex: 'target_id', render: (v) => (v as string)?.slice(0, 12) + '...' },
    { key: 'ip_address', title: 'IP', dataIndex: 'ip_address' },
  ];

  return (
    <div>
      <PageHeader title="操作日志" description="查看所有管理员操作记录" />
      <FilterBar onSearch={fetchData}>
        <input type="text" placeholder="搜索操作名称..." value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); pagination.reset(); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-48" />
      </FilterBar>
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无操作日志"
        pagination={{ ...pagination, setPage: pagination.setPage }} />
    </div>
  );
}
