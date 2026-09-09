// ============================================================
// FilmExchangePage — 换膜无忧审核（列表 + 详情抽屉 + 审核操作）
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, getToken } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

// ------------------------------------------------------------
// 类型
// ------------------------------------------------------------

interface FilmExchangeItem {
  id: string;
  store_id: string;
  store_name_snapshot: string;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  plate_no_snapshot: string | null;
  product_model_snapshot: string;
  product_name_snapshot: string;
  film_type: string | null;
  damage_part: string | null;
  description: string | null;
  status: string;
  compensate_type: 'free' | 'charge' | null;
  charge_amount: number | null;
  review_note: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface FilmExchangeRecord extends FilmExchangeItem {
  certificate_no: string | null;
  warranty_expiry_date: string | null;
  installation_date: string | null;
  vehicle_brand_snapshot: string | null;
  vehicle_model_snapshot: string | null;
  vin_snapshot: string | null;
  warranty_code: string | null;
  store_name: string | null;
}

interface FilmExchangeMedia {
  id: string;
  file_key: string;
  media_type: 'image' | 'video';
  sort_order: number;
  created_at: string;
}

interface FilmExchangeDetail {
  record: FilmExchangeRecord;
  media: FilmExchangeMedia[];
}

// ------------------------------------------------------------
// 展示辅助
// ------------------------------------------------------------

const FILM_TYPE_MAP: Record<string, string> = {
  ppf: '车衣',
  paint_protection: '车衣',
  window: '窗膜',
  window_film: '窗膜',
};

const filmTypeLabel = (v: string | null | undefined) => (v ? (FILM_TYPE_MAP[v] ?? v) : '-');

const fmtTime = (v: string | null | undefined) => (v ? String(v).slice(0, 16) : '-');
const fmtDate = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : '-');
const fmtAmount = (v: number | null | undefined) => (v != null ? `¥${Number(v).toFixed(2)}` : '-');

function compensateLabel(item: { compensate_type: string | null; charge_amount: number | null }) {
  if (item.compensate_type === 'free') return '免费补膜';
  if (item.compensate_type === 'charge') return `收费补膜 ${fmtAmount(item.charge_amount)}`;
  return '-';
}

// ------------------------------------------------------------
// 受保护媒体（图片 + 视频）：带 Authorization 拉 blob → objectURL
// ------------------------------------------------------------

