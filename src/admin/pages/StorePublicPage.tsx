// ============================================================
// StorePublicPage — 总部授权门店公开资料管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { FilterBar } from '../../shared/components/FilterBar';
import { usePagination } from '../../shared/hooks/usePagination';

interface StoreProfile { id: string; organization_id: string; public_name: string; auth_level: string; province: string | null; city: string | null; address: string | null; phone: string | null; is_public: number; org_code: string; org_status: string; }

const AUTH_LEVEL_MAP: Record<string, string> = { HEBC: 'HEBC 认证店', HSS: 'HSS 特约施工中心', Service_Point: '服务点' };

export default function StorePublicPage() {
  const [data, setData] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [province, setProvince] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<StoreProfile | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (province) qs.set('province', province);
      qs.set('page', String(pagination.page)); qs.set('pageSize', String(pagination.pageSize));
      const res = await apiRequest<{ items: StoreProfile[]; total: number }>(`/admin/store-public-profiles?${qs}`);
      setData(res.items); pagination.setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, [province, pagination.page, pagination.pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (r: StoreProfile) => {
    setSelected(r);
    setForm({ public_name: r.public_name, auth_level: r.auth_level, province: r.province || '', city: r.city || '', address: r.address || '', phone: r.phone || '', is_public: r.is_public });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiRequest(`/admin/store-public-profiles/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setDrawerOpen(false); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const COLUMNS: Column[] = [
    { key: 'public_name', title: '门店名称', dataIndex: 'public_name' },
    { key: 'auth_level', title: '授权等级', dataIndex: 'auth_level', render: (v) => AUTH_LEVEL_MAP[v as string] || (v as string) },
    { key: 'province', title: '省份', dataIndex: 'province' },
    { key: 'city', title: '城市', dataIndex: 'city' },
    { key: 'phone', title: '电话', dataIndex: 'phone' },
    { key: 'is_public', title: '公开', dataIndex: 'is_public', render: (v) => <StatusBadge status={v ? '已公开' : '未公开'} /> },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_, r) => (
      <button onClick={() => openEdit(r)} className="text-xs text-gray-600 hover:text-gray-900">编辑</button>
    )},
  ];

  return (
    <div>
      <PageHeader title="授权门店" description="管理官网公开的门店展示资料" />
      <FilterBar onSearch={fetchData}>
        <select value={province} onChange={(e) => { setProvince(e.target.value); pagination.reset(); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">全部省份</option>
          <option value="河北">河北</option><option value="山东">山东</option><option value="北京">北京</option><option value="天津">天津</option><option value="" disabled>---</option>
        </select>
      </FilterBar>
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无门店资料"
        pagination={{ ...pagination, setPage: pagination.setPage }} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="编辑门店资料">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">门店名称</label><input type="text" value={String(form.public_name || '')} onChange={(e) => setForm({ ...form, public_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">授权等级</label>
            <select value={String(form.auth_level || '')} onChange={(e) => setForm({ ...form, auth_level: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="HEBC">HEBC 认证店</option><option value="HSS">HSS 特约施工中心</option><option value="Service_Point">服务点</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">省份</label><input type="text" value={String(form.province || '')} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">城市</label><input type="text" value={String(form.city || '')} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">地址</label><input type="text" value={String(form.address || '')} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">电话</label><input type="text" value={String(form.phone || '')} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked ? 1 : 0 })} className="rounded border-gray-300" /> 在官网公开显示</label>
          <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
        </div>
      </DetailDrawer>
    </div>
  );
}
