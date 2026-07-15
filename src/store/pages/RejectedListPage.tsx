// ============================================================
// RejectedListPage — 门店驳回待修改列表
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface WarrantyRecord {
  id: string; warranty_code: string; customer_name_snapshot: string;
  plate_no_snapshot: string; model_name: string;
  current_reject_reason: string | null; updated_at: string;
}

const COLUMNS: Column[] = [
  { key: 'warranty_code', title: '质保码', dataIndex: 'warranty_code' },
  { key: 'customer_name_snapshot', title: '车主', dataIndex: 'customer_name_snapshot' },
  { key: 'plate_no_snapshot', title: '车牌', dataIndex: 'plate_no_snapshot' },
  { key: 'model_name', title: '型号', dataIndex: 'model_name' },
  { key: 'current_reject_reason', title: '驳回原因', dataIndex: 'current_reject_reason' },
  { key: 'updated_at', title: '驳回时间', dataIndex: 'updated_at', render: (v) => (v as string)?.slice(0, 16) || '-' },
];

export default function RejectedListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async (p: number, size: number) => {
    setLoading(true); setError(null);
    try {
      const res = await apiRequest<{ items: WarrantyRecord[]; total: number }>(`/store/warranty-records?status=rejected&page=${p}&pageSize=${size}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, pageSize); }, [page, pageSize, fetchData]);

  return (
    <div>
      <PageHeader title="驳回待修改" description="查看审核驳回的记录，修改后可重新提交" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} page={page} pageSize={pageSize} total={total}
        onPageChange={setPage} onPageSizeChange={setPageSize} onRowClick={(r) => navigate(`/store/records/${r.id}/edit`)} emptyText="暂无驳回记录" />
    </div>
  );
}
