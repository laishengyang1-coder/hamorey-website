// ============================================================
// DashboardPage — 总部数据看板（Atelier Burgundy 风格）
// ============================================================

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';

interface DashboardData {
  provinces: number; stores: number; totalCodes: number;
  totalRecords: number; pendingReviews: number; todayRecords: number;
  totalPointsEarned: number;
}

interface RankingItem {
  name: string;
  count: number;
  type?: string;
  province?: string;
  city?: string;
}

const STAT_CARDS: Array<{
  key: keyof DashboardData;
  label: string;
  accent?: string;
}> = [
  { key: 'provinces', label: '省代' },
  { key: 'stores', label: '门店' },
  { key: 'totalCodes', label: '质保码' },
  { key: 'totalRecords', label: '质保记录' },
  { key: 'totalPointsEarned', label: '发放积分', accent: '#5C1A1A' },
  { key: 'pendingReviews', label: '待审核', accent: 'var(--accent-gold)' },
  { key: 'todayRecords', label: '今日新增', accent: '#B8924A' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provinceRanking, setProvinceRanking] = useState<RankingItem[]>([]);
  const [storeRanking, setStoreRanking] = useState<RankingItem[]>([]);
  const [productRanking, setProductRanking] = useState<RankingItem[]>([]);
  const [pointsRanking, setPointsRanking] = useState<RankingItem[]>([]);

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
    apiRequest<RankingItem[]>('/admin/dashboard?type=points-ranking').then(setPointsRanking).catch(() => {});
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
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="admin-card p-4 flex flex-col justify-between h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-muted)] whitespace-nowrap">
                {c.label}
              </span>
              {c.accent && <span className="h-2 w-2 rounded-full shrink-0 ml-1" style={{ background: c.accent }} aria-hidden />}
            </div>
            <span className="metric-value text-2xl md:text-3xl font-semibold text-[#5C1A1A] leading-none">
              {data[c.key]}
            </span>
          </div>
        ))}
      </div>

      {/* 排行榜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 auto-rows-fr">
        <div className="h-full"><RankingSection title="省级质保排行" subtitle="各省质保登记总量" items={provinceRanking} /></div>
        <div className="h-full"><RankingSection title="门店质保排行" subtitle="门店质保登记量" items={storeRanking} /></div>
        <div className="h-full"><RankingSection title="产品质保排行" subtitle="产品型号分布" items={productRanking} showProgress /></div>
        <div className="h-full"><RankingSection title="全国积分排行" subtitle="不含兑换与返利" items={pointsRanking} valueLabel="积分" /></div>
      </div>
    </div>
  );
}

const MEDAL_COLORS = ['#C8A96E', '#B0B0B0', '#CD7F32'];
const MEDAL_BG = ['rgba(200,169,110,0.12)', 'rgba(176,176,176,0.12)', 'rgba(205,127,50,0.12)'];

function RankingSection({ title, subtitle, valueLabel, items, showProgress }: {
  title: string; subtitle?: string; valueLabel?: string; items: RankingItem[]; showProgress?: boolean;
}) {
  const label = valueLabel || '条';
  const top3 = items.slice(0, 3);
  const rest = items.slice(3, 10);
  const maxCount = items.length > 0 ? items[0].count : 1;
  const totalCount = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="admin-card p-4 h-full flex flex-col">
      {/* 标题 */}
      <div className="shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
          <h3 className="font-display text-sm font-semibold text-[var(--paper-text)]">{title}</h3>
        </div>
        {subtitle && <p className="text-[10px] text-[var(--paper-muted)] mt-1 ml-[11px]">{subtitle}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--paper-muted)] text-center py-6 flex-1 flex items-center justify-center">暂无数据</p>
      ) : (
        <>
          {/* Top 3 高亮区 */}
          <div className="shrink-0 space-y-1.5 mb-2">
            {top3.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: MEDAL_BG[i] }}>
                <span className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: MEDAL_COLORS[i] }}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[var(--paper-text)] truncate block">{item.name}</span>
                  {item.province && (
                    <span className="text-[9px] text-[var(--paper-muted)]">{item.province}{item.city ? ` · ${item.city}` : ''}</span>
                  )}
                </div>
                <span className="metric-value text-xs font-bold text-[#5C1A1A] shrink-0">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* 进度条（产品排行） */}
          {showProgress && top3.map((item, i) => (
            <div key={`bar-${i}`} className="shrink-0 mb-1 px-2">
              <div className="h-1 rounded-full bg-[var(--paper-border)] overflow-hidden">
                <div className="h-full rounded-full bg-[#5C1A1A]" style={{ width: `${(item.count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}

          {/* 普通排名 */}
          <div className="flex-1 space-y-0.5 overflow-auto">
            {rest.map((item, i) => {
              const idx = i + 3;
              return (
                <div key={idx} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[var(--burgundy-tint)] transition-colors">
                  <span className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold bg-[var(--paper-border)] text-[var(--paper-muted)]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-[var(--paper-text)] truncate block">{item.name}</span>
                    {item.province && (
                      <span className="text-[9px] text-[var(--paper-muted)]">{item.province}{item.city ? ` · ${item.city}` : ''}</span>
                    )}
                  </div>
                  {showProgress && (
                    <div className="w-12 h-1 rounded-full bg-[var(--paper-border)] overflow-hidden shrink-0">
                      <div className="h-full rounded-full bg-[#C8A96E]" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                    </div>
                  )}
                  <span className="metric-value text-xs font-semibold text-[#5C1A1A] shrink-0">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 底部汇总 */}
          <div className="shrink-0 mt-2 pt-2 border-t border-[var(--paper-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--paper-muted)]">共 {items.length} 名</span>
            <span className="text-[10px] text-[var(--paper-muted)]">合计 <span className="font-semibold text-[#5C1A1A]">{totalCount.toLocaleString()}</span> {label}</span>
          </div>
        </>
      )}
    </div>
  );
}

// 轻量 cn（避免额外引入）
function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}
