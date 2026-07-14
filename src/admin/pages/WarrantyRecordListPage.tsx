// ============================================================
// WarrantyRecordListPage — 总部全部质保记录
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface WarrantyRecord {
  id: string; warranty_code: string; certificate_no: string | null;
  customer_name_snapshot: string; customer_phone_snapshot: string; plate_no_snapshot: string;
  vin_snapshot: string | null; vehicle_brand_snapshot: string; vehicle_model_snapshot: string;
  model_name: string; store_name: string; status: string;
  created_at: string; installation_date: string;
}

const FILTER_FIELDS: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'pending', label: '待审核' }, { value: 'active', label: '有效' },
    { value: 'rejected', label: '已驳回' }, { value: 'expired', label: '已过期' },
  ]},
  { key: 'keyword', label: '搜索', type: 'text', placeholder: '姓名/车牌/质保码' },
];

const COLUMNS: Column[] = [
  { key: 'certificate_no', title: '证书编号', dataIndex: 'certificate_no', render: (v) => (v as string) || '-' },
  { key: 'warranty_code', title: '质保码', dataIndex: 'warranty_code' },
  { key: 'customer_name_snapshot', title: '车主', dataIndex: 'customer_name_snapshot' },
  { key: 'plate_no_snapshot', title: '车牌', dataIndex: 'plate_no_snapshot' },
  { key: 'model_name', title: '型号', dataIndex: 'model_name' },
  { key: 'store_name', title: '门店', dataIndex: 'store_name' },
  { key: 'installation_date', title: '施工日期', dataIndex: 'installation_date' },
  { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
];

export default function WarrantyRecordListPage() {
  const [data, setData] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<WarrantyRecord | null>(null);
  const [editForm, setEditForm] = useState({ customer_name: '', customer_phone: '', plate_no: '', vin: '', vehicle_brand: '', vehicle_model: '', installation_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (p: number, f: Record<string, string>) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: '20' });
      const res = await apiRequest<{ items: WarrantyRecord[]; total: number }>(`/admin/warranty-records?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters); }, [page, filters, fetchData]);

  const openEdit = (record: WarrantyRecord) => {
    setEditRecord(record);
    setEditForm({
      customer_name: record.customer_name_snapshot,
      customer_phone: (record as any).customer_phone_snapshot || '',
      plate_no: record.plate_no_snapshot,
      vin: (record as any).vin_snapshot || '',
      vehicle_brand: (record as any).vehicle_brand_snapshot || '',
      vehicle_model: (record as any).vehicle_model_snapshot || '',
      installation_date: record.installation_date,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editRecord) return;
    setSaving(true);
    try {
      await apiRequest(`/admin/warranty-records/${editRecord.id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      setEditOpen(false);
      fetchData(page, filters);
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="质保记录" description="查看所有质保登记记录" />
      <FilterBar fields={FILTER_FIELDS} onFilter={(v) => { setFilters(v); setPage(1); }} className="mb-4" />
      <DataTable
        columns={[...COLUMNS, { key: 'actions', title: '操作', dataIndex: 'id', render: (_v: any, record: any) => (<button onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(record); }} className='text-sm text-[#5C1A1A] hover:text-[#7A2828] font-medium'>编辑</button>) }]}
        data={data as any} loading={loading} error={error} page={page} total={total} onPageChange={setPage} emptyText="暂无质保记录" />

      <DetailDrawer open={editOpen} onOpenChange={setEditOpen} title="编辑质保记录">
        <div className="space-y-4">
          {editRecord && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>质保码: {editRecord.warranty_code}</span>
                <StatusBadge status={editRecord.status} />
                <span>门店: {editRecord.store_name}</span>
              </div>
              {(['customer_name', 'customer_phone', 'plate_no', 'vin', 'vehicle_brand', 'vehicle_model'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {{ customer_name: '车主姓名', customer_phone: '联系电话', plate_no: '车牌号', vin: 'VIN', vehicle_brand: '车辆品牌', vehicle_model: '车辆型号' }[field]}
                  </label>
                  <input value={editForm[field]} onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">施工日期</label>
                <input type="date" value={editForm.installation_date} onChange={(e) => setEditForm({ ...editForm, installation_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
            </>
          )}
          <div className="pt-4 border-t border-gray-100">
            <button onClick={handleSave} disabled={saving}
              className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors disabled:opacity-50">
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>
      </DetailDrawer>
    </div>
  );
}
