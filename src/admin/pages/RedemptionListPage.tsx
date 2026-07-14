// ============================================================
// RedemptionListPage — 总部兑换审核
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { FilterBar } from '../../shared/components/FilterBar';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

interface Redemption { id: string; organization_id: string; org_name: string; total_points: number; status: string; review_note: string | null; tracking_no: string | null; created_at: string; items_json?: string; }

const STATUS_MAP: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', shipped: '已发货', completed: '已完成' };

export default function RedemptionListPage() {
  const [data, setData] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Redemption | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(); if (statusFilter) qs.set('status', statusFilter); qs.set('page', String(page));
      const res = await apiRequest<{ items: Redemption[]; total: number }>(`/admin/redemptions?${qs}`);
      setData(res.items);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (id: string, action: 'approve' | 'reject' | 'ship') => {
    try {
      const body = action === 'ship' ? JSON.stringify({ tracking_no: prompt('请输入物流单号：') || '' }) : JSON.stringify({});
      await apiRequest(`/admin/redemptions/${id}/${action}`, { method: 'POST', body });
      setActionId(null); setActionType(''); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '操作失败'); }
  };

  const COLUMNS: Column[] = [
    { key: 'org_name', title: '申请组织', dataIndex: 'org_name' },
    { key: 'total_points', title: '消耗积分', dataIndex: 'total_points', render: (v) => String(v) },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={STATUS_MAP[v as string] || (v as string)} /> },
    { key: 'created_at', title: '申请时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 16) },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_, r) => (
      <div className="flex gap-2">
        <button onClick={() => { setSelected(r); setDrawerOpen(true); }} className="text-xs text-gray-600 hover:text-gray-900">详情</button>
        {r.status === 'pending' && <>
          <button onClick={() => { setActionId(r.id); setActionType('approve'); }} className="text-xs text-green-600 hover:text-green-800">通过</button>
          <button onClick={() => { setActionId(r.id); setActionType('reject'); }} className="text-xs text-red-500 hover:text-red-700">拒绝</button>
        </>}
        {r.status === 'approved' && <button onClick={() => { setActionId(r.id); setActionType('ship'); }} className="text-xs text-[#C84444] hover:text-[#A03030]">发货</button>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="兑换审核" description="审核门店/省代的积分兑换申请" />
      <FilterBar onSearch={fetchData}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">全部状态</option>
          <option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已拒绝</option><option value="shipped">已发货</option>
        </select>
      </FilterBar>
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无兑换记录" />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="兑换详情">
        {selected && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-500">组织：</span>{selected.org_name}</div>
            <div><span className="text-gray-500">状态：</span>{STATUS_MAP[selected.status] || selected.status}</div>
            <div><span className="text-gray-500">消耗积分：</span>{selected.total_points}</div>
            {selected.review_note && <div><span className="text-gray-500">审核备注：</span>{selected.review_note}</div>}
            {selected.tracking_no && <div><span className="text-gray-500">物流单号：</span>{selected.tracking_no}</div>}
            <div><span className="text-gray-500">申请时间：</span>{selected.created_at?.slice(0, 16)}</div>
          </div>
        )}
      </DetailDrawer>

      {actionId && (
        <ConfirmDialog open={!!actionId} onOpenChange={(open) => { if (!open) { setActionId(null); setActionType(''); } }} title={`确认${actionType === 'approve' ? '通过' : actionType === 'reject' ? '拒绝' : '发货'}`}
          description={`确认${actionType === 'approve' ? '通过该兑换申请' : actionType === 'reject' ? '拒绝该兑换申请' : '标记该兑换为已发货'}？`}
          confirmText="确认" onConfirm={() => doAction(actionId, actionType as 'approve' | 'reject' | 'ship')} />
      )}
    </div>
  );
}
