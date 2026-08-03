// ============================================================
// OrgPointsPage — 组织积分余额（省代/门店）与明细
// 总部实时查看各组织积分情况，点击进入积分明细
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface BalanceItem {
  id: string;
  code: string;
  name: string;
  type: 'PROVINCE' | 'STORE';
  province: string | null;
  city: string | null;
  status: string;
  balance: number;
  awarded: number;
  redeemed: number;
  ledger_count: number;
}

interface LedgerItem {
  id: string;
  organization_id: string;
  organization_name: string;
  change_type: string;
  points_change: number;
  frozen_change: number;
  reason: string | null;
  operator_name: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  award: '奖励',
  deduct: '扣减',
  freeze: '冻结',
  release: '释放',
  adjust: '人工调整',
  revoke: '撤回',
  sync: '同步',
  redeem: '兑换',
  refund: '退回',
};

export default function OrgPointsPage() {
  const [tab, setTab] = useState<'PROVINCE' | 'STORE'>('PROVINCE');
  const [items, setItems] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  // 明细抽屉
  const [detail, setDetail] = useState<BalanceItem | null>(null);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<BalanceItem[]>('/admin/points-ledger?type=balances');
      setItems(res || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const openDetail = async (org: BalanceItem) => {
    setDetail(org);
    setLedger([]);
    setLedgerLoading(true);
    try {
      const res = await apiRequest<{ items: LedgerItem[]; total: number }>(
        `/admin/points-ledger?organization_id=${encodeURIComponent(org.id)}&page=1&pageSize=50`,
      );
      setLedger(res.items || []);
    } catch (_err) {
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const list = items
    .filter((o) => o.type === tab)
    .filter((o) => {
      if (!keyword.trim()) return true;
      const k = keyword.toLowerCase();
      return o.name.toLowerCase().includes(k) || o.code.toLowerCase().includes(k) || (o.province || '').toLowerCase().includes(k);
    });

  const activeCount = list.length;
  const totalBalance = list.reduce((s, o) => s + o.balance, 0);
  const totalAwarded = list.reduce((s, o) => s + o.awarded, 0);
  const totalRedeemed = list.reduce((s, o) => s + o.redeemed, 0);

  return (
    <div>
      <PageHeader title="组织积分" description="省代 / 门店积分余额与变动明细" />

      {/* 顶部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="admin-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-muted)]">{tab === 'PROVINCE' ? '省代数量' : '门店数量'}</div>
          <div className="metric-value text-2xl font-semibold text-[#5C1A1A] leading-none mt-2">{activeCount.toLocaleString()}</div>
        </div>
        <div className="admin-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-muted)]">当前总余额</div>
          <div className="metric-value text-2xl font-semibold text-[#5C1A1A] leading-none mt-2">{totalBalance.toLocaleString()}</div>
        </div>
        <div className="admin-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-muted)]">累计获得</div>
          <div className="metric-value text-2xl font-semibold text-emerald-700 leading-none mt-2">+{totalAwarded.toLocaleString()}</div>
        </div>
        <div className="admin-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--paper-muted)]">累计消耗</div>
          <div className="metric-value text-2xl font-semibold text-red-600 leading-none mt-2">-{totalRedeemed.toLocaleString()}</div>
        </div>
      </div>

      {/* Tab 切换 + 搜索 */}
      <div className="admin-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1 rounded-lg bg-[var(--paper-bg)] p-1">
            {(['PROVINCE', 'STORE'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setKeyword(''); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-[#5C1A1A] text-white' : 'text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                }`}
              >
                {t === 'PROVINCE' ? '省代' : '门店'}
              </button>
            ))}
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索名称 / 编码 / 省份..."
            className="w-full sm:w-64 rounded-lg border border-[var(--paper-border)] bg-white px-3 py-1.5 text-sm text-[var(--paper-text)] focus:outline-none focus:ring-2 focus:ring-[#5C1A1A]/25"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--paper-border-strong)] border-t-[#5C1A1A]" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-[var(--paper-muted)]">{error}</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-[var(--paper-muted)]">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-[var(--paper-muted)] border-b border-[var(--paper-border)]">
                  <th className="py-2 pr-3 font-semibold">编码</th>
                  <th className="py-2 pr-3 font-semibold">名称</th>
                  <th className="py-2 pr-3 font-semibold">省份</th>
                  <th className="py-2 pr-3 font-semibold">城市</th>
                  <th className="py-2 pr-3 font-semibold text-right">当前积分</th>
                  <th className="py-2 pr-3 font-semibold text-right">累计获得</th>
                  <th className="py-2 pr-3 font-semibold text-right">累计消耗</th>
                  <th className="py-2 font-semibold text-right">流水数</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => openDetail(o)}
                    className="cursor-pointer border-b border-[var(--paper-border)]/50 transition-colors hover:bg-[var(--burgundy-tint)]"
                  >
                    <td className="py-2.5 pr-3 text-[var(--paper-muted)] whitespace-nowrap">{o.code}</td>
                    <td className="py-2.5 pr-3 font-medium text-[var(--paper-text)]">{o.name}</td>
                    <td className="py-2.5 pr-3 text-[var(--paper-muted)]">{o.province || '-'}</td>
                    <td className="py-2.5 pr-3 text-[var(--paper-muted)]">{o.city || '-'}</td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className={`font-semibold ${o.balance > 0 ? 'text-[#5C1A1A]' : o.balance < 0 ? 'text-red-600' : 'text-[var(--paper-muted)]'}`}>
                        {o.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-emerald-700">+{o.awarded.toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-right text-red-600">-{o.redeemed.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-[var(--paper-muted)]">{o.ledger_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-[var(--paper-muted)] mt-2">点击任意一行查看该组织积分明细</p>
          </div>
        )}
      </div>

      {/* 积分明细抽屉 */}
      <DetailDrawer open={!!detail} onOpenChange={(v) => { if (!v) setDetail(null); }} title={`积分明细 · ${detail?.name ?? ''}`} width="640px">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-6 rounded-lg bg-[#FBEAEA] px-4 py-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--paper-muted)]">当前积分</div>
                <div className="text-xl font-semibold text-[#5C1A1A]">{detail.balance.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--paper-muted)]">累计获得</div>
                <div className="text-lg font-semibold text-emerald-700">+{detail.awarded.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--paper-muted)]">累计消耗</div>
                <div className="text-lg font-semibold text-red-600">-{detail.redeemed.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--paper-muted)]">流水笔数</div>
                <div className="text-lg font-semibold text-[var(--paper-text)]">{detail.ledger_count.toLocaleString()}</div>
              </div>
            </div>

            {ledgerLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--paper-border-strong)] border-t-[#5C1A1A]" />
              </div>
            ) : ledger.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--paper-muted)]">暂无积分流水</div>
            ) : (
              <div className="space-y-2">
                {ledger.map((l) => (
                  <div key={l.id} className="flex items-start justify-between rounded-lg border border-[var(--paper-border)]/60 px-3 py-2.5">
                    <div className="min-w-0 mr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--paper-text)]">{TYPE_LABELS[l.change_type] || l.change_type}</span>
                        <span className={`text-xs font-semibold ${l.points_change > 0 ? 'text-emerald-700' : l.points_change < 0 ? 'text-red-600' : 'text-[var(--paper-muted)]'}`}>
                          {l.points_change > 0 ? '+' : ''}{l.points_change}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--paper-muted)]">{l.reason || '-'}</div>
                      <div className="mt-0.5 text-[10px] text-[var(--paper-muted)]">
                        {l.created_at ? l.created_at.slice(0, 16).replace('T', ' ') : ''}
                        {l.operator_name ? ` · 操作人: ${l.operator_name}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-[var(--paper-muted)] pt-1">仅展示最近 50 条流水，完整明细请到「积分流水」页按组织筛选查询</p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