async function fetchProtectedMedia(fileKey: string): Promise<Blob> {
  const token = getToken();
  const encodedKey = fileKey.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`/api/public/photos/${encodedKey}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`媒体加载失败 (${res.status})`);
  return res.blob();
}

function ProtectedMedia({ fileKey, mediaType, alt }: { fileKey: string; mediaType: 'image' | 'video'; alt: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let nextUrl: string | null = null;
    setObjectUrl(null);
    setFailed(false);

    fetchProtectedMedia(fileKey)
      .then((blob) => {
        nextUrl = URL.createObjectURL(blob);
        if (active) setObjectUrl(nextUrl);
        else URL.revokeObjectURL(nextUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [fileKey]);

  const placeholder = (
    <span className="px-2 text-center text-xs text-gray-400">{failed ? '加载失败' : '加载中...'}</span>
  );

  if (mediaType === 'video') {
    return (
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-100">
        {objectUrl ? (
          <video controls src={objectUrl} className="h-full w-full object-contain" />
        ) : (
          placeholder
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => objectUrl && setPreviewOpen(true)}
        className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-100 transition-colors hover:border-gray-300"
      >
        {objectUrl ? (
          <img src={objectUrl} alt={alt} className="h-full w-full object-cover" />
        ) : (
          placeholder
        )}
      </button>
      {previewOpen && objectUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setPreviewOpen(false)}
        >
          <img src={objectUrl} alt={alt} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------
// 页面
// ------------------------------------------------------------

const FILTER_FIELDS: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '待发货' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已驳回' },
  ]},
  { key: 'keyword', label: '搜索', type: 'text', placeholder: '客户/手机号/车牌/门店' },
];

type ActionType = 'approve-free' | 'approve-charge' | 'reject' | 'ship' | 'complete';

export default function FilmExchangePage() {
  const [data, setData] = useState<FilmExchangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<Record<string, string>>({ status: 'pending' });

  // 详情抽屉
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FilmExchangeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 审核操作
  const [action, setAction] = useState<ActionType | null>(null);
  const [operating, setOperating] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async (p: number, f: Record<string, string>, size: number) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: String(size) });
      const res = await apiRequest<{ items: FilmExchangeItem[]; total: number }>(`/admin/film-exchange?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters, pageSize); }, [page, filters, pageSize, fetchData]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true); setDetailError(null);
    try {
      const d = await apiRequest<FilmExchangeDetail>(`/admin/film-exchange/${id}`);
      setDetail(d);
    } catch (err) { setDetailError(err instanceof Error ? err.message : '加载失败'); }
    finally { setDetailLoading(false); }
  }, []);

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailOpen(true);
    fetchDetail(id);
  };

  const closeAction = () => {
    setAction(null);
    setChargeAmount('');
    setReviewNote('');
    setRejectReason('');
  };

  const handleConfirm = async () => {
    if (!action || !detailId) return;
    if (action === 'approve-charge') {
      const amount = Number(chargeAmount);
      if (!Number.isFinite(amount) || amount <= 0) return;
    }
    if (action === 'reject' && !rejectReason.trim()) return;

    setOperating(true);
    try {
      if (action === 'approve-free') {
        await apiRequest(`/admin/film-exchange/${detailId}/approve`, {
          method: 'POST',
          body: JSON.stringify({ compensate_type: 'free' }),
        });
      } else if (action === 'approve-charge') {
        await apiRequest(`/admin/film-exchange/${detailId}/approve`, {
          method: 'POST',
          body: JSON.stringify({
            compensate_type: 'charge',
            charge_amount: Number(chargeAmount),
            review_note: reviewNote.trim() || undefined,
          }),
        });
      } else if (action === 'reject') {
        await apiRequest(`/admin/film-exchange/${detailId}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason: rejectReason.trim() }),
        });
      } else if (action === 'ship') {
        await apiRequest(`/admin/film-exchange/${detailId}/ship`, { method: 'POST' });
      } else if (action === 'complete') {
        await apiRequest(`/admin/film-exchange/${detailId}/complete`, { method: 'POST' });
      }
      closeAction();
      fetchDetail(detailId);
      fetchData(page, filters, pageSize);
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setOperating(false);
    }
  };

  const COLUMNS: Column[] = [
    { key: 'customer_name_snapshot', title: '客户', dataIndex: 'customer_name_snapshot', className: 'whitespace-nowrap' },
    { key: 'customer_phone_snapshot', title: '手机号', dataIndex: 'customer_phone_snapshot', className: 'whitespace-nowrap' },
    { key: 'plate_no_snapshot', title: '车牌', dataIndex: 'plate_no_snapshot', className: 'whitespace-nowrap', render: (v) => (v ? String(v) : '临时车牌') },
    { key: 'product_model_snapshot', title: '膜型号', dataIndex: 'product_model_snapshot', className: 'max-w-[140px] truncate' },
    { key: 'film_type', title: '车衣/窗膜', dataIndex: 'film_type', className: 'whitespace-nowrap', render: (v) => filmTypeLabel(v as string | null) },
    { key: 'store_name_snapshot', title: '门店', dataIndex: 'store_name_snapshot', className: 'max-w-[140px] truncate' },
    { key: 'compensate_type', title: '补偿方式', dataIndex: 'compensate_type', className: 'whitespace-nowrap', render: (_, record) => compensateLabel(record as FilmExchangeItem) },
    { key: 'status', title: '状态', dataIndex: 'status', className: 'whitespace-nowrap', render: (v) => (
      <StatusBadge status={v as string} label={v === 'approved' ? '待发货' : undefined} />
    )},
    { key: 'created_at', title: '提交时间', dataIndex: 'created_at', className: 'whitespace-nowrap', render: (v) => fmtTime(v as string) },
  ];

  const record = detail?.record ?? null;
  const media = detail?.media ?? [];

  const Field = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div><span className="text-xs text-gray-500">{label}</span><p className="mt-0.5 text-sm text-gray-900">{value ?? '-'}</p></div>
  );

  return (
    <div>
      <PageHeader title="换膜无忧" description="审核门店提交的换膜无忧补膜申请" />
      <FilterBar fields={FILTER_FIELDS} onFilter={(v) => { setFilters(v); setPage(1); }} initialValues={filters} className="mb-4" />
      <DataTable
        columns={COLUMNS} data={data as unknown as Record<string, unknown>[]} loading={loading} error={error}
        page={page} pageSize={pageSize} total={total}
        onPageChange={setPage} onPageSizeChange={setPageSize}
        onRowClick={(r) => openDetail(r.id as string)} emptyText="暂无换膜无忧申请"
      />

      {/* 详情抽屉 */}
      <DetailDrawer open={detailOpen} onOpenChange={setDetailOpen} title="换膜无忧申请详情" width="720px">
        {detailLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : detailError ? (
          <div className="py-12 text-center text-sm text-red-500">{detailError}</div>
        ) : record ? (
          <div className="space-y-6">
            {/* 客户与车辆 */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">客户与车辆</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="客户姓名" value={record.customer_name_snapshot} />
                <Field label="手机号" value={record.customer_phone_snapshot} />
                <Field label="车牌号" value={record.plate_no_snapshot || '临时车牌'} />
                <Field label="车辆品牌" value={record.vehicle_brand_snapshot} />
                <Field label="车辆型号" value={record.vehicle_model_snapshot} />
                <Field label="VIN" value={record.vin_snapshot} />
              </div>
            </div>

            {/* 质保信息 */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">质保信息</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="质保码" value={record.warranty_code} />
                <Field label="证书号" value={record.certificate_no} />
                <Field label="产品" value={record.product_name_snapshot} />
                <Field label="膜型号" value={record.product_model_snapshot} />
                <Field label="施工日期" value={fmtDate(record.installation_date)} />
                <Field label="质保到期" value={fmtDate(record.warranty_expiry_date)} />
                <Field label="施工门店" value={record.store_name || record.store_name_snapshot} />
              </div>
            </div>

            {/* 损坏情况 */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">损坏情况</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="膜类型" value={filmTypeLabel(record.film_type)} />
                <Field label="损坏部位" value={record.damage_part} />
                <Field label="提交时间" value={fmtTime(record.created_at)} />
              </div>
              {record.description && (
                <div className="mt-4">
                  <span className="text-xs text-gray-500">损坏说明</span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{record.description}</p>
                </div>
              )}
            </div>

            {/* 照片 / 视频 */}
            {media.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">照片与视频 ({media.length})</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[...media].sort((a, b) => a.sort_order - b.sort_order).map((m) => (
                    <ProtectedMedia
                      key={m.id}
                      fileKey={m.file_key}
                      mediaType={m.media_type}
                      alt={`${m.media_type === 'video' ? '视频' : '照片'} ${m.sort_order}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 审核信息 */}
            {record.status !== 'pending' && (
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">审核信息</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field label="补偿方式" value={compensateLabel(record)} />
                  {record.compensate_type === 'charge' && <Field label="收费金额" value={fmtAmount(record.charge_amount)} />}
                  <Field label="更新时间" value={fmtTime(record.updated_at)} />
                </div>
                {record.review_note && (
                  <div className="mt-4">
                    <span className="text-xs text-gray-500">审核备注</span>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{record.review_note}</p>
                  </div>
                )}
                {record.reject_reason && (
                  <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">驳回原因：{record.reject_reason}</div>
                )}
              </div>
            )}

            {/* 审核操作 */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">审核操作</h3>
              <div className="mb-3">
                <StatusBadge status={record.status} label={record.status === 'approved' ? '待发货' : undefined} />
              </div>
              {record.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAction('approve-free')} disabled={operating}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    免费补膜通过
                  </button>
                  <button onClick={() => setAction('approve-charge')} disabled={operating}
                    className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
                    收费补膜通过
                  </button>
                  <button onClick={() => setAction('reject')} disabled={operating}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                    驳回
                  </button>
                </div>
              )}
              {record.status === 'approved' && (
                <button onClick={() => setAction('ship')} disabled={operating}
                  className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
                  标记发货
                </button>
              )}
              {record.status === 'shipped' && (
                <button onClick={() => setAction('complete')} disabled={operating}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  标记完成
                </button>
              )}
              {(record.status === 'completed' || record.status === 'rejected') && (
                <p className="text-sm text-gray-400">该申请已{record.status === 'completed' ? '完成' : '驳回'}，无需进一步操作。</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">记录不存在</div>
        )}
      </DetailDrawer>

      {/* 免费补膜通过 */}
      <ConfirmDialog
        open={action === 'approve-free'} onOpenChange={(v) => { if (!v) closeAction(); }}
        title="确认免费补膜通过"
        description="通过后将为门店免费补发膜料，申请进入待发货状态。"
        confirmText="确认通过" onConfirm={handleConfirm} loading={operating}
      />

      {/* 收费补膜通过 */}
      <ConfirmDialog
        open={action === 'approve-charge'} onOpenChange={(v) => { if (!v) closeAction(); }}
        title="收费补膜通过"
        description="请填写收费金额，通过后申请进入待发货状态。"
        confirmText="确认通过" onConfirm={handleConfirm} loading={operating}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">收费金额（¥）*</label>
            <input
              type="number" min="0" step="0.01" value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="请输入大于 0 的金额"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">审核备注</label>
            <textarea
              value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="选填，门店可见"
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* 驳回 */}
      <ConfirmDialog
        open={action === 'reject'} onOpenChange={(v) => { if (!v) closeAction(); }}
        title="驳回换膜申请" variant="danger"
        confirmText="确认驳回" onConfirm={handleConfirm} loading={operating}
      >
        <div className="mt-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">驳回原因 *</label>
          <textarea
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            placeholder="请填写驳回原因，门店将看到此内容"
          />
        </div>
      </ConfirmDialog>

      {/* 标记发货 */}
      <ConfirmDialog
        open={action === 'ship'} onOpenChange={(v) => { if (!v) closeAction(); }}
        title="确认标记发货"
        description="确认补膜已发货？申请将进入已发货状态。"
        confirmText="确认发货" onConfirm={handleConfirm} loading={operating}
      />

      {/* 标记完成 */}
      <ConfirmDialog
        open={action === 'complete'} onOpenChange={(v) => { if (!v) closeAction(); }}
        title="确认标记完成"
        description="确认门店已收到补膜并完成换膜？申请将进入已完成状态。"
        confirmText="确认完成" onConfirm={handleConfirm} loading={operating}
      />
    </div>
  );
}
