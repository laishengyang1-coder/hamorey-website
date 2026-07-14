// ============================================================
// Province PointsPage — 省代积分
// ============================================================

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface PointsLedgerItem { id: string; change_type: string; points_change: number; frozen_change: number; related_type: string | null; reason: string | null; created_at: string; }
interface PointsSummary { available: number; frozen: number; ledger: PointsLedgerItem[]; }

export default function PointsPage() {
  const [data, setData] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { setData(await apiRequest<PointsSummary>('/province/points')); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>;
  if (error) return <div className="text-center py-16 text-gray-500"><p>{error}</p><button onClick={() => window.location.reload()} className="mt-2 text-sm text-gray-900 underline">重试</button></div>;

  const COLUMNS: Column[] = [
    { key: 'created_at', title: '时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 16) },
    { key: 'change_type', title: '类型', dataIndex: 'change_type', render: (v) => {
      const typeMap: Record<string, string> = { award: '获得', deduct: '扣减', freeze: '冻结', release: '释放', adjust: '调整', revoke: '撤回' };
      return <StatusBadge status={typeMap[v as string] || (v as string)} />;
    }},
    { key: 'points_change', title: '积分变动', dataIndex: 'points_change', render: (v) => <span className={Number(v) > 0 ? 'text-green-600' : Number(v) < 0 ? 'text-red-500' : ''}>{v as number}</span> },
    { key: 'frozen_change', title: '冻结变动', dataIndex: 'frozen_change', render: (v) => (v as number) !== 0 ? String(v) : '-' },
    { key: 'reason', title: '原因', dataIndex: 'reason' },
  ];

  return (
    <div>
      <PageHeader title="我的积分" description="查看积分余额和流水明细" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg bg-[#5C1A1A]/10 p-4"><p className="text-xs text-[#5C1A1A]/70">可用积分</p><p className="text-2xl font-bold text-[#5C1A1A]">{data?.available ?? 0}</p></div>
        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">冻结积分</p><p className="text-2xl font-bold text-gray-600">{data?.frozen ?? 0}</p></div>
      </div>
      <DataTable columns={COLUMNS} data={data?.ledger ?? [] as any} loading={false} emptyText="暂无积分流水" />
    </div>
  );
}
