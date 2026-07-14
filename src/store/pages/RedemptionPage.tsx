// ============================================================
// Store RedemptionPage — 门店兑换记录
// ============================================================

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface RedemptionItem { id: string; total_points: number; status: string; review_note: string | null; tracking_no: string | null; created_at: string; items_json: string; }

const STATUS_MAP: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', shipped: '已发货', completed: '已完成' };

export default function RedemptionPage() {
  const [data, setData] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { const res = await apiRequest<{ items: RedemptionItem[] }>('/store/redemptions'); setData(res.items); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const COLUMNS: Column[] = [
    { key: 'created_at', title: '申请时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 16) },
    { key: 'items_json', title: '商品', dataIndex: 'items_json', render: (v) => {
      try { const items = JSON.parse(v as string); return <span className="text-xs">{items?.map((i: Record<string, unknown>) => i.reward_name).join(', ')}</span>; }
      catch { return '-'; }
    }},
    { key: 'total_points', title: '积分', dataIndex: 'total_points', render: (v) => String(v) },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={STATUS_MAP[v as string] || (v as string)} /> },
    { key: 'tracking_no', title: '物流单号', dataIndex: 'tracking_no' },
    { key: 'review_note', title: '备注', dataIndex: 'review_note' },
  ];

  return (
    <div>
      <PageHeader title="兑换记录" description="查看积分兑换历史" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无兑换记录" />
    </div>
  );
}
