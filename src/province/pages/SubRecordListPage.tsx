// ============================================================
// Province SubRecordListPage — 省代下属质保记录
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { FilterBar } from '../../shared/components/FilterBar';

interface WarrantyRecord { id: string; certificate_no: string | null; customer_name_snapshot: string; plate_no_snapshot: string; vin_snapshot: string | null; product_name_snapshot: string; store_name_snapshot: string; installation_date: string; status: string; }

const STATUS_MAP: Record<string, string> = {
  draft: '草稿', pending: '待审核', rejected: '已驳回', active: '已生效', expired: '已过期', voided: '已作废',
};

export default function SubRecordListPage() {
  const [data, setData] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(); if (statusFilter) qs.set('status', statusFilter);
      const res = await apiRequest<{ items: WarrantyRecord[] }>(`/province/warranty-records?${qs}`);
      setData(res.items);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const COLUMNS: Column[] = [
    { key: 'certificate_no', title: '证书编号', dataIndex: 'certificate_no' },
    { key: 'customer_name_snapshot', title: '车主', dataIndex: 'customer_name_snapshot' },
    { key: 'plate_no_snapshot', title: '车牌号', dataIndex: 'plate_no_snapshot' },
    { key: 'product_name_snapshot', title: '产品', dataIndex: 'product_name_snapshot' },
    { key: 'store_name_snapshot', title: '施工门店', dataIndex: 'store_name_snapshot' },
    { key: 'installation_date', title: '施工日期', dataIndex: 'installation_date', render: (v) => (v as string)?.slice(0, 10) },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={STATUS_MAP[v as string] || (v as string)} /> },
  ];

  return (
    <div>
      <PageHeader title="下属质保记录" description="查看下属门店提交的所有质保记录" />
      <FilterBar onSearch={fetchData}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </FilterBar>
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无质保记录" />
    </div>
  );
}
