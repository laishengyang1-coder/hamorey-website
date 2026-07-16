// ============================================================
// RewardsPage — 总部积分商城商品管理
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiRequest, getToken } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { ProtectedImage } from '../../shared/components/ProtectedImage';

interface Reward { id: string; category: string; name: string; points_required: number; stock_quantity: number | null; stock_status: string; status: string; description: string; sort_order: number; cover_file_key: string | null; }

export default function RewardsPage() {
  const [data, setData] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Reward | null>(null);
  const [form, setForm] = useState({ category: '', name: '', points_required: 100, stock_quantity: 0, description: '', sort_order: 0, cover_file_key: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await apiRequest<{ items: Reward[] }>('/admin/rewards'); setData(res.items); }
    catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setSelected(null); setForm({ category: '', name: '', points_required: 100, stock_quantity: 0, description: '', sort_order: 0, cover_file_key: '' });
    setDrawerOpen(true);
  };
  const openEdit = (r: Reward) => {
    setSelected(r); setForm({ category: r.category || '', name: r.name, points_required: r.points_required, stock_quantity: r.stock_quantity ?? 0, description: r.description || '', sort_order: r.sort_order, cover_file_key: r.cover_file_key || '' });
    setDrawerOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. 获取上传 URL
      const { uploadUrl, fileKey } = await apiRequest<{ uploadUrl: string; fileKey: string }>('/admin/upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name }),
      });
      // 2. 直传 R2
      const formData = new FormData();
      formData.append('file', file);
      const token = getToken();
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!uploadRes.ok) throw new Error('上传失败');
      // 3. 存入 form
      setForm((prev) => ({ ...prev, cover_file_key: fileKey }));
    } catch (err) {
      alert(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, points_required: Number(form.points_required), stock_quantity: Number(form.stock_quantity), sort_order: Number(form.sort_order) };
      if (selected) {
        await apiRequest(`/admin/rewards/${selected.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/admin/rewards', { method: 'POST', body: JSON.stringify(payload) });
      }
      setDrawerOpen(false); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try { await apiRequest(`/admin/rewards/${deletingId}`, { method: 'DELETE' }); setDeletingId(null); fetchData(); }
    catch (err) { alert(err instanceof Error ? err.message : '下架失败'); }
  };

  const COLUMNS: Column[] = [
    { key: 'cover', title: '封面', dataIndex: 'cover_file_key', render: (v) => v ? (
      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100"><ProtectedImage fileKey={v as string} alt="" className="w-full h-full object-cover" /></div>
    ) : <span className="text-xs text-gray-300">无</span> },
    { key: 'name', title: '商品名称', dataIndex: 'name' },
    { key: 'category', title: '分类', dataIndex: 'category' },
    { key: 'points_required', title: '所需积分', dataIndex: 'points_required', render: (v) => String(v) },
    { key: 'stock', title: '库存', dataIndex: 'stock_quantity', render: (v) => v !== null ? String(v) : '不限' },
    { key: 'stock_status', title: '库存状态', dataIndex: 'stock_status', render: (v) => {
      const statusMap: Record<string, string> = { available: '有货', out_of_stock: '售罄', coming_soon: '即将上架' };
      return <StatusBadge status={statusMap[v as string] || (v as string)} />;
    }},
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_, r) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="text-xs text-gray-600 hover:text-gray-900">编辑</button>
        <button onClick={() => setDeletingId(r.id)} className="text-xs text-red-500 hover:text-red-700">下架</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="积分商城" description="管理兑换商品" actions={<button onClick={openCreate} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">新增商品</button>} />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无商品" />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? '编辑商品' : '新增商品'}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">分类</label><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">商品名称 *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">所需积分 *</label><input type="number" value={form.points_required} onChange={(e) => setForm({ ...form, points_required: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">库存数量</label><input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">描述</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图片（1:1 正方形，建议 400×400）</label>
            {form.cover_file_key ? (
              <div className="flex items-start gap-3">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <ProtectedImage fileKey={form.cover_file_key} alt="封面预览" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => setForm({ ...form, cover_file_key: '' })} className="text-xs text-red-500 hover:text-red-700 mt-1">移除图片</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 transition-colors">
                  {uploading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : (
                    <span className="text-gray-400 text-2xl">+</span>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                <span className="text-xs text-gray-400">点击上传 JPG/PNG/WebP</span>
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
        </div>
      </DetailDrawer>

      {deletingId && (
        <ConfirmDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }} title="确认下架" description="下架后该商品不再出现在兑换列表中，确认？" confirmText="下架" variant="danger" onConfirm={handleDelete} />
      )}
    </div>
  );
}
