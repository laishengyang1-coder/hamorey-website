// ============================================================
// PointsRulesPage — 总部积分规则管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface PointsRule { id: string; product_model_id: string; model_code: string; model_name: string; points: number; effective_from: string; effective_to: string | null; status: string; }

export default function PointsRulesPage() {
  const [data, setData] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<PointsRule | null>(null);
  const [form, setForm] = useState({ product_model_id: '', points: 0, effective_from: '', effective_to: '' });
  const [permanent, setPermanent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState<Array<{ id: string; model_code: string; display_name: string }>>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ items: PointsRule[] }>('/admin/points-rules');
      setData(res.items);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    apiRequest<{ items: Array<{ id: string; model_code: string; display_name: string }> }>('/admin/product-models').then((r) => setModels(r.items)).catch(() => {});
  }, []);

  const openCreate = () => { setSelected(null); setForm({ product_model_id: '', points: 0, effective_from: '', effective_to: '' }); setPermanent(false); setDrawerOpen(true); };
  const openEdit = (rule: PointsRule) => { setSelected(rule); setForm({ product_model_id: rule.product_model_id, points: rule.points, effective_from: rule.effective_from?.slice(0, 10) || '', effective_to: rule.effective_to?.slice(0, 10) || '' }); setPermanent(!rule.effective_to); setDrawerOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selected) {
        await apiRequest(`/admin/points-rules/${selected.id}`, { method: 'PUT', body: JSON.stringify({ ...form, effective_to: permanent ? null : form.effective_to }) });
      } else {
        await apiRequest('/admin/points-rules', { method: 'POST', body: JSON.stringify({ ...form, effective_to: permanent ? null : form.effective_to }) });
      }
      setDrawerOpen(false); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const COLUMNS: Column[] = [
    { key: 'model_name', title: '型号', dataIndex: 'model_name' },
    { key: 'points', title: '积分', dataIndex: 'points' },
    { key: 'effective_from', title: '生效日期', dataIndex: 'effective_from', render: (v) => (v as string)?.slice(0, 10) },
    { key: 'effective_to', title: '失效日期', dataIndex: 'effective_to', render: (v) => v ? (v as string).slice(0, 10) : '永久' },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
  ];

  return (
    <div>
      <PageHeader title="积分规则" description="配置不同产品型号的积分奖励规则" actions={<button onClick={openCreate} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">新增规则</button>} />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} onRowClick={openEdit} emptyText="暂无积分规则" />
      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? '编辑积分规则' : '新增积分规则'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品型号 *</label>
            <select value={form.product_model_id} onChange={(e) => setForm({ ...form, product_model_id: e.target.value })}
              disabled={!!selected} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50">
              <option value="">请选择型号</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.model_code} - {m.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">积分 *</label>
            <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生效日期 *</label>
            <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">失效日期</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="permanent" checked={permanent} onChange={(e) => setPermanent(e.target.checked)}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-400" />
              <label htmlFor="permanent" className="text-sm text-gray-600">长期有效</label>
            </div>
            {!permanent && (
              <input type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </DetailDrawer>
    </div>
  );
}
