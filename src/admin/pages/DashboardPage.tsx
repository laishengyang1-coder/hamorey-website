// ============================================================
// DashboardPage — 总部数据看板
// ============================================================

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';

interface DashboardData {
  provinces: number; stores: number; totalCodes: number;
  totalRecords: number; pendingReviews: number; todayRecords: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { setData(await apiRequest<DashboardData>('/admin/dashboard')); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>;
  if (error) return <div className="text-center py-16 text-gray-500"><p>{error}</p><button onClick={() => window.location.reload()} className="mt-2 text-sm text-gray-900 underline">重试</button></div>;
  if (!data) return null;

  const cards = [
    { label: '省代数量', value: data.provinces, color: 'bg-[#5C1A1A]/10 text-[#5C1A1A]' },
    { label: '门店数量', value: data.stores, color: 'bg-green-50 text-green-700' },
    { label: '质保码总数', value: data.totalCodes, color: 'bg-[#5C1A1A]/10 text-[#5C1A1A]' },
    { label: '质保记录', value: data.totalRecords, color: 'bg-orange-50 text-orange-700' },
    { label: '待审核', value: data.pendingReviews, color: 'bg-red-50 text-red-700' },
    { label: '今日新增', value: data.todayRecords, color: 'bg-teal-50 text-teal-700' },
  ];

  return (
    <div>
      <PageHeader title="数据看板" description="核心业务数据概览" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
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
