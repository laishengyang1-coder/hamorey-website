// ============================================================
// Province SubRecordListPage — 省代下属质保记录 + 编辑
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { FilterBar } from '../../shared/components/FilterBar';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface WarrantyRecord { id: string; certificate_no: string | null; warranty_code: string; customer_name_snapshot: string; customer_phone_snapshot: string; plate_no_snapshot: string; vin_snapshot: string | null; vehicle_brand_snapshot: string; vehicle_model_snapshot: string; product_name_snapshot: string; store_name_snapshot: string; installation_date: string; status: string; }

const STATUS_MAP: Record<string, string> = {
  draft: '草稿', pending: '待审核', rejected: '已驳回', active: '已生效', expired: '已过期', voided: '已作废',
};

export default function SubRecordListPage() {
  const [data, setData] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<WarrantyRecord | null>(null);
  const [editForm, setEditForm] = useState({ customer_name: '', customer_phone: '', plate_no: '', vin: '', vehicle_brand: '', vehicle_model: '', installation_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(); if (statusFilter) qs.set('status', statusFilter);
      const res = await apiRequest<{ items: WarrantyRecord[] }>(`/province/warranty-records?${qs}`);
      setData(res.items);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (record: WarrantyRecord) => {
    setEditRecord(record);
    setEditForm({
      customer_name: record.customer_name_snapshot,
      customer_phone: record.customer_phone_snapshot || '',
      plate_no: record.plate_no_snapshot,
      vin: record.vin_snapshot || '',
      vehicle_brand: record.vehicle_brand_snapshot || '',
      vehicle_model: record.vehicle_model_snapshot || '',
      installation_date: record.installation_date,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editRecord) return;
    setSaving(true);
    try {
      await apiRequest(`/province/warranty-records/${editRecord.id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      setEditOpen(false);
      fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const COLUMNS: Column[] = [
    { key: 'certificate_no', title: '证书编号', dataIndex: 'certificate_no' },
    { key: 'customer_name_snapshot', title: '车主', dataIndex: 'customer_name_snapshot' },
    { key: 'plate_no_snapshot', title: '车牌号', dataIndex: 'plate_no_snapshot' },
    { key: 'product_name_snapshot', title: '产品', dataIndex: 'product_name_snapshot' },
    { key: 'store_name_snapshot', title: '施工门店', dataIndex: 'store_name_snapshot' },
    { key: 'installation_date', title: '施工日期', dataIndex: 'installation_date', render: (v) => (v as string)?.slice(0, 10) },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={STATUS_MAP[v as string] || (v as string)} /> },
  ];

  return (
    <div>
      <PageHeader title="下属质保记录" description="查看并编辑下属门店提交的所有质保记录" />
      <FilterBar onSearch={fetchData}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </FilterBar>
      <DataTable
        columns={[...COLUMNS, { key: 'actions', title: '操作', dataIndex: 'id', render: (_v: any, record: any) => (<button onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(record); }} className='text-sm text-[#5C1A1A] hover:text-[#7A2828] font-medium'>编辑</button>) }]}
        data={data as any} loading={loading} error={error} emptyText="暂无质保记录" />

      <DetailDrawer open={editOpen} onOpenChange={setEditOpen} title="编辑质保记录">
        <div className="space-y-4">
          {editRecord && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>质保码: {editRecord.warranty_code}</span>
                <StatusBadge status={STATUS_MAP[editRecord.status] || editRecord.status} />
                <span>门店: {editRecord.store_name_snapshot}</span>
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
