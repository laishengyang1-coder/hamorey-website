// ============================================================
// StarPlanPage — 繁星计划（总部运营活动）
// 活动期配置 + 繁星积分排行榜（省代/门店混排）+ 手动加分 + 加分流水
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface OrgOption {
  id: string;
  name: string;
  code: string;
  type: 'PROVINCE' | 'STORE';
  status: string;
}

interface LeaderItem {
  rank: number;
  id: string;
  name: string;
  code: string;
  type: string;
  province: string | null;
  city: string | null;
  star_points: number;
  task_count: number;
}

interface LedgerItem {
  id: string;
  organization_name: string;
  organization_code: string;
  organization_type: string;
  points_change: number;
  reason: string | null;
  operator_name: string | null;
  created_at: string;
}

const RANK_BADGE: Record<number, { label: string; cls: string }> = {
  1: { label: '🥇', cls: 'bg-amber-100 text-amber-700' },
  2: { label: '🥈', cls: 'bg-slate-200 text-slate-700' },
  3: { label: '🥉', cls: 'bg-orange-100 text-orange-700' },
};

export default function StarPlanPage() {
  const [config, setConfig] = useState({ startDate: '', endDate: '' });
  const [configDraft, setConfigDraft] = useState({ startDate: '', endDate: '' });
  const [savingConfig, setSavingConfig] = useState(false);

  const [leaderboard, setLeaderboard] = useState<LeaderItem[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({ organization_id: '', points: '', remark: '' });
  const [awarding, setAwarding] = useState(false);
  const [message, setMessage] = useState('');

  const loadConfig = useCallback(async () => {
    const res = await apiRequest<{ startDate: string; endDate: string }>('/admin/star-plan?action=config');
    setConfig(res);
    setConfigDraft(res);
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const res = await apiRequest<{ items: LeaderItem[] }>('/admin/star-plan?action=leaderboard');
      setLeaderboard(res.items || []);
    } finally { setLoadingBoard(false); }
  }, []);

  const loadLedger = useCallback(async (p: number) => {
    setLoadingLedger(true);
    try {
      const res = await apiRequest<{ items: LedgerItem[]; total: number }>(`/admin/star-plan?action=points&page=${p}&pageSize=${pageSize}`);
      setLedger(res.items || []);
      setLedgerTotal(res.total || 0);
    } finally { setLoadingLedger(false); }
  }, [pageSize]);

  const loadOrgs = useCallback(async () => {
    try {
      const list = await apiRequest<OrgOption[]>('/admin/points-ledger?type=balances');
      setOrgs((list || []).filter((o) => o.status === 'active'));
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { loadConfig(); loadLeaderboard(); loadLedger(1); loadOrgs(); }, [loadConfig, loadLeaderboard, loadLedger, loadOrgs]);

  const saveConfig = async () => {
    if (!configDraft.startDate || !configDraft.endDate) { setMessage('请填写活动起止日期'); return; }
    setSavingConfig(true);
    setMessage('');
    try {
      await apiRequest('/admin/star-plan', {
        method: 'PUT',
        body: JSON.stringify({ start_date: configDraft.startDate, end_date: configDraft.endDate }),
      });
      await loadConfig();
      await loadLeaderboard();
      setMessage('活动期已更新');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '更新失败');
    } finally { setSavingConfig(false); }
  };

  const submitAward = async () => {
    if (!awardForm.organization_id) { setMessage('请选择组织'); return; }
    if (!awardForm.points || Number(awardForm.points) <= 0) { setMessage('请输入正确的积分数值'); return; }
    setAwarding(true);
    setMessage('');
    try {
      await apiRequest('/admin/star-plan', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: awardForm.organization_id,
          points: Number(awardForm.points),
          remark: awardForm.remark,
        }),
      });
      setDrawerOpen(false);
      setAwardForm({ organization_id: '', points: '', remark: '' });
      await loadLeaderboard();
      await loadLedger(1);
      setMessage('繁星积分已发放');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '发放失败');
    } finally { setAwarding(false); }
  };

  const boardColumns: Column[] = [
    { key: 'rank', title: '排名', dataIndex: 'rank', render: (v) => {
      const r = Number(v);
      const badge = RANK_BADGE[r];
      return (
        <span className={`inline-flex items-center justify-center min-w-[32px] h-7 px-1.5 rounded-full text-xs font-semibold ${badge ? badge.cls : 'bg-gray-100 text-gray-600'}`}>
          {badge ? badge.label : `#${r}`}
        </span>
      );
    }},
    { key: 'name', title: '组织', dataIndex: 'name' },
    { key: 'code', title: '编号', dataIndex: 'code' },
    { key: 'type', title: '类型', dataIndex: 'type', render: (v) => (v === 'PROVINCE' ? '省代' : '门店') },
    { key: 'province', title: '地区', dataIndex: 'province', render: (v, row) => `${(row as LeaderItem).province || ''}${(row as LeaderItem).city ? ' · ' + (row as LeaderItem).city : ''}` },
    { key: 'task_count', title: '任务数', dataIndex: 'task_count' },
    { key: 'star_points', title: '繁星积分', dataIndex: 'star_points', render: (v) => <span className="font-semibold text-[#5C1A1A]">{v as number}</span> },
  ];

  const ledgerColumns: Column[] = [
    { key: 'created_at', title: '时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 16) },
    { key: 'organization_name', title: '组织', dataIndex: 'organization_name' },
    { key: 'organization_type', title: '类型', dataIndex: 'organization_type', render: (v) => (v === 'PROVINCE' ? '省代' : '门店') },
    { key: 'points_change', title: '积分', dataIndex: 'points_change', render: (v) => <span className="font-semibold text-emerald-700">+{v as number}</span> },
    { key: 'reason', title: '备注', dataIndex: 'reason' },
    { key: 'operator_name', title: '操作人', dataIndex: 'operator_name', render: (v) => v || '系统' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="繁星计划" description="省代动员门店（省代自身也参加）在抖音/小红书/视频号发布带 #和膜 视频，每任务 +30 积分；月底按繁星积分排名前三奖励 1000/800/500" />

      {message && <div className="rounded-lg bg-[#5C1A1A]/8 px-4 py-2.5 text-sm text-[#5C1A1A]">{message}</div>}

      {/* 活动期配置 */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">活动期配置</h3>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input type="date" value={configDraft.startDate} onChange={(e) => setConfigDraft({ ...configDraft, startDate: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input type="date" value={configDraft.endDate} onChange={(e) => setConfigDraft({ ...configDraft, endDate: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
          </div>
          <button onClick={saveConfig} disabled={savingConfig}
            className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
            {savingConfig ? '保存中...' : '保存活动期'}
          </button>
          <span className="text-xs text-gray-400">排行榜按此活动期统计繁星积分</span>
        </div>
      </div>

      {/* 排行榜 */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">繁星积分排行榜（省代 + 门店）</h3>
          <button onClick={() => setDrawerOpen(true)}
            className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">
            + 手动加分
          </button>
        </div>
        <DataTable columns={boardColumns} data={leaderboard as any} loading={loadingBoard} emptyText="暂无繁星积分记录" />
      </div>

      {/* 加分流水 */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">加分流水</h3>
        <DataTable
          columns={ledgerColumns}
          data={ledger as any}
          loading={loadingLedger}
          emptyText="暂无流水"
          page={page}
          pageSize={pageSize}
          total={ledgerTotal}
          onPageChange={(p) => { setPage(p); loadLedger(p); }}
        />
      </div>

      {/* 手动加分弹窗 */}
      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="手动发放繁星积分" width="480px">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择组织（省代 / 门店）</label>
            <select value={awardForm.organization_id} onChange={(e) => setAwardForm({ ...awardForm, organization_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none">
              <option value="">请选择组织</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}（{o.type === 'PROVINCE' ? '省代' : '门店'} · {o.code}）</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">积分分值</label>
            <input type="number" min="1" value={awardForm.points} onChange={(e) => setAwardForm({ ...awardForm, points: e.target.value })}
              placeholder="如 30（每次任务）；月底前三 1000/800/500"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注（选填）</label>
            <input value={awardForm.remark} onChange={(e) => setAwardForm({ ...awardForm, remark: e.target.value })}
              placeholder="如：抖音发布 1 条 / 月底第二名"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
            <p className="mt-1 text-xs text-gray-400">流水里将显示为「繁星计划」来源</p>
          </div>
          <button onClick={submitAward} disabled={awarding}
            className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
            {awarding ? '发放中...' : '确认发放'}
          </button>
        </div>
      </DetailDrawer>
    </div>
  );
}
