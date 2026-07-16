// ============================================================
// RedemptionListPage — 总部兑换审核（发货管理优化版）
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { FilterBar } from '../../shared/components/FilterBar';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

interface RedemptionItem { reward_id: string; quantity: number; points_per_item: number; reward_name_snapshot: string; }
interface Redemption {
  id: string; organization_id: string; org_name: string;
  total_points: number; status: string; review_note: string | null;
  tracking_no: string | null; created_at: string; items_json?: string;
}

const STATUS_MAP: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', shipped: '已发货', completed: '已完成' };

function parseItems(json?: string): RedemptionItem[] {
  if (!json) return [];
  try { return JSON.parse(json) as RedemptionItem[]; } catch { return []; }
}

export default function RedemptionListPage() {
  const [data, setData] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Redemption | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [trackingInput, setTrackingInput] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(); if (statusFilter) qs.set('status', statusFilter); qs.set('page', String(page)); qs.set('pageSize', String(pageSize));
      const res = await apiRequest<{ items: Redemption[]; total: number }>(`/admin/redemptions?${qs}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, [statusFilter, page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async () => {
    if (!actionId || !actionType) return;
    try {
      let body = '{}';
      if (actionType === 'ship') body = JSON.stringify({ tracking_no: trackingInput.trim() });
      await apiRequest(`/admin/redemptions/${actionId}/${actionType}`, { method: 'POST', body });
      setActionId(null); setActionType(''); setTrackingInput('');
      fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '操作失败'); }
  };

  const openAction = (id: string, action: string) => {
    setActionId(id); setActionType(action);
    if (action === 'ship') setTrackingInput('');
  };

  const COLUMNS: Column[] = [
    { key: 'org_name', title: '申请组织', dataIndex: 'org_name', className: 'max-w-[140px] truncate' },
    { key: 'items', title: '兑换商品', dataIndex: 'items_json', render: (v) => {
      const items = parseItems(v as string);
      if (items.length === 0) return '-';
      const summary = items.map(i => `${i.reward_name_snapshot}×${i.quantity}`).join(', ');
      return <span className="text-xs truncate block max-w-[200px]" title={summary}>{summary}</span>;
    }},
    { key: 'total_points', title: '消耗积分', dataIndex: 'total_points', render: (v) => String(v), className: 'whitespace-nowrap' },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={STATUS_MAP[v as string] || (v as string)} />, className: 'whitespace-nowrap' },
    { key: 'tracking_no', title: '物流单号', dataIndex: 'tracking_no', render: (v) => v ? <span className="text-xs">{v as string}</span> : '-', className: 'whitespace-nowrap' },
    { key: 'created_at', title: '申请时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 16), className: 'whitespace-nowrap' },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_, r) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setSelected(r); setDrawerOpen(true); }} className="text-xs text-gray-600 hover:text-gray-900">详情</button>
        {r.status === 'pending' && <>
          <button onClick={() => openAction(r.id, 'approve')} className="text-xs text-green-600 hover:text-green-800">通过</button>
          <button onClick={() => openAction(r.id, 'reject')} className="text-xs text-red-500 hover:text-red-700">拒绝</button>
        </>}
        {r.status === 'approved' && <button onClick={() => openAction(r.id, 'ship')} className="text-xs text-[#C84444] hover:text-[#A03030]">发货</button>}
      </div>
    )},
  ];

  const selectedItems = selected ? parseItems(selected.items_json) : [];
  const isShipAction = actionType === 'ship';

  return (
    <div>
      <PageHeader title="兑换审核" description="审核门店/省代的积分兑换申请，管理发货" />
      <FilterBar onSearch={fetchData}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">待发货</option>
          <option value="shipped">已发货</option>
          <option value="rejected">已拒绝</option>
          <option value="completed">已完成</option>
        </select>
      </FilterBar>
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无兑换记录"
        page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {/* 详情抽屉 */}
      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="兑换详情">
        {selected && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-500">申请组织：</span>{selected.org_name}</div>
            <div><span className="text-gray-500">状态：</span>{STATUS_MAP[selected.status] || selected.status}</div>
            <div><span className="text-gray-500">消耗积分：</span><span className="font-semibold text-[#5C1A1A]">{selected.total_points}</span></div>
            {selectedItems.length > 0 && (
              <div>
                <span className="text-gray-500">兑换商品：</span>
                <div className="mt-1 space-y-1">
                  {selectedItems.map((item, i) => (
                    <div key={i} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span>{item.reward_name_snapshot}</span>
                      <span className="text-gray-500">×{item.quantity} ({item.points_per_item}/件)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected.tracking_no && <div><span className="text-gray-500">物流单号：</span><span className="font-mono text-xs">{selected.tracking_no}</span></div>}
            {selected.review_note && <div><span className="text-gray-500">审核备注：</span>{selected.review_note}</div>}
            <div><span className="text-gray-500">申请时间：</span>{selected.created_at?.slice(0, 16)}</div>
          </div>
        )}
      </DetailDrawer>

      {/* 操作确认弹窗 */}
      <ConfirmDialog open={!!actionId} onOpenChange={(open) => { if (!open) { setActionId(null); setActionType(''); setTrackingInput(''); } }}
        title={isShipAction ? '发货确认' : `确认${actionType === 'approve' ? '通过' : '拒绝'}`}
        confirmText={isShipAction ? '确认发货' : '确认'} onConfirm={doAction}
        variant={actionType === 'reject' ? 'danger' : 'default'}>
        {isShipAction ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">请输入物流单号（可选）：</p>
            <input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="快递单号"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5C1A1A] focus:outline-none focus:ring-1 focus:ring-[#5C1A1A]" />
          </div>
        ) : (
          <p className="text-sm text-gray-500">确认{actionType === 'approve' ? '通过该兑换申请' : '拒绝该兑换申请（积分将退回，库存将回补）'}？</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
