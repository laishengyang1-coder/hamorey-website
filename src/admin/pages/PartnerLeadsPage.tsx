// ============================================================
// PartnerLeadsPage — 总部合作线索管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { FilterBar } from '../../shared/components/FilterBar';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { usePagination } from '../../shared/hooks/usePagination';

interface Lead { id: string; name: string; phone: string; email: string | null; province: string | null; city: string | null; company_name: string | null; business_type: string | null; follow_status: string; created_at: string; message: string | null; }

const STATUS_MAP: Record<string, string> = { new: '新线索', contacted: '已联系', qualified: '已确认', closed: '已关闭' };

export default function PartnerLeadsPage() {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followStatus, setFollowStatus] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const pagination = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (followStatus) qs.set('followStatus', followStatus);
      qs.set('page', String(pagination.page)); qs.set('pageSize', String(pagination.pageSize));
      const res = await apiRequest<{ items: Lead[]; total: number }>(`/admin/partner-leads?${qs}`);
      setData(res.items); pagination.setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, [followStatus, pagination.page, pagination.pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/admin/partner-leads/${id}`, { method: 'PUT', body: JSON.stringify({ follow_status: status }) });
      fetchData(); setDrawerOpen(false);
    } catch (err) { alert(err instanceof Error ? err.message : '更新失败'); }
  };

  const COLUMNS: Column[] = [
    { key: 'name', title: '姓名', dataIndex: 'name' },
    { key: 'phone', title: '电话', dataIndex: 'phone' },
    { key: 'company_name', title: '公司名称', dataIndex: 'company_name' },
    { key: 'province', title: '省份', dataIndex: 'province' },
    { key: 'follow_status', title: '跟进状态', dataIndex: 'follow_status', render: (v) => <StatusBadge status={STATUS_MAP[v as string] || (v as string)} /> },
    { key: 'created_at', title: '提交时间', dataIndex: 'created_at', render: (v) => (v as string)?.slice(0, 10) },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_, r) => (
      <button onClick={() => { setSelected(r); setDrawerOpen(true); }} className="text-xs text-gray-600 hover:text-gray-900">详情</button>
    )},
  ];

  return (
    <div>
      <PageHeader title="合作线索" description="管理来自官网的合作申请" />
      <FilterBar onSearch={fetchData}>
        <select value={followStatus} onChange={(e) => { setFollowStatus(e.target.value); pagination.reset(); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">全部状态</option><option value="new">新线索</option><option value="contacted">已联系</option><option value="qualified">已确认</option><option value="closed">已关闭</option>
        </select>
      </FilterBar>
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无合作线索"
        pagination={{ ...pagination, setPage: pagination.setPage }} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="线索详情" width="lg">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">姓名：</span>{selected.name}</div>
              <div><span className="text-gray-500">电话：</span>{selected.phone}</div>
              <div><span className="text-gray-500">邮箱：</span>{selected.email || '-'}</div>
              <div><span className="text-gray-500">省份：</span>{selected.province || '-'}</div>
              <div><span className="text-gray-500">城市：</span>{selected.city || '-'}</div>
              <div><span className="text-gray-500">业务类型：</span>{selected.business_type || '-'}</div>
            </div>
            <div><span className="text-gray-500">留言：</span>{selected.message || '-'}</div>
            <div><span className="text-gray-500">当前状态：</span><StatusBadge status={STATUS_MAP[selected.follow_status] || selected.follow_status} /></div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">更新状态</p>
              <div className="flex gap-2 flex-wrap">
                {['contacted', 'qualified', 'closed'].filter(s => s !== selected.follow_status).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50">{STATUS_MAP[s]}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
