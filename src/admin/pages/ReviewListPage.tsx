// ============================================================
// ReviewListPage — 总部审核列表
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface ReviewItem {
  id: string;
  certificate_no: string | null;
  warranty_code: string;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  plate_no_snapshot: string;
  model_name: string;
  store_name: string;
  status: string;
  submitted_at: string;
}

const FILTER_FIELDS: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'pending', label: '待审核' }, { value: 'active', label: '已通过' }, { value: 'rejected', label: '已驳回' },
  ]},
  { key: 'keyword', label: '搜索', type: 'text', placeholder: '姓名/车牌/VIN/质保码' },
];

const COLUMNS: Column[] = [
  { key: 'warranty_code', title: '质保码', dataIndex: 'warranty_code' },
  { key: 'customer_name_snapshot', title: '车主', dataIndex: 'customer_name_snapshot' },
  { key: 'plate_no_snapshot', title: '车牌', dataIndex: 'plate_no_snapshot' },
  { key: 'model_name', title: '型号', dataIndex: 'model_name' },
  { key: 'store_name', title: '门店', dataIndex: 'store_name' },
  { key: 'submitted_at', title: '提交时间', dataIndex: 'submitted_at', render: (v) => (v as string)?.slice(0, 16) || '-' },
  { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
];

export default function ReviewListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: 'pending' });

  const fetchData = useCallback(async (p: number, f: Record<string, string>) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: '20' });
      const res = await apiRequest<{ items: ReviewItem[]; total: number }>(`/admin/reviews?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters); }, [page, filters, fetchData]);

  return (
    <div>
      <PageHeader title="质保审核" description="审核门店提交的质保登记申请" />
      <FilterBar fields={FILTER_FIELDS} onFilter={(v) => { setFilters(v); setPage(1); }} initialValues={filters} className="mb-4" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} page={page} total={total}
        onPageChange={setPage} onRowClick={(r) => navigate(`/admin/reviews/${r.id}`)} emptyText="暂无待审核记录" />
    </div>
  );
}
