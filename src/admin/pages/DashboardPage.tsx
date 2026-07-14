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

interface RankingItem {
  name: string;
  count: number;
  type?: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provinceRanking, setProvinceRanking] = useState<RankingItem[]>([]);
  const [storeRanking, setStoreRanking] = useState<RankingItem[]>([]);
  const [productRanking, setProductRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { setData(await apiRequest<DashboardData>('/admin/dashboard')); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
    // 拉取排行榜
    apiRequest<RankingItem[]>('/admin/dashboard?type=province-ranking').then(setProvinceRanking).catch(() => {});
    apiRequest<RankingItem[]>('/admin/dashboard?type=store-ranking').then(setStoreRanking).catch(() => {});
    apiRequest<RankingItem[]>('/admin/dashboard?type=product-ranking').then(setProductRanking).catch(() => {});
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

      {/* 排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <RankingSection title="省级质保排行" items={provinceRanking} />
        <RankingSection title="门店质保排行" items={storeRanking} />
        <RankingSection title="产品质保排行" items={productRanking} />
      </div>
    </div>
  );
}

function RankingSection({ title, items }: { title: string; items: RankingItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 10).map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${i < 3 ? 'bg-[#5C1A1A]' : 'bg-gray-400'}`}>{i + 1}</span>
                <span className="text-gray-700 truncate max-w-[140px]">{item.name}</span>
              </div>
              <span className="font-medium text-[#5C1A1A]">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
