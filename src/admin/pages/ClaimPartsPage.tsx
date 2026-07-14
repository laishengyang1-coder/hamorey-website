// ============================================================
// ClaimPartsPage — 总部部位报价管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface ClaimPrice { id: string; model_code: string; model_name: string; part_name: string; part_category: string; price_cents: number; effective_from: string; effective_to: string | null; status: string; }
interface ClaimPart { id: string; name: string; category: string; status?: string; }
interface ProductModel { id: string; model_code: string; display_name: string; }

export default function ClaimPartsPage() {
  const [data, setData] = useState<ClaimPrice[]>([]);
  const [parts, setParts] = useState<ClaimPart[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ product_model_id: '', claim_part_id: '', price_cents: 0, effective_from: '', effective_to: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await apiRequest<{ items: ClaimPrice[] }>('/admin/claim-prices'); setData(res.items); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    apiRequest<{ items: ClaimPart[] }>('/admin/claim-parts').then((r) => setParts(r.items)).catch(() => {});
    apiRequest<{ items: ProductModel[] }>('/admin/product-models').then((r) => setModels(r.items)).catch(() => {});
  }, []);

  const openCreate = () => { setForm({ product_model_id: '', claim_part_id: '', price_cents: 0, effective_from: '', effective_to: '' }); setDrawerOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest('/admin/claim-prices', { method: 'POST', body: JSON.stringify(form) });
      setDrawerOpen(false); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const COLUMNS: Column[] = [
    { key: 'model_code', title: '型号', dataIndex: 'model_code' },
    { key: 'part_name', title: '部位', dataIndex: 'part_name' },
    { key: 'price_cents', title: '报价(元)', dataIndex: 'price_cents', render: (v) => `¥${(Number(v) / 100).toFixed(2)}` },
    { key: 'effective_from', title: '生效', dataIndex: 'effective_from', render: (v) => (v as string)?.slice(0, 10) },
    { key: 'effective_to', title: '失效', dataIndex: 'effective_to', render: (v) => v ? (v as string).slice(0, 10) : '永久' },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
  ];

  return (
    <div>
      <PageHeader title="部位报价" description="配置各产品型号×部位的报价" actions={<button onClick={openCreate} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">新增报价</button>} />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} emptyText="暂无报价数据" />
      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="新增报价">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品型号 *</label>
            <select value={form.product_model_id} onChange={(e) => setForm({ ...form, product_model_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">请选择型号</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.model_code} - {m.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">报价部位 *</label>
            <select value={form.claim_part_id} onChange={(e) => setForm({ ...form, claim_part_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">请选择部位</option>
              {parts.filter((p) => p.status === 'active').map((p) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">报价（元）*</label>
            <input type="number" step="0.01" value={form.price_cents / 100} onChange={(e) => setForm({ ...form, price_cents: Math.round(Number(e.target.value) * 100) })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生效日期 *</label>
            <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
            {saving ? '保存中...' : '创建报价'}
          </button>
        </div>
      </DetailDrawer>
    </div>
  );
}
