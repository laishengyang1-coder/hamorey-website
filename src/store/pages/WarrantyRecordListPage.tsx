// ============================================================
// Store WarrantyRecordListPage — 门店我的质保记录
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface WarrantyRecord {
  id: string; warranty_code: string; certificate_no: string | null;
  customer_name_snapshot: string; plate_no_snapshot: string;
  model_name: string; status: string; installation_date: string; created_at: string;
}

const FILTER_FIELDS: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'pending', label: '待审核' }, { value: 'active', label: '有效' },
    { value: 'rejected', label: '已驳回' }, { value: 'expired', label: '已过期' },
  ]},
  { key: 'keyword', label: '搜索', type: 'text', placeholder: '姓名/车牌/质保码' },
];

const COLUMNS: Column[] = [
  { key: 'warranty_code', title: '质保码', dataIndex: 'warranty_code' },
  { key: 'customer_name_snapshot', title: '车主', dataIndex: 'customer_name_snapshot' },
  { key: 'plate_no_snapshot', title: '车牌', dataIndex: 'plate_no_snapshot' },
  { key: 'model_name', title: '型号', dataIndex: 'model_name' },
  { key: 'installation_date', title: '施工日期', dataIndex: 'installation_date' },
  { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
];

export default function WarrantyRecordListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchData = useCallback(async (p: number, f: Record<string, string>) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: '20' });
      const res = await apiRequest<{ items: WarrantyRecord[]; total: number }>(`/store/warranty-records?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters); }, [page, filters, fetchData]);

  return (
    <div>
      <PageHeader title="我的质保记录" description="查看本店提交的所有质保登记" />
      <FilterBar fields={FILTER_FIELDS} onFilter={(v) => { setFilters(v); setPage(1); }} className="mb-4" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} page={page} total={total}
        onPageChange={setPage} onRowClick={(r) => navigate(`/store/records/${r.id}/edit`)} emptyText="暂无质保记录" />
    </div>
  );
}
