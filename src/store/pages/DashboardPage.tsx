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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try { setData(await apiRequest<StoreDashboard>('/store/dashboard')); }
      catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    fetchData();
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
    </div>
  );
}
