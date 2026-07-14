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
  { key: 'code', title: '质保码', dataIndex: 'code' },
  { key: 'model_name', title: '型号', dataIndex: 'model_name' },
  { key: 'batch_no', title: '批次', dataIndex: 'batch_no' },
  { key: 'used', title: '已用/总额', render: (_, r) => `${r.used_count}/${r.usage_limit}` },
  { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
];

export default function WarrantyCodeInventoryPage() {
  const [data, setData] = useState<WarrantyCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const res = await apiRequest<{ items: WarrantyCode[]; total: number }>(`/province/warranty-codes?page=${p}&pageSize=20`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page); }, [page, fetchData]);

  return (
    <div>
      <PageHeader title="质保码库存" description="查看省代当前质保码库存" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} page={page} total={total} onPageChange={setPage} emptyText="暂无质保码" />
    </div>
  );
}
