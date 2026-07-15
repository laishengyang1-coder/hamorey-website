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
import { ProtectedImage } from '../../shared/components/ProtectedImage';

interface PhotoItem { id: string; file_key: string; sort_order: number; }

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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<{ record: any; photos: PhotoItem[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);


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

  const openDetail = async (record: WarrantyRecord) => {
    setDetailLoading(true);
    try {
      const res = await apiRequest<{ record: any; photos: PhotoItem[] }>(`/admin/warranty-records/${record.id}`);
      setDetail(res);
      setDetailOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载详情失败');
    }
    finally { setDetailLoading(false); }
  };

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

  const handleDelete = async (record: WarrantyRecord) => {
    const ok = window.confirm(
      `确定要删除该质保记录吗？\n\n车主：${record.customer_name_snapshot}　车牌：${record.plate_no_snapshot}\n质保码：${record.warranty_code}\n\n删除后将同时清除：施工照片、质保证书、审核记录及本条质保发放的积分，且门店、代理商、小程序等所有端都将不再显示。此操作不可恢复！`
    );
    if (!ok) return;
    setDeletingId(record.id);
    try {
      await apiRequest(`/admin/warranty-records/${record.id}`, { method: 'DELETE' });
      // 若当前页删空且非第一页，回退一页
      if (data.length === 1 && page > 1) setPage(page - 1);
      else fetchData(page, filters);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="质保记录" description="查看所有质保登记记录" />
      <FilterBar fields={FILTER_FIELDS} onFilter={(v) => { setFilters(v); setPage(1); }} className="mb-4" />
      <DataTable
        columns={[...COLUMNS, { key: 'actions', title: '操作', dataIndex: 'id', render: (_v: any, record: any) => (
          <div className="flex items-center gap-3">
            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(record); }} className='text-sm text-[#5C1A1A] hover:text-[#7A2828] font-medium'>编辑</button>
            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(record); }} disabled={deletingId === record.id} className='text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50'>{deletingId === record.id ? '删除中...' : '删除'}</button>
          </div>
        ) }]}
        data={data as any} loading={loading} error={error} page={page} total={total} onPageChange={setPage}
        onRowClick={(record: any) => openDetail(record)}
        emptyText="暂无质保记录" />

      <DetailDrawer open={detailOpen} onOpenChange={setDetailOpen} title="质保详情">
        {detailLoading ? (
          <div className="flex items-center justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <StatusBadge status={detail.record.status} />
              <span>证书: {detail.record.certificate_no || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['质保码', detail.record.warranty_code], ['车主', detail.record.customer_name_snapshot],
                ['电话', detail.record.customer_phone_snapshot], ['车牌', detail.record.plate_no_snapshot],
                ['VIN', detail.record.vin_snapshot || '-'], ['品牌', detail.record.vehicle_brand_snapshot],
                ['型号', detail.record.vehicle_model_snapshot || detail.record.model_name],
                ['门店', detail.record.store_name_snapshot || detail.record.store_name],
                ['施工日期', detail.record.installation_date?.slice(0, 10)],
                ['质保到期', detail.record.warranty_expiry_date?.slice(0, 10) || '-'],
                ['质保年限', `${detail.record.warranty_years_snapshot || '-'} 年`],
              ].map(([label, val]) => (
                <div key={label as string}><span className="text-xs text-gray-500">{label}</span><p className="text-sm text-gray-900 mt-0.5">{val as string}</p></div>
              ))}
            </div>
            {detail.photos && detail.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">施工照片 ({detail.photos.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {detail.photos.map((p) => (
                    <ProtectedImage key={p.id} fileKey={p.file_key} alt={`施工照片 ${p.sort_order}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DetailDrawer>

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
