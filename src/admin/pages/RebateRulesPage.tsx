// ============================================================
// RebateRulesPage — 总部返利规则管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface RebateRule { id: string; product_model_id: string | null; model_code: string | null; model_name: string | null; rebate_ratio: number; is_global: number; effective_from: string; effective_to: string | null; status: string; }

export default function RebateRulesPage() {
  const [data, setData] = useState<RebateRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<RebateRule | null>(null);
  const [form, setForm] = useState({ product_model_id: '', rebate_ratio: 0.1, is_global: false, effective_from: '', effective_to: '' });
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState<Array<{ id: string; display_name: string }>>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await apiRequest<{ items: RebateRule[] }>('/admin/rebate-rules'); setData(res.items); }
    catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    apiRequest<{ items: Array<{ id: string; display_name: string }> }>('/admin/product-models').then((r) => setModels(r.items)).catch(() => {});
  }, []);

  const openCreate = () => { setSelected(null); setForm({ product_model_id: '', rebate_ratio: 0.1, is_global: false, effective_from: '', effective_to: '' }); setDrawerOpen(true); };

  const COLUMNS: Column[] = [
    { key: 'model_name', title: '型号', dataIndex: 'model_name', render: (v, r) => r.is_global ? '全局' : (v as string) },
    { key: 'rebate_ratio', title: '返利比例', dataIndex: 'rebate_ratio', render: (v) => `${(Number(v) * 100).toFixed(0)}%` },
    { key: 'effective_from', title: '生效日期', dataIndex: 'effective_from', render: (v) => (v as string)?.slice(0, 10) },
    { key: 'effective_to', title: '失效日期', dataIndex: 'effective_to', render: (v) => v ? (v as string).slice(0, 10) : '长期' },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, rebate_ratio: Number(form.rebate_ratio), product_model_id: form.is_global ? null : form.product_model_id || null };
      if (selected) {
        await apiRequest(`/admin/rebate-rules/${selected.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/admin/rebate-rules', { method: 'POST', body: JSON.stringify(payload) });
      }
      setDrawerOpen(false); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="返利规则" description="配置省代返利比例" actions={<button onClick={openCreate} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">新增规则</button>} />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无返利规则" />
      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? '编辑返利规则' : '新增返利规则'}>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_global} onChange={(e) => setForm({ ...form, is_global: e.target.checked })}
              disabled={!!selected} className="rounded border-gray-300" /> 全局规则（适用所有型号）
          </label>
          {!form.is_global && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品型号</label>
              <select value={form.product_model_id} onChange={(e) => setForm({ ...form, product_model_id: e.target.value })} disabled={!!selected}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50">
                <option value="">请选择型号</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">返利比例 (0-1)</label>
            <input type="number" step="0.01" min="0" max="1" value={form.rebate_ratio} onChange={(e) => setForm({ ...form, rebate_ratio: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生效日期 *</label>
            <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">失效日期（留空长期有效）</label>
            <input type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </DetailDrawer>
    </div>
  );
}
