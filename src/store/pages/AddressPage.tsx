// ============================================================
// Store AddressPage — 门店收货地址管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface Address { id: string; recipient_name: string; phone: string; province: string; city: string; district: string | null; detail_address: string; is_default: number; }

export default function AddressPage() {
  const [data, setData] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Address | null>(null);
  const [form, setForm] = useState({ recipient_name: '', phone: '', province: '', city: '', district: '', detail_address: '', is_default: false });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await apiRequest<{ items: Address[] }>('/store/addresses'); setData(res.items); }
    catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setSelected(null); setForm({ recipient_name: '', phone: '', province: '', city: '', district: '', detail_address: '', is_default: false }); setDrawerOpen(true); };
  const openEdit = (a: Address) => { setSelected(a); setForm({ recipient_name: a.recipient_name, phone: a.phone, province: a.province, city: a.city, district: a.district || '', detail_address: a.detail_address, is_default: a.is_default === 1 }); setDrawerOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selected) {
        await apiRequest(`/store/addresses/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiRequest('/store/addresses', { method: 'POST', body: JSON.stringify(form) });
      }
      setDrawerOpen(false); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await apiRequest(`/store/addresses/${deleteId}`, { method: 'DELETE' }); setDeleteId(null); fetchData(); }
    catch (err) { alert(err instanceof Error ? err.message : '删除失败'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>;
  if (error) return <div className="text-center py-16 text-gray-500"><p>{error}</p></div>;

  return (
    <div>
      <PageHeader title="收货地址" description="管理兑换商品的收货地址" actions={<button onClick={openCreate} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">新增地址</button>} />
      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">暂无收货地址，请点击上方新增</div>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between">
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{a.recipient_name}</span>
                  <span className="text-gray-500">{a.phone}</span>
                  {a.is_default === 1 && <span className="rounded bg-gray-900 px-1.5 py-0.5 text-xs text-white">默认</span>}
                </div>
                <p className="text-gray-500">{a.province} {a.city} {a.district || ''} {a.detail_address}</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(a)} className="text-xs text-gray-600 hover:text-gray-900">编辑</button>
                <button onClick={() => setDeleteId(a.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? '编辑地址' : '新增地址'}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">收件人 *</label><input type="text" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">电话 *</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">省份 *</label><input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">城市 *</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">区/县</label><input type="text" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">详细地址 *</label><input type="text" value={form.detail_address} onChange={(e) => setForm({ ...form, detail_address: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded border-gray-300" /> 设为默认地址</label>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
        </div>
      </DetailDrawer>

      {deleteId && (
        <ConfirmDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }} title="删除地址" description="确认删除该收货地址？" confirmText="删除" variant="danger" onConfirm={handleDelete} />
      )}
    </div>
  );
}
