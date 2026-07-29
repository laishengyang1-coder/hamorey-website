// ============================================================
// PointsLedgerPage — 总部积分流水+人工调整
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface LedgerItem { id: string; organization_id: string; organization_name: string; change_type: string; points_change: number; frozen_change: number; reason: string | null; operator_name: string | null; created_at: string; }
interface OrgItem { id: string; name: string; type: string; }

const FILTER_FIELDS: FilterField[] = [
  { key: 'change_type', label: '类型', type: 'select', options: [
    { value: 'award', label: '奖励' }, { value: 'deduct', label: '扣减' }, { value: 'freeze', label: '冻结' }, { value: 'release', label: '释放' }, { value: 'adjust', label: '人工调整' },
  ]},
];

const TYPE_LABELS: Record<string, string> = { STORE: '门店', PROVINCE: '省代', HQ_ADMIN: '总部' };

export default function PointsLedgerPage() {
  const [data, setData] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ organization_id: '', points: 0, reason: '' });
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgsLoading, setOrgsLoading] = useState(false);

  const fetchData = useCallback(async (p: number, f: Record<string, string>, size: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: String(size) });
      const res = await apiRequest<{ items: LedgerItem[]; total: number }>(`/admin/points-ledger?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters, pageSize); }, [page, filters, pageSize, fetchData]);

  const fetchOrgs = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const res = await apiRequest<{ items: OrgItem[] }>('/admin/organizations?pageSize=500');
      setOrgs(res.items || []);
    } catch (_err) { setOrgs([]); }
    finally { setOrgsLoading(false); }
  }, []);

  const handleOpenAdjust = () => {
    setAdjustForm({ organization_id: '', points: 0, reason: '' });
    setOrgSearch('');
    setAdjustOpen(true);
    if (orgs.length === 0) fetchOrgs();
  };

  const handleSelectOrg = (org: OrgItem) => {
    setAdjustForm({ ...adjustForm, organization_id: org.id });
    setOrgSearch(`${org.name} (${TYPE_LABELS[org.type] || org.type})`);
  };

  const filteredOrgs = orgs.filter(o => {
    if (!orgSearch.trim()) return true;
    const s = orgSearch.toLowerCase();
    return o.name.toLowerCase().includes(s) || o.id.toLowerCase().includes(s) || (TYPE_LABELS[o.type] || '').includes(s);
  }).slice(0, 30);

  const handleAdjust = async () => {
    if (!adjustForm.organization_id || !adjustForm.points || !adjustForm.reason) { alert('请填写完整信息'); return; }
    setSaving(true);
    try {
      await apiRequest('/admin/points-ledger/adjust', { method: 'POST', body: JSON.stringify(adjustForm) });
      setAdjustOpen(false); fetchData(page, filters, pageSize);
    } catch (err) { alert(err instanceof Error ? err.message : '调整失败'); }
    finally { setSaving(false); }
  };

  const COLUMNS: Column[] = [
    { key: 'organization_name', title: '组织', dataIndex: 'organization_name' },
    { key: 'change_type', title: '类型', dataIndex: 'change_type', render: (v) => {
      const labels: Record<string, string> = { award: '奖励', deduct: '扣减', freeze: '冻结', release: '释放', adjust: '调整', revoke: '撤回' };
      return <StatusBadge status={v as string} label={labels[v as string] || (v as string)} />;
    }},
    { key: 'points_change', title: '积分变动', dataIndex: 'points_change', render: (v) => (
      <span className={Number(v) > 0 ? 'text-emerald-600' : Number(v) < 0 ? 'text-red-600' : 'text-gray-500'}>
        {Number(v) > 0 ? '+' : ''}{v}
      </span>
    )},
    { key: 'reason', title: '原因', dataIndex: 'reason', render: (v) => (v as string) || '-' },
    { key: 'created_at', title: '时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 16) },
  ];

  return (
    <div>
      <PageHeader title="积分流水" description="查看所有组织的积分变动记录" actions={<button onClick={handleOpenAdjust} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">人工调整</button>} />
      <FilterBar fields={FILTER_FIELDS} onFilter={(v) => { setFilters(v); setPage(1); }} className="mb-4" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
      <DetailDrawer open={adjustOpen} onOpenChange={setAdjustOpen} title="人工调整积分">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择组织 *</label>
            <div className="relative">
              <input value={orgSearch} onChange={(e) => { setOrgSearch(e.target.value); setAdjustForm({ ...adjustForm, organization_id: '' }); }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="搜索门店或省代名称..." />
              {orgsLoading && <div className="absolute right-3 top-2.5"><span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" /></div>}
            </div>
            {orgSearch && !adjustForm.organization_id && (
              <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {filteredOrgs.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">无匹配组织</div>
                ) : (
                  filteredOrgs.map(org => (
                    <div key={org.id} onClick={() => handleSelectOrg(org)} className="px-3 py-2 text-sm cursor-pointer hover:bg-amber-50 border-b border-gray-100 last:border-0 flex justify-between">
                      <span>{org.name}</span>
                      <span className="text-gray-400 text-xs">{TYPE_LABELS[org.type] || org.type}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            {adjustForm.organization_id && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm">
                <span className="text-amber-800 font-medium">{orgSearch}</span>
                <button onClick={() => { setAdjustForm({ ...adjustForm, organization_id: '' }); setOrgSearch(''); }} className="text-amber-600 hover:text-amber-800">&times;</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">积分（正数增加，负数扣减）*</label>
            <input type="number" value={adjustForm.points} onChange={(e) => setAdjustForm({ ...adjustForm, points: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调整原因 *</label>
            <textarea value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={3} placeholder="例如：季度活动奖励、投诉补偿等" />
          </div>
          <button onClick={handleAdjust} disabled={saving} className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
            {saving ? '处理中...' : '确认调整'}
          </button>
        </div>
      </DetailDrawer>
    </div>
  );
}
