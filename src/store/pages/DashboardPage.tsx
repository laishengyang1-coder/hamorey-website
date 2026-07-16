// ============================================================
// Store DashboardPage — 门店数据看板（Atelier Burgundy 风格）
// ============================================================

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';

interface StoreDashboard {
  codeCount: number;
  recordCount: number;
  pendingCount: number;
  rejectedCount: number;
  availablePoints: number;
  frozenPoints: number;
}

interface RankingItem {
  name: string;
  count: number;
  province?: string;
  city?: string;
  org_id?: string;
}

interface MyRank {
  rank: number;
  points: number;
  name: string;
}

const STAT_CARDS: Array<{
  key: keyof StoreDashboard;
  label: string;
  accent?: string;
}> = [
  { key: 'codeCount', label: '可用质保码' },
  { key: 'recordCount', label: '质保记录' },
  { key: 'pendingCount', label: '待审核', accent: 'var(--accent-gold)' },
  { key: 'rejectedCount', label: '已驳回', accent: '#B23A3A' },
  { key: 'availablePoints', label: '可用积分' },
  { key: 'frozenPoints', label: '冻结积分' },
];

export default function DashboardPage() {
  const [data, setData] = useState<StoreDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsRanking, setPointsRanking] = useState<RankingItem[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { setData(await apiRequest<StoreDashboard>('/store/dashboard')); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
    apiRequest<{ ranking: RankingItem[]; myRank: MyRank }>('/store/dashboard?type=national-points-ranking')
      .then((res) => { setPointsRanking(res.ranking); setMyRank(res.myRank); })
      .catch(() => {});
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
      <PageHeader title="数据看板" description="门店业务概览" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="admin-card p-4 flex flex-col justify-between min-h-[88px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-muted)] whitespace-nowrap">
                {c.label}
              </span>
              {c.accent && <span className="h-2 w-2 rounded-full shrink-0 ml-1" style={{ background: c.accent }} aria-hidden />}
            </div>
            <span className="metric-value text-2xl md:text-3xl font-semibold text-[#5C1A1A] leading-none mt-2">
              {data[c.key]}
            </span>
          </div>
        ))}
      </div>

      {/* 全国积分排行 */}
      <div className="mt-8 admin-card p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
            <h3 className="font-display text-base font-semibold text-[var(--paper-text)]">全国积分排行</h3>
          </div>
        </div>
        <p className="text-xs text-[var(--paper-muted)] mb-4">按质保登记方累计，不含兑换与代理商返利</p>

        {/* 自店排名 */}
        {myRank && myRank.points > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-[#FBF5EC] border border-[#E8D5B7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-[#5C1A1A] text-white flex items-center justify-center text-xs font-bold">
                {myRank.rank > 99 ? '99+' : myRank.rank}
              </span>
              <div>
                <span className="text-sm font-semibold text-[#5C1A1A]">{myRank.name}</span>
                <span className="text-xs text-[var(--paper-muted)] ml-2">我的排名</span>
              </div>
            </div>
            <span className="metric-value text-sm font-semibold text-[#5C1A1A]">
              {myRank.points}<span className="text-xs text-[var(--paper-muted)] ml-1">积分</span>
            </span>
          </div>
        )}

        {pointsRanking.length === 0 ? (
          <p className="text-sm text-[var(--paper-muted)] text-center py-6">暂无积分数据</p>
        ) : (
          <div className="space-y-1">
            {pointsRanking.slice(0, 10).map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[var(--burgundy-tint)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-[#5C1A1A] text-white' : 'bg-[var(--paper-border)] text-[var(--paper-muted)]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--paper-text)] truncate">
                    {item.name}
                    {item.province && (
                      <span className="text-[var(--paper-muted)] ml-1.5">{item.province} · {item.city || ''}</span>
                    )}
                  </span>
                </div>
                <span className="metric-value text-sm font-semibold text-[#5C1A1A] shrink-0 ml-3">
                  {item.count}<span className="text-xs text-[var(--paper-muted)] ml-1">积分</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
