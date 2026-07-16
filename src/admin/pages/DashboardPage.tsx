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
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [lifecycle, setLifecycle] = useState<{ total: number; hq: number; province: number; store: number; used: number; warranty: number } | null>(null);
  const [storeActivity, setStoreActivity] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { setData(await apiRequest<DashboardData>('/admin/dashboard')); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
    apiRequest<RankingItem[]>('/admin/dashboard?type=province-ranking').then(setProvinceRanking).catch(() => {});
    apiRequest<RankingItem[]>('/admin/dashboard?type=store-ranking').then(setStoreRanking).catch(() => {});
    apiRequest<RankingItem[]>('/admin/dashboard?type=product-ranking').then(setProductRanking).catch(() => {});
    apiRequest<RankingItem[]>('/admin/dashboard?type=points-ranking').then(setPointsRanking).catch(() => {});
    apiRequest<{ date: string; count: number }[]>('/admin/dashboard?type=trend').then(setTrendData).catch(() => {});
    apiRequest<any>('/admin/dashboard?type=code-lifecycle').then(setLifecycle).catch(() => {});
    apiRequest<any[]>('/admin/dashboard?type=store-activity').then(setStoreActivity).catch(() => {});
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

      {/* 趋势图 + 漏斗 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* 质保登记趋势 */}
        <div className="admin-card p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
            <h3 className="font-display text-sm font-semibold text-[var(--paper-text)]">质保登记趋势（近30天）</h3>
          </div>
          <TrendChart data={trendData} />
        </div>

        {/* 质保码生命周期漏斗 */}
        <div className="admin-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
            <h3 className="font-display text-sm font-semibold text-[var(--paper-text)]">质保码流转</h3>
          </div>
          {lifecycle && <LifecycleFunnel data={lifecycle} />}
        </div>
      </div>

      {/* 排行榜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 items-start">
        <RankingSection title="省级质保排行" subtitle="各省质保登记总量" items={provinceRanking} />
        <RankingSection title="门店质保排行" subtitle="门店质保登记量" items={storeRanking} />
        <RankingSection title="产品质保排行" subtitle="产品型号分布" items={productRanking} showProgress />
        <RankingSection title="全国积分排行" subtitle="不含兑换与返利" items={pointsRanking} valueLabel="积分" />
      </div>

      {/* 门店活跃度 */}
      <StoreActivitySection items={storeActivity} />
    </div>
  );
}

const MEDAL_COLORS = ['#C8A96E', '#B0B0B0', '#CD7F32'];
const MEDAL_BG = ['rgba(200,169,110,0.12)', 'rgba(176,176,176,0.12)', 'rgba(205,127,50,0.12)'];

