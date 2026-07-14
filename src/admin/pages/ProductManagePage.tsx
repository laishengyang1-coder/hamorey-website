// ============================================================
// ProductManagePage — 总部产品管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface Product { id: string; category: string; name_cn: string; name_en: string | null; default_warranty_years: number; status: string; }
interface ProductModel { id: string; product_id: string; product_name?: string; model_code: string; display_name: string; status: string; }

const CATEGORY_LABELS: Record<string, string> = { window_film: '窗膜', ppf: 'PPF', color_ppf: '改色膜', sunroof_film: '天窗膜', architectural_film: '建筑膜' };

export default function ProductManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'models'>('products');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ name_cn: '', category: 'ppf', default_warranty_years: 5, name_en: '' });
  const [modelForm, setModelForm] = useState({ product_id: '', model_code: '', display_name: '' });
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

  const handleCreateProduct = async () => {
    setSaving(true);
    try { await apiRequest('/admin/products', { method: 'POST', body: JSON.stringify(form) }); setDrawerOpen(false); fetchData(); }
    catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const handleCreateModel = async () => {
    setSaving(true);
    try { await apiRequest('/admin/product-models', { method: 'POST', body: JSON.stringify(modelForm) }); setDrawerOpen(false); fetchData(); }
    catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const PRODUCT_COLS: Column[] = [
    { key: 'name_cn', title: '名称', dataIndex: 'name_cn' },
    { key: 'category', title: '类别', dataIndex: 'category', render: (v) => CATEGORY_LABELS[v as string] || (v as string) },
    { key: 'default_warranty_years', title: '默认质保年限', dataIndex: 'default_warranty_years' },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
  ];

  const MODEL_COLS: Column[] = [
    { key: 'product_name', title: '产品', dataIndex: 'product_name' },
    { key: 'model_code', title: '型号编码', dataIndex: 'model_code' },
    { key: 'display_name', title: '显示名称', dataIndex: 'display_name' },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
  ];

  return (
    <div>
      <PageHeader title="产品管理" actions={
        <button onClick={() => { setDrawerOpen(true); if (tab === 'models') setModelForm({ product_id: '', model_code: '', display_name: '' }); else setForm({ name_cn: '', category: 'ppf', default_warranty_years: 5, name_en: '' }); }}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">新增{tab === 'products' ? '产品' : '型号'}</button>
      } />

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(['products', 'models'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'products' ? '产品系列' : '产品型号'}
          </button>
        ))}
      </div>

      {tab === 'products' ? (
        <DataTable columns={PRODUCT_COLS} data={products as any} loading={loading} emptyText="暂无产品" />
      ) : (
        <DataTable columns={MODEL_COLS} data={models as any} loading={loading} emptyText="暂无型号" />
      )}

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={tab === 'products' ? '新增产品' : '新增产品型号'}>
        <div className="space-y-4">
          {tab === 'products' ? (
            <>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label><input value={form.name_cn} onChange={(e) => setForm({ ...form, name_cn: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">类别 *</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">默认质保年限</label><input type="number" value={form.default_warranty_years} onChange={(e) => setForm({ ...form, default_warranty_years: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <button onClick={handleCreateProduct} disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? '创建中...' : '创建产品'}</button>
            </>
          ) : (
            <>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">所属产品 *</label><select value={modelForm.product_id} onChange={(e) => setModelForm({ ...modelForm, product_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">请选择产品</option>{products.filter((p) => p.status === 'active').map((p) => <option key={p.id} value={p.id}>{p.name_cn}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">型号编码 *</label><input value={modelForm.model_code} onChange={(e) => setModelForm({ ...modelForm, model_code: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">显示名称 *</label><input value={modelForm.display_name} onChange={(e) => setModelForm({ ...modelForm, display_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <button onClick={handleCreateModel} disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? '创建中...' : '创建型号'}</button>
            </>
          )}
        </div>
      </DetailDrawer>
    </div>
  );
}
