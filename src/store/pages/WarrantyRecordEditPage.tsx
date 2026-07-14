// ============================================================
// WarrantyRecordEditPage — 门店驳回后修改重提
// ============================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest, getToken } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { StatusBadge } from '../../shared/components/StatusBadge';

function photoUrl(fileKey: string, token: string): string {
  return `/api/public/photos/${encodeURIComponent(fileKey)}?token=${encodeURIComponent(token)}`;
}

interface WarrantyPhoto { id: string; file_key: string; sort_order: number; }

interface Detail {
  record: {
    id: string; warranty_code: string; customer_name_snapshot: string;
    customer_phone_snapshot: string; plate_no_snapshot: string; vin_snapshot: string | null;
    vehicle_brand_snapshot: string; vehicle_model_snapshot: string;
    installation_date: string; status: string; current_reject_reason: string | null;
    model_name: string;
  };
  photos: WarrantyPhoto[];
}

export default function WarrantyRecordEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', plate_no: '', vin: '',
    vehicle_brand: '', vehicle_model: '', installation_date: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiRequest<Detail>(`/store/warranty-records/${id}`)
      .then((d) => {
        setDetail(d);
        setForm({
          customer_name: d.record.customer_name_snapshot,
          customer_phone: d.record.customer_phone_snapshot,
          plate_no: d.record.plate_no_snapshot,
          vin: d.record.vin_snapshot || '',
          vehicle_brand: d.record.vehicle_brand_snapshot,
          vehicle_model: d.record.vehicle_model_snapshot,
          installation_date: d.record.installation_date,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await apiRequest(`/store/warranty-records/${id}`, { method: 'PUT', body: JSON.stringify(form) });
      navigate('/store/records');
    } catch (err) { setError(err instanceof Error ? err.message : '提交失败'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>;
  if (error && !detail) return <div className="p-12 text-center text-red-500">{error}</div>;
  if (!detail) return <div className="p-12 text-center text-gray-400">记录不存在</div>;

  const { record, photos } = detail;
  const token = getToken() || ''; 
  const isRejected = record.status === 'rejected';

  return (
    <div>
      <PageHeader title={isRejected ? '修改并重新提交' : '质保记录详情'} breadcrumb={[{ label: '我的质保记录', href: '/store/records' }, { label: record.warranty_code }]} />

      {record.current_reject_reason && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4">
          <p className="text-sm font-medium text-red-700">驳回原因</p>
          <p className="mt-1 text-sm text-red-600">{record.current_reject_reason}</p>
        </div>
      )}

      {photos && photos.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">施工照片 ({photos.length})</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photos.map((p) => (
              <a key={p.id} href={photoUrl(p.file_key, token)} target="_blank" rel="noreferrer"
                className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors">
                <img src={photoUrl(p.file_key, token)} alt={`施工照片 ${p.sort_order}`}
                  className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={record.status} />
            <span className="text-sm text-gray-500">型号: {record.model_name}</span>
          </div>

          {(['customer_name', 'customer_phone', 'plate_no', 'vin', 'vehicle_brand', 'vehicle_model'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field === 'customer_name' ? '车主姓名' : field === 'customer_phone' ? '联系电话' : field === 'plate_no' ? '车牌号' : field === 'vin' ? 'VIN' : field === 'vehicle_brand' ? '车辆品牌' : '车辆型号'}
              </label>
              <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                disabled={!isRejected}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">施工日期</label>
            <input type="date" value={form.installation_date} onChange={(e) => setForm({ ...form, installation_date: e.target.value })}
              disabled={!isRejected}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          {isRejected && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/store/records')} className="rounded-lg border px-4 py-2 text-sm">取消</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? '提交中...' : '修改并重新提交'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
