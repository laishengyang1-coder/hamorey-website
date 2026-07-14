// ============================================================
// ReviewDetailPage — 审核详情+通过/驳回操作
// ============================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

interface WarrantyPhoto { id: string; file_key: string; sort_order: number; }
interface AuditLog { id: string; action: string; from_status: string; to_status: string; note: string | null; operator_name: string; created_at: string; }

interface ReviewDetail {
  record: {
    id: string; certificate_no: string | null; warranty_code: string;
    customer_name_snapshot: string; customer_phone_snapshot: string;
    plate_no_snapshot: string; vin_snapshot: string | null;
    vehicle_brand_snapshot: string; vehicle_model_snapshot: string;
    store_name_snapshot: string; product_name_snapshot: string;
    product_model_snapshot: string; model_name: string;
    warranty_years_snapshot: number; installation_date: string;
    warranty_expiry_date: string | null; status: string;
    current_reject_reason: string | null; submitted_at: string;
  };
  photos: WarrantyPhoto[];
  auditLogs: AuditLog[];
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [operating, setOperating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<ReviewDetail>(`/admin/reviews/${id}`)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setOperating(true);
    try {
      await apiRequest(`/admin/reviews/${id}/approve`, { method: 'POST' });
      navigate('/admin/reviews');
    } catch (err) { alert(err instanceof Error ? err.message : '审核失败'); }
    finally { setOperating(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setOperating(true);
    try {
      await apiRequest(`/admin/reviews/${id}/reject`, {
        method: 'POST', body: JSON.stringify({ reason: rejectReason }),
      });
      navigate('/admin/reviews');
    } catch (err) { alert(err instanceof Error ? err.message : '驳回失败'); }
    finally { setOperating(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>;
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>;
  if (!detail) return <div className="p-12 text-center text-gray-400">记录不存在</div>;

  const { record, photos, auditLogs } = detail;

  const Field = ({ label, value }: { label: string; value: string | null | number }) => (
    <div><span className="text-xs text-gray-500">{label}</span><p className="text-sm text-gray-900 mt-0.5">{value ?? '-'}</p></div>
  );

  return (
    <div>
      <PageHeader title="审核详情" breadcrumb={[{ label: '质保审核', href: '/admin/reviews' }, { label: record.warranty_code }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 质保码信息 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">质保码信息</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="质保码" value={record.warranty_code} />
              <Field label="产品" value={record.product_name_snapshot} />
              <Field label="型号" value={record.product_model_snapshot} />
              <Field label="质保年限" value={`${record.warranty_years_snapshot} 年`} />
            </div>
          </div>

          {/* 车主车辆信息 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">车主与车辆信息</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="车主姓名" value={record.customer_name_snapshot} />
              <Field label="联系电话" value={record.customer_phone_snapshot} />
              <Field label="车牌号" value={record.plate_no_snapshot} />
              <Field label="VIN" value={record.vin_snapshot} />
              <Field label="车辆品牌" value={record.vehicle_brand_snapshot} />
              <Field label="车辆型号" value={record.vehicle_model_snapshot} />
            </div>
          </div>

          {/* 门店与施工信息 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">施工信息</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="施工门店" value={record.store_name_snapshot} />
              <Field label="施工日期" value={record.installation_date} />
              <Field label="提交时间" value={record.submitted_at?.slice(0, 16) || '-'} />
            </div>
          </div>

          {/* 施工照片 */}
          {photos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">施工照片 ({photos.length})</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    照片 {p.sort_order}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 侧栏 */}
        <div className="space-y-6">
          {/* 状态与操作 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">审核操作</h3>
            <div className="mb-3"><StatusBadge status={record.status} /></div>
            {record.current_reject_reason && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">驳回原因：{record.current_reject_reason}</div>
            )}
            {record.status === 'pending' && (
              <div className="space-y-2">
                <button onClick={handleApprove} disabled={operating}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  {operating ? '处理中...' : '审核通过'}
                </button>
                <button onClick={() => setRejectOpen(true)} disabled={operating}
                  className="w-full rounded-lg border border-red-200 bg-white py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                  驳回
                </button>
              </div>
            )}
          </div>

          {/* 审核历史 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">审核历史</h3>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-400">暂无记录</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-px bg-gray-200 shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">
                        {log.action === 'submit' ? '提交审核' : log.action === 'approve' ? '审核通过' : log.action === 'reject' ? '驳回' : log.action === 'resubmit' ? '重新提交' : log.action}
                      </p>
                      {log.note && <p className="text-gray-500 mt-0.5">{log.note}</p>}
                      <p className="text-xs text-gray-400 mt-1">{log.operator_name || '系统'} · {log.created_at?.slice(0, 16)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog open={rejectOpen} onOpenChange={setRejectOpen} title="驳回质保申请" variant="danger"
        confirmText="确认驳回" onConfirm={handleReject} loading={operating}>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因 *</label>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400" rows={3}
            placeholder="请填写驳回原因，门店将看到此内容" />
        </div>
      </ConfirmDialog>
    </div>
  );
}
