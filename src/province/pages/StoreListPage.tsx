// ============================================================
// Province StoreListPage — 省代管理下属门店
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface Organization {
  id: string;
  code: string;
  name: string;
  province: string | null;
  city: string | null;
  address: string | null;
  contact_name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

const FILTER_FIELDS: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'active', label: '启用' },
    { value: 'suspended', label: '暂停' },
    { value: 'disabled', label: '停用' },
  ]},
  { key: 'keyword', label: '关键词', type: 'text', placeholder: '名称/编码/联系人' },
];

const COLUMNS: Column[] = [
  { key: 'code', title: '编码', dataIndex: 'code', width: '90px', className: 'whitespace-nowrap' },
  { key: 'name', title: '名称', dataIndex: 'name', className: 'max-w-[220px] truncate' },
  { key: 'city', title: '城市', dataIndex: 'city', render: (v) => (v as string) || '-', className: 'whitespace-nowrap' },
  { key: 'contact_name', title: '联系人', dataIndex: 'contact_name', render: (v) => (v as string) || '-', className: 'whitespace-nowrap' },
  { key: 'phone', title: '电话', dataIndex: 'phone', render: (v) => (v as string) || '-', className: 'whitespace-nowrap' },
  { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} />, className: 'whitespace-nowrap' },
];

export default function StoreListPage() {
  const [data, setData] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [form, setForm] = useState({
    code: '', name: '', province: '', city: '', address: '', contact_name: '', phone: '', username: '', password: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (p: number, f: Record<string, string>, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: String(size) });
      const res = await apiRequest<{ items: Organization[]; total: number }>(`/province/organizations?${params}`);
      setData(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters, pageSize); }, [page, filters, pageSize, fetchData]);

  const handleFilter = (values: Record<string, string>) => {
    setFilters(values);
    setPage(1);
  };

  const openCreate = () => {
    setSelected(null);
    setForm({ code: '', name: '', province: '', city: '', address: '', contact_name: '', phone: '', username: '', password: '' });
    setDrawerOpen(true);
  };

  const openEdit = (org: Organization) => {
    setSelected(org);
    setForm({
      code: org.code, name: org.name,
      province: org.province || '', city: org.city || '', address: org.address || '',
      contact_name: org.contact_name || '', phone: org.phone || '', username: '', password: '',
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selected) {
        await apiRequest(`/province/organizations/${selected.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name, province: form.province, city: form.city, address: form.address,
            contact_name: form.contact_name, phone: form.phone,
          }),
        });
      } else {
        await apiRequest('/province/organizations', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setDrawerOpen(false);
      fetchData(page, filters, pageSize);
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="下属门店" description="管理下属授权门店"
        actions={<button onClick={openCreate} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors">新增门店</button>}
      />
      <FilterBar fields={FILTER_FIELDS} onFilter={handleFilter} className="mb-4" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error}
        page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} onRowClick={openEdit} emptyText="暂无门店数据" />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? '编辑门店' : '新增门店'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">编码 *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={!!selected} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">省份</label>
            <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          {!selected && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">登录账号 *</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="off" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">登录密码 *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password" placeholder="至少 8 位" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
            </div>
          )}
          <div className="pt-4 border-t border-gray-100">
            <button onClick={handleSave} disabled={saving || !form.code || !form.name || (!selected && (!form.username || form.password.length < 8))}
              className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors disabled:opacity-50">
              {saving ? '保存中...' : selected ? '保存修改' : '创建门店'}
            </button>
          </div>
        </div>
      </DetailDrawer>
    </div>
  );
}
