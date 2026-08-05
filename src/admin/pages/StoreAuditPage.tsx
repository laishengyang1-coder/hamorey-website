// ============================================================
// StoreAuditPage — 总部门店审核（组织管理二级功能）
// 省代新增门店 → 待审核；总部通过后门店才可登录/官网公开
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

interface AuditStore {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  province: string | null;
  city: string | null;
  contact_name: string | null;
  phone: string | null;
  username: string | null;
  status: string;
  audit_status: string;
  audit_reason: string | null;
  audited_at: string | null;
  created_at: string;
}

type TabKey = 'pending' | 'approved' | 'rejected' | 'all';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'all', label: '全部' },
];

const AUDIT_LABEL: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

export default function StoreAuditPage() {
  const [tab, setTab] = useState<TabKey>('pending');
  const [data, setData] = useState<AuditStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  const [provinceMap, setProvinceMap] = useState<Record<string, string>>({});
  const [approveTarget, setApproveTarget] = useState<AuditStore | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AuditStore | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCounts = useCallback(async () => {
    const [p, a, r] = await Promise.all([
      apiRequest<{ total: number }>('/admin/organizations?type=STORE&audit_status=pending&pageSize=1').catch(() => null),
      apiRequest<{ total: number }>('/admin/organizations?type=STORE&audit_status=approved&pageSize=1').catch(() => null),
      apiRequest<{ total: number }>('/admin/organizations?type=STORE&audit_status=rejected&pageSize=1').catch(() => null),
    ]);
    setCounts({ pending: p?.total ?? 0, approved: a?.total ?? 0, rejected: r?.total ?? 0 });
  }, []);

  const fetchData = useCallback(async (t: TabKey, p: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: 'STORE', page: String(p), pageSize: String(size) });
      if (t !== 'all') params.set('audit_status', t);
      const res = await apiRequest<{ items: AuditStore[]; total: number }>(`/admin/organizations?${params}`);
      setData(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(tab, page, pageSize);
  }, [tab, page, pageSize, fetchData]);

  useEffect(() => {
    fetchCounts();
    // 省代名称映射
    apiRequest<{ items: Array<{ id: string; name: string }> }>('/admin/organizations?type=PROVINCE&pageSize=200')
      .then((res) => setProvinceMap(Object.fromEntries((res.items || []).map((p) => [p.id, p.name]))))
      .catch(() => {});
  }, [fetchCounts]);

  const switchTab = (t: TabKey) => {
    setTab(t);
    setPage(1);
  };

  const refresh = () => {
    fetchData(tab, page, pageSize);
    fetchCounts();
  };

  const doApprove = async () => {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      await apiRequest(`/admin/organizations/${approveTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ audit_status: 'approved' }),
      });
      setApproveTarget(null);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const doReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      alert('请填写驳回原因');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/admin/organizations/${rejectTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ audit_status: 'rejected', audit_reason: rejectReason.trim() }),
      });
      setRejectTarget(null);
      setRejectReason('');
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const COLUMNS: Column[] = [
    { key: 'code', title: '编码', dataIndex: 'code', width: '90px', className: 'whitespace-nowrap' },
    { key: 'name', title: '门店名称', dataIndex: 'name', className: 'max-w-[200px] truncate' },
    {
      key: 'parent_name', title: '上级省代', dataIndex: 'parent_id',
      render: (v) => (v as string) ? (provinceMap[v as string] || (v as string)) : '直属总部',
      className: 'max-w-[140px] truncate',
    },
    { key: 'province', title: '省份', dataIndex: 'province', render: (v) => (v as string) || '-', className: 'whitespace-nowrap' },
    { key: 'contact_name', title: '联系人', dataIndex: 'contact_name', render: (v) => (v as string) || '-', className: 'whitespace-nowrap' },
    { key: 'phone', title: '电话', dataIndex: 'phone', render: (v) => (v as string) || '-', className: 'whitespace-nowrap' },
    { key: 'username', title: '登录账号', dataIndex: 'username', render: (v) => (v as string) || '-', className: 'whitespace-nowrap' },
    {
      key: 'audit_status', title: '审核状态', dataIndex: 'audit_status',
      render: (v) => <StatusBadge status={v as string} label={AUDIT_LABEL[v as string] || (v as string)} />,
      className: 'whitespace-nowrap',
    },
    {
      key: 'audit_reason', title: '驳回原因', dataIndex: 'audit_reason',
      render: (v) => (v as string) || '-', className: 'max-w-[160px] truncate',
    },
    { key: 'created_at', title: '提交时间', dataIndex: 'created_at', render: (v) => ((v as string) || '').slice(0, 16).replace('T', ' '), className: 'whitespace-nowrap' },
  ];

  return (
    <div>
      <PageHeader
        title="门店审核"
        description="省代新增的门店需审核通过后正式开通账号（可登录、官网展示）"
      />

      {/* 统计卡片 */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        {(['pending', 'approved', 'rejected'] as Array<'pending' | 'approved' | 'rejected'>).map((k) => {
          const label = TABS.find((t) => t.key === k)!.label;
          const colors: Record<string, string> = {
            pending: 'border-amber-200 bg-amber-50 text-amber-700',
            approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            rejected: 'border-red-200 bg-red-50 text-red-700',
          };
          const isActive = tab === k;
          return (
            <button
              key={k}
              onClick={() => switchTab(k)}
              className={`rounded-xl border p-4 text-left transition-all ${colors[k]} ${isActive ? 'ring-2 ring-[#5C1A1A] ring-offset-1' : 'opacity-90 hover:opacity-100'}`}
            >
              <div className="text-sm font-medium">{label}</div>
              <div className="mt-1 text-2xl font-bold">{counts[k]}</div>
            </button>
          );
        })}
      </div>

      {/* Tab 切换 */}
      <div className="mb-4 flex gap-2 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-[#5C1A1A] text-[#5C1A1A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          ...COLUMNS,
          {
            key: 'actions', title: '操作', dataIndex: 'id',
            render: (_v: any, record: AuditStore) => {
              if (record.audit_status === 'approved') {
                return <span className="text-xs text-gray-400">已开通</span>;
              }
              return (
                <div className="flex gap-2 whitespace-nowrap">
                  <button
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setApproveTarget(record); }}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
                  >
                    通过
                  </button>
                  {record.audit_status !== 'rejected' && (
                    <button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRejectReason(''); setRejectTarget(record); }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      驳回
                    </button>
                  )}
                </div>
              );
            },
          },
        ]}
        data={data as any}
        loading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyText={tab === 'pending' ? '暂无待审核门店' : '暂无数据'}
      />

      {/* 通过确认 */}
      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(v) => { if (!v) setApproveTarget(null); }}
        title="通过审核"
        description={`确定通过门店「${approveTarget?.name}」的审核吗？通过后该门店账号即可登录，并将在官网门店列表展示。`}
        confirmText="通过审核"
        loading={submitting}
        onConfirm={doApprove}
      />

      {/* 驳回确认（含原因填写） */}
      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(v) => { if (!v) { setRejectTarget(null); setRejectReason(''); } }}
        title="驳回申请"
        description={`驳回后门店「${rejectTarget?.name}」无法登录，也不会在官网展示。请填写驳回原因，门店所属省代可通过编辑或重新提交了解。`}
        confirmText="确认驳回"
        variant="danger"
        loading={submitting}
        onConfirm={doReject}
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="请输入驳回原因（必填）"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </ConfirmDialog>
    </div>
  );
}
