// ============================================================
// DashboardPage — 总部数据看板（Atelier Burgundy 风格）
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

const STAT_CARDS: Array<{
  key: keyof DashboardData;
  label: string;
  accent?: string;
}> = [
  { key: 'provinces', label: '省代数量' },
  { key: 'stores', label: '门店数量' },
  { key: 'totalCodes', label: '质保码总数' },
  { key: 'totalRecords', label: '质保记录' },
  { key: 'pendingReviews', label: '待审核', accent: 'var(--accent-gold)' },
  { key: 'todayRecords', label: '今日新增', accent: '#5C1A1A' },
];

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--paper-border-strong)] border-t-[#5C1A1A]" />
    </div>
  );
  if (error) return (
    <div className="text-center py-16 text-[var(--paper-muted)]">
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="mt-2 text-sm text-[#5C1A1A] underline">重试</button>
    </div>
  );
  if (!data) return null;

  return (
    <div>
      <PageHeader title="数据看板" description="核心业务数据概览" />

      {/* 指标卡 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="admin-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-muted)]">
                {c.label}
              </span>
              {c.accent && <span className="h-2 w-2 rounded-full" style={{ background: c.accent }} aria-hidden />}
            </div>
            <span className="metric-value text-3xl font-semibold text-[#5C1A1A] leading-none">
              {data[c.key]}
            </span>
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
    <div className="admin-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
        <h3 className="font-display text-base font-semibold text-[var(--paper-text)]">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--paper-muted)] text-center py-6">暂无数据</p>
      ) : (
        <div className="space-y-1">
          {items.slice(0, 10).map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[var(--burgundy-tint)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold',
                    i < 3 ? 'bg-[#5C1A1A] text-white' : 'bg-[var(--paper-border)] text-[var(--paper-muted)]',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-[var(--paper-text)] truncate">{item.name}</span>
              </div>
              <span className="metric-value text-sm font-semibold text-[#5C1A1A] shrink-0 ml-3">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 轻量 cn（避免额外引入）
function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}
