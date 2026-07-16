// ============================================================
// ReviewListPage — 总部审核列表（支持批量审核）
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

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

export default function ReviewListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<Record<string, string>>({ status: 'pending' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [batching, setBatching] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number, f: Record<string, string>, size: number) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: String(size) });
      const res = await apiRequest<{ items: ReviewItem[]; total: number }>(`/admin/reviews?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters, pageSize); }, [page, filters, pageSize, fetchData]);

  const isPendingView = filters.status === 'pending';
  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleAll = () => {
    if (data.every(r => selected.has(r.id))) setSelected(new Set());
    else setSelected(new Set(data.map(r => r.id)));
  };
  const allChecked = data.length > 0 && data.every(r => selected.has(r.id));

  const handleBatch = async () => {
    if (!batchAction || selected.size === 0) return;
    setBatching(true);
    setBatchResult(null);
    const ids = [...selected];
    const endpoint = batchAction === 'approve' ? 'approve' : 'reject';
    let ok = 0, fail = 0;
    const results = await Promise.allSettled(
      ids.map(id => apiRequest(`/admin/reviews/${id}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(batchAction === 'reject' ? { reason: '批量驳回' } : {}),
      }))
    );
    for (const r of results) { if (r.status === 'fulfilled') ok++; else fail++; }
    setBatching(false);
    setBatchAction(null);
    setSelected(new Set());
    setBatchResult(`批量${batchAction === 'approve' ? '通过' : '驳回'}完成：成功 ${ok} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`);
    fetchData(page, filters, pageSize);
  };

  const COLUMNS: Column[] = isPendingView ? [
    { key: 'select', title: (
      <input type="checkbox" checked={allChecked} onChange={toggleAll}
        aria-label="全选" className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
    ), width: '40px', render: (_, record) => (
      <input type="checkbox" checked={selected.has(record.id as string)} onClick={(e) => e.stopPropagation()}
        onChange={() => toggleSelect(record.id as string)}
        aria-label={`选择 ${record.warranty_code as string}`}
        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
    )},
    ...BASE_COLUMNS,
  ] : BASE_COLUMNS;

  return (
    <div>
      <PageHeader title="质保审核" description="审核门店提交的质保登记申请"
        actions={isPendingView && selected.size > 0 && (
          <div className="flex gap-2">
            <button onClick={() => setBatchAction('approve')} disabled={batching}
              className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
              批量通过 ({selected.size})
            </button>
            <button onClick={() => setBatchAction('reject')} disabled={batching}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              批量驳回
            </button>
          </div>
        )}
      />
      {batchResult && (
        <div className="mb-3 rounded-lg border border-[#E8D5B7] bg-[#FBF5EC] px-4 py-2 text-sm text-[#5C1A1A]">
          {batchResult}
          <button onClick={() => setBatchResult(null)} className="ml-3 text-xs text-[var(--paper-muted)] underline">关闭</button>
        </div>
      )}
      <FilterBar fields={FILTER_FIELDS} onFilter={(v) => { setFilters(v); setPage(1); setSelected(new Set()); }} initialValues={filters} className="mb-4" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} page={page} pageSize={pageSize} total={total}
        onPageChange={(p) => { setPage(p); setSelected(new Set()); }} onPageSizeChange={(s) => { setPageSize(s); setSelected(new Set()); }}
        onRowClick={(r) => navigate(`/admin/reviews/${r.id}`)} emptyText="暂无待审核记录" />
      <ConfirmDialog open={!!batchAction} onOpenChange={(v) => { if (!v) setBatchAction(null); }}
        title={batchAction === 'approve' ? '确认批量通过' : '确认批量驳回'}
        description={`将${batchAction === 'approve' ? '通过' : '驳回'} ${selected.size} 条质保申请${batchAction === 'reject' ? '（统一备注：批量驳回）' : ''}。`}
        onConfirm={handleBatch} loading={batching} confirmText={batchAction === 'approve' ? '确认通过' : '确认驳回'}
        variant={batchAction === 'reject' ? 'danger' : 'default'} />
    </div>
  );
}

const BASE_COLUMNS: Column[] = [
  { key: 'warranty_code', title: '质保码', dataIndex: 'warranty_code' },
  { key: 'customer_name_snapshot', title: '车主', dataIndex: 'customer_name_snapshot' },
  { key: 'plate_no_snapshot', title: '车牌', dataIndex: 'plate_no_snapshot', className: 'whitespace-nowrap' },
  { key: 'model_name', title: '型号', dataIndex: 'model_name', className: 'max-w-[120px] truncate' },
  { key: 'store_name', title: '门店', dataIndex: 'store_name', className: 'max-w-[140px] truncate' },
  { key: 'submitted_at', title: '提交时间', dataIndex: 'submitted_at', render: (v) => (v as string)?.slice(0, 16) || '-', className: 'whitespace-nowrap' },
  { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} />, className: 'whitespace-nowrap' },
];