function RankingSection({ title, subtitle, valueLabel, items, showProgress }: {
  title: string; subtitle?: string; valueLabel?: string; items: RankingItem[]; showProgress?: boolean;
}) {
  const label = valueLabel || '条';
  const visibleItems = items.slice(0, 10);
  const maxCount = items.length > 0 ? items[0].count : 1;
  const totalCount = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="admin-card p-3.5">
      {/* 标题 */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
          <h3 className="font-display text-sm font-semibold text-[var(--paper-text)]">{title}</h3>
        </div>
        {subtitle && <p className="text-[10px] text-[var(--paper-muted)] mt-0.5 ml-[11px]">{subtitle}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--paper-muted)] text-center py-6">暂无数据</p>
      ) : (
        <>
          {/* 榜单主体：紧凑排列，避免被强行拉开 */}
          <div className="space-y-1 overflow-hidden">
            {visibleItems.map((item, idx) => {
              const isTop = idx < 3;
              const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[var(--burgundy-tint)]"
                  style={isTop ? { background: MEDAL_BG[idx] } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={isTop
                        ? { background: MEDAL_COLORS[idx], color: '#FFFFFF' }
                        : { background: 'var(--paper-border)', color: 'var(--paper-muted)' }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`${isTop ? 'font-semibold' : 'font-medium'} text-xs text-[var(--paper-text)] truncate block`}>
                        {item.name}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-[var(--paper-muted)]">
                        {item.province || item.city ? (
                          <span className="truncate">{item.province || '-'}{item.city ? ` · ${item.city}` : ''}</span>
                        ) : showProgress ? (
                          <span>占榜首 {pct}%</span>
                        ) : (
                          <span>{title.replace('排行', '')}</span>
                        )}
                      </div>
                    </div>
                    <span className="metric-value text-xs font-semibold text-[#5C1A1A] shrink-0 ml-2">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  {showProgress && (
                    <div className="absolute bottom-0.5 left-9 right-2 h-0.5 rounded-full bg-[var(--paper-border)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: isTop ? MEDAL_COLORS[idx] : '#C8A96E' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {visibleItems.length < 10 && Array.from({ length: 10 - visibleItems.length }).map((_, idx) => (
              <div key={`placeholder-${idx}`} className="rounded-lg px-2.5 py-1.5 opacity-45">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold bg-[var(--paper-border)] text-[var(--paper-muted)]">
                    {visibleItems.length + idx + 1}
                  </span>
                  <span className="text-xs text-[var(--paper-muted)]">等待更多数据</span>
                </div>
              </div>
            ))}
          </div>

          {/* 底部汇总 */}
          <div className="shrink-0 mt-2 pt-1.5 border-t border-[var(--paper-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--paper-muted)]">共 {items.length} 名</span>
            <span className="text-[10px] text-[var(--paper-muted)]">合计 <span className="font-semibold text-[#5C1A1A]">{totalCount.toLocaleString()}</span> {label}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 趋势图（SVG 折线图） ───
function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-[var(--paper-muted)] text-center py-8">暂无趋势数据</p>;

  const w = 600, h = 160, pad = 36;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.count / maxCount) * (h - pad * 2);
    return { x, y, ...d };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${h - pad} L${pad},${h - pad} Z`;
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-2xl font-bold text-[#5C1A1A]">{total}</span>
        <span className="text-xs text-[var(--paper-muted)]">条 / 30天</span>
        <span className="text-xs text-[var(--paper-muted)] ml-auto">峰值 {maxCount} 条/天</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5C1A1A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#5C1A1A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = pad + f * (h - pad * 2);
          const value = Math.round(maxCount * (1 - f));
          return (
            <g key={f}>
              <text x={pad - 8} y={y + 3} textAnchor="end" fontSize="9" fill="var(--paper-muted)">
                {value}
              </text>
              <line x1={pad} y1={y} x2={w - pad} y2={y}
                stroke="var(--paper-border)" strokeWidth="0.5" strokeDasharray="3,3" />
            </g>
          );
        })}
        <path d={areaD} fill="url(#trendGrad)" />
        <path d={pathD} fill="none" stroke="#5C1A1A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          i % Math.ceil(data.length / 10) === 0 || i === data.length - 1 ? (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="#5C1A1A" />
              <text x={p.x} y={h - pad + 14} textAnchor="middle" fontSize="9" fill="var(--paper-muted)">
                {p.date.slice(5)}
              </text>
            </g>
          ) : null
        ))}
      </svg>
    </div>
  );
}

// ─── 质保码生命周期漏斗 ───
function LifecycleFunnel({ data }: { data: { total: number; hq: number; province: number; store: number; used: number; warranty: number } }) {
  const stages = [
    { label: '总导入', value: data.total, color: '#5C1A1A' },
    { label: '总部库存', value: data.hq, color: '#7A2E2E' },
    { label: '省代库存', value: data.province, color: '#9B5050' },
    { label: '门店库存', value: data.store, color: '#C8A96E' },
    { label: '已用完', value: data.used, color: '#B8924A' },
    { label: '生成质保', value: data.warranty, color: '#A07840' },
  ];
  const maxVal = Math.max(...stages.map(s => s.value), 1);

  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-[var(--paper-text)]">{s.label}</span>
            <span className="text-xs font-bold text-[#5C1A1A]">{s.value.toLocaleString()}</span>
          </div>
          <div className="h-5 rounded bg-[var(--paper-border)] overflow-hidden">
            <div className="h-full rounded flex items-center justify-end px-2 transition-all"
              style={{ width: `${(s.value / maxVal) * 100}%`, background: s.color, minWidth: s.value > 0 ? '24px' : '0' }}>
              {s.value > 0 && (
                <span className="text-[9px] text-white font-medium">
                  {((s.value / data.total) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 门店活跃度 ───
function StoreActivitySection({ items }: { items: any[] }) {
  if (items.length === 0) return null;
  const inactive = items
    .filter(s => s.is_inactive)
    .sort((a, b) => {
      const aDays = a.days_since ?? -1;
      const bDays = b.days_since ?? -1;
      return bDays - aDays;
    });
  const active = items.length - inactive.length;

  return (
    <div className="admin-card p-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
        <h3 className="font-display text-sm font-semibold text-[var(--paper-text)]">门店活跃度</h3>
        <span className="text-xs text-[var(--paper-muted)] ml-2">
          活跃 {active} · 沉默 {inactive.length}（30天无登记）
        </span>
      </div>
      {inactive.length === 0 ? (
        <p className="text-sm text-[var(--paper-muted)] py-3">所有门店近30天均有质保登记</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {inactive.slice(0, 12).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-[#FBEAEA] px-3 py-2">
              <div className="min-w-0">
                <span className="text-xs text-[var(--paper-text)] truncate block">{s.name}</span>
                <span className="text-[9px] text-[var(--paper-muted)]">
                  {s.last_active ? `最后登记: ${s.last_active.slice(0, 10)}` : '从未登记'}
                  {s.province ? ` · ${s.province}` : ''}
                </span>
              </div>
              <span className="text-[10px] text-red-500 font-medium shrink-0 ml-2">
                {s.days_since !== null ? `${s.days_since}天前` : '从未登记'}
              </span>
            </div>
          ))}
          {inactive.length > 12 && (
            <div className="flex items-center justify-center rounded-lg bg-[var(--paper-border)] px-3 py-2">
              <span className="text-xs text-[var(--paper-muted)]">+{inactive.length - 12} 家</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
