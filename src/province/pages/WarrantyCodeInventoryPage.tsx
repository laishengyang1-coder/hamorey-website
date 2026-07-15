// ============================================================
// Province WarrantyCodeInventoryPage — 省代质保码库存
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface WarrantyCode { id: string; code: string; model_name: string; batch_no: string; status: string; used_count: number; usage_limit: number; }

const COLUMNS: Column[] = [
  { key: 'code', title: '质保码', dataIndex: 'code', sortable: true },
  { key: 'model_name', title: '型号', dataIndex: 'model_name', sortable: true },
  { key: 'batch_no', title: '批次', dataIndex: 'batch_no', sortable: true },
  { key: 'used_count', title: '已用/总额', sortable: true, render: (_, r) => `${r.used_count}/${r.usage_limit}` },
  { key: 'status', title: '状态', dataIndex: 'status', sortable: true, render: (v) => <StatusBadge status={v as string} /> },
];

export default function WarrantyCodeInventoryPage() {
  const [data, setData] = useState<WarrantyCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string | null>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async (p: number, size: number, sortBy: string | null, direction: 'asc' | 'desc') => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(size) });
      if (sortBy) {
        params.set('sort_by', sortBy);
        params.set('sort_dir', direction);
      }
      const res = await apiRequest<{ items: WarrantyCode[]; total: number }>(`/province/warranty-codes?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, pageSize, sortKey, sortDir); }, [page, pageSize, sortKey, sortDir, fetchData]);

  return (
    <div>
      <PageHeader title="质保码库存" description="查看省代当前质保码库存" />
      <DataTable
        columns={COLUMNS}
        data={data as any}
        loading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={(key, direction) => { setSortKey(key); setSortDir(direction); setPage(1); }}
        emptyText="暂无质保码"
      />
    </div>
  );
}
