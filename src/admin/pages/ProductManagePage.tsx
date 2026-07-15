// ============================================================
// ProductManagePage — 产品管理（合并产品系列+型号，支持编辑）
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import {
  WINDOW_FILM_MODELS,
  WINDOW_FILM_POSITION_LABELS,
  type WindowFilmModelSpec,
} from '../../config/windowFilm';

interface Product { id: string; category: string; name_cn: string; }
interface ProductModel {
  id: string;
  product_id?: string;
  product_name?: string;
  product_category?: string;
  model_code: string;
  display_name: string;
  warranty_years: number;
  warranty_price_cents: number | null;
  usage_limit: number | null;
  status: string;
}

interface WindowFilmRow extends WindowFilmModelSpec {
  dbModel?: ProductModel;
}

export default function ProductManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductModel | null>(null);
  const [form, setForm] = useState({
    product_id: '',
    model_code: '',
    display_name: '',
    warranty_years: 5,
    warranty_price_yuan: '',
    usage_limit: 1,
  });
  const [saving, setSaving] = useState(false);

  const formatMoney = (cents?: number | null) => (
    cents == null ? '-' : `¥${Math.round(cents / 100).toLocaleString('zh-CN')}`
  );

  const toCents = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
  };

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
    const payload = {
      product_id: form.product_id,
      model_code: form.model_code,
      display_name: form.display_name,
      warranty_years: form.warranty_years,
      warranty_price_cents: toCents(form.warranty_price_yuan),
      usage_limit: Math.max(1, Number(form.usage_limit) || 1),
    };
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/admin/product-models/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        if (!form.product_id) { alert('请选择产品分类'); setSaving(false); return; }
        await apiRequest('/admin/product-models', { method: 'POST', body: JSON.stringify(payload) });
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
      warranty_price_yuan: model.warranty_price_cents == null ? '' : String(model.warranty_price_cents / 100),
      usage_limit: model.usage_limit || 1,
    });
    setDrawerOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ product_id: '', model_code: '', display_name: '', warranty_years: 5, warranty_price_yuan: '', usage_limit: 1 });
    setDrawerOpen(true);
  };

  const COLS: Column[] = [
    { key: 'display_name', title: '产品名称', dataIndex: 'display_name' },
    { key: 'model_code', title: '型号编码', dataIndex: 'model_code' },
    { key: 'product_name', title: '所属分类', dataIndex: 'product_name' },
    { key: 'warranty_years', title: '质保年限', dataIndex: 'warranty_years', render: (v) => `${v}年` },
    { key: 'warranty_price_cents', title: '质保价格', dataIndex: 'warranty_price_cents', render: (v) => formatMoney(v as number | null) },
    { key: 'usage_limit', title: '可使用次数', dataIndex: 'usage_limit', render: (v) => `${v || 1}次` },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_v, record) => (
      <button onClick={() => openEdit(record as unknown as ProductModel)} className="text-sm text-gray-500 hover:text-gray-900 underline">编辑</button>
    ) },
  ];

  const modelByCode = new Map(models.map((model) => [model.model_code, model]));
  const windowRows: WindowFilmRow[] = WINDOW_FILM_MODELS.map((item) => ({
    ...item,
    dbModel: modelByCode.get(item.modelCode),
  }));
  const otherModels = models.filter((model) => model.product_category !== 'window_film');

  const WINDOW_COLS: Column[] = [
    { key: 'seriesName', title: '产品名称', dataIndex: 'seriesName', render: (_v, record) => (
      <div>
        <p className="font-medium text-[var(--paper-text)]">{record.seriesName as string}</p>
        <p className="mt-0.5 text-xs text-[var(--paper-muted)]">{record.seriesPositioning as string}</p>
      </div>
    ) },
    { key: 'glassPosition', title: '适用玻璃', dataIndex: 'glassPosition', render: (v) => (
      <span className="rounded-full bg-[#F6F1ED] px-2.5 py-1 text-xs text-[var(--paper-text-soft)]">
        {WINDOW_FILM_POSITION_LABELS[v as WindowFilmModelSpec['glassPosition']]}
      </span>
    ) },
    { key: 'modelName', title: '型号', dataIndex: 'modelName', render: (_v, record) => (
      <div>
        <p className="font-medium text-[var(--paper-text)]">{record.modelName as string}</p>
        <p className="mt-0.5 font-mono text-xs text-[var(--paper-muted)]">{record.modelCode as string}</p>
      </div>
    ) },
    { key: 'specs', title: '技术参数', render: (_v, record) => (
      <div className="grid min-w-[280px] grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--paper-muted)]">
        <span>透光 {record.visibleLightTransmittance as string}</span>
        <span>紫外 {record.uvRejection as string}</span>
        <span>总阻隔 {record.solarRejection as string}</span>
        <span>厚度 {record.thickness as string}</span>
      </div>
    ) },
    { key: 'warrantyYears', title: '质保', dataIndex: 'warrantyYears', render: (v) => `${v}年` },
    { key: 'warrantyPrice', title: '质保价格', render: (_v, record) => {
      const dbModel = record.dbModel as ProductModel | undefined;
      const fallback = Number(record.warrantyPrice || 0) * 100;
      return formatMoney(dbModel?.warranty_price_cents ?? fallback);
    } },
    { key: 'usageLimit', title: '可使用次数', render: (_v, record) => {
      const dbModel = record.dbModel as ProductModel | undefined;
      const fallback = record.glassPosition === 'front' ? 36 : 18;
      return `${dbModel?.usage_limit || fallback}次`;
    } },
    { key: 'status', title: '状态', render: (_v, record) => (
      record.dbModel
        ? <StatusBadge status={(record.dbModel as ProductModel).status} />
        : <StatusBadge status="inactive" label="待同步" />
    ) },
    { key: 'actions', title: '操作', render: (_v, record) => (
      record.dbModel
        ? <button onClick={() => openEdit(record.dbModel as ProductModel)} className="text-sm text-gray-500 hover:text-gray-900 underline">编辑</button>
        : <span className="text-xs text-gray-400">待迁移</span>
    ) },
  ];

  return (
    <div>
      <PageHeader title="产品管理" description="管理产品型号与质保年限" actions={
        <button onClick={openNew} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">新增产品</button>
      } />

      <div className="mb-6">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[var(--paper-text)]">窗膜型号</h2>
          <p className="mt-1 text-sm text-[var(--paper-muted)]">按价格表拆分前挡和侧挡，并维护质保价格与质保码可使用次数。</p>
        </div>
        <DataTable columns={WINDOW_COLS} data={windowRows as any} loading={loading} emptyText="暂无窗膜型号" />
      </div>

      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[var(--paper-text)]">其他产品型号</h2>
        </div>
        <DataTable columns={COLS} data={otherModels as any} loading={loading} emptyText="暂无产品型号" />
      </div>

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">质保价格（元）</label>
            <input type="number" min={0} step={1} value={form.warranty_price_yuan} onChange={(e) => setForm({ ...form, warranty_price_yuan: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="如: 16800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">可使用次数 *</label>
            <input type="number" min={1} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
            {saving ? '保存中...' : editing ? '保存修改' : '创建产品'}
          </button>
        </div>
      </DetailDrawer>
    </div>
  );
}
