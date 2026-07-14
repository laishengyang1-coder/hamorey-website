// ============================================================
// Store DashboardPage — 门店数据看板
// ============================================================

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';

interface StoreDashboard { codeCount: number; recordCount: number; pendingCount: number; rejectedCount: number; availablePoints: number; frozenPoints: number; }

export default function DashboardPage() {
  const [data, setData] = useState<StoreDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { setData(await apiRequest<StoreDashboard>('/store/dashboard')); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>;
  if (error) return <div className="text-center py-16 text-gray-500"><p>{error}</p><button onClick={() => window.location.reload()} className="mt-2 text-sm text-gray-900 underline">重试</button></div>;
  if (!data) return null;

  const cards = [
    { label: '可用质保码', value: data.codeCount, color: 'bg-[#5C1A1A]/10 text-[#5C1A1A]' },
    { label: '质保记录', value: data.recordCount, color: 'bg-green-50 text-green-700' },
    { label: '待审核', value: data.pendingCount, color: 'bg-yellow-50 text-yellow-700' },
    { label: '已驳回', value: data.rejectedCount, color: 'bg-red-50 text-red-700' },
    { label: '可用积分', value: data.availablePoints, color: 'bg-orange-50 text-orange-700' },
    { label: '冻结积分', value: data.frozenPoints, color: 'bg-gray-50 text-gray-700' },
  ];

  return (
    <div>
      <PageHeader title="数据看板" description="门店业务概览" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <p className="text-xs opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
