// ============================================================
// ProductManagePage — 产品管理（合并产品系列+型号，支持编辑）
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface Product { id: string; category: string; name_cn: string; }
interface ProductModel { id: string; product_id?: string; product_name?: string; model_code: string; display_name: string; warranty_years: number; status: string; }

export default function ProductManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductModel | null>(null);
  const [form, setForm] = useState({ product_id: '', model_code: '', display_name: '', warranty_years: 5 });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        apiRequest<{ items: Product[] }>('/admin/products'),
        apiRequest<{ items: ProductModel[] }>('/admin/product-models'),
      ]);
      setProducts(p.items); setModels(m.items);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.model_code || !form.display_name) { alert('请填写必填字段'); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/admin/product-models/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        if (!form.product_id) { alert('请选择产品分类'); setSaving(false); return; }
        await apiRequest('/admin/product-models', { method: 'POST', body: JSON.stringify(form) });
      }
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const openEdit = (model: ProductModel) => {
    setEditing(model);
    setForm({
      product_id: model.product_id || '',
      model_code: model.model_code,
      display_name: model.display_name,
      warranty_years: model.warranty_years || 5,
    });
    setDrawerOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ product_id: '', model_code: '', display_name: '', warranty_years: 5 });
    setDrawerOpen(true);
  };

  const COLS: Column[] = [
    { key: 'display_name', title: '产品名称', dataIndex: 'display_name' },
    { key: 'model_code', title: '型号编码', dataIndex: 'model_code' },
    { key: 'product_name', title: '所属分类', dataIndex: 'product_name' },
    { key: 'warranty_years', title: '质保年限', dataIndex: 'warranty_years', render: (v) => `${v}年` },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_v, record) => (
      <button onClick={() => openEdit(record as unknown as ProductModel)} className="text-sm text-gray-500 hover:text-gray-900 underline">编辑</button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="产品管理" description="管理产品型号与质保年限" actions={
        <button onClick={openNew} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">新增产品</button>
      } />

      <DataTable columns={COLS} data={models as any} loading={loading} emptyText="暂无产品型号" />

      <DetailDrawer open={drawerOpen} onOpenChange={(v) => { setDrawerOpen(v); if (!v) setEditing(null); }} title={editing ? '编辑产品' : '新增产品'}>
        <div className="space-y-4">
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品分类 *</label>
              <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">请选择分类</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name_cn}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
            <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="如: 和光70" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">型号编码 *</label>
            <input value={form.model_code} onChange={(e) => setForm({ ...form, model_code: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="如: WL-70" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">质保年限 *</label>
            <input type="number" min={1} max={15} value={form.warranty_years} onChange={(e) => setForm({ ...form, warranty_years: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
            {saving ? '保存中...' : editing ? '保存修改' : '创建产品'}
          </button>
        </div>
      </DetailDrawer>
    </div>
  );
}
