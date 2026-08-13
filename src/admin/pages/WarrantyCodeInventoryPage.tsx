// ============================================================
// WarrantyCodeInventoryPage — 总部质保码库存与划拨
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { StoreSearchSelect } from '../../shared/components/StoreSearchSelect';

interface WarrantyCode {
  id: string;
  code: string;
  model_code: string;
  model_name: string;
  imported_product_name: string | null;
  batch_no: string;
  owner_name: string | null;
  owner_org_id: string | null;
  status: string;
  used_count: number;
  usage_limit: number;
  created_at: string;
}

export default function WarrantyCodeInventoryPage() {
  const [data, setData] = useState<WarrantyCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string | null>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [toOrgId, setToOrgId] = useState('');
  const [operating, setOperating] = useState(false);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [models, setModels] = useState<Array<{ id: string; model_code: string; display_name: string; usage_limit: number | null; product_name?: string }>>([]);
  const [createForm, setCreateForm] = useState({ code: '', product_model_id: '', store_id: '', batch_no: '', usage_limit: '' });
  const [creating, setCreating] = useState(false);

  const filterFields: FilterField[] = [
    { key: 'status', label: '状态', type: 'select', options: [
      { value: 'unallocated', label: '未分配' }, { value: 'in_stock', label: '库存中' },
      { value: 'partial_used', label: '部分使用' }, { value: 'exhausted', label: '已用完' },
      { value: 'frozen', label: '已冻结' }, { value: 'voided', label: '已作废' },
    ]},
    { key: 'owner_org_id', label: '当前归属', type: 'select', options: [
      { value: 'org-hq-001', label: '和膜 HAMOREY 总部' },
      ...orgs.map((org) => ({ value: org.id, label: `${org.name} (${org.type === 'PROVINCE' ? '省代' : '门店'})` })),
    ]},
    { key: 'batch_no', label: '批次号', type: 'text' },
    { key: 'keyword', label: '关键词', type: 'text', placeholder: '质保码/产品名称' },
  ];

  const fetchData = useCallback(async (p: number, f: Record<string, string>, size: number, sortBy: string | null, direction: 'asc' | 'desc') => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ ...f, page: String(p), pageSize: String(size) });
      if (sortBy) {
        params.set('sort_by', sortBy);
        params.set('sort_dir', direction);
      }
      const res = await apiRequest<{ items: WarrantyCode[]; total: number }>(`/admin/warranty-codes?${params}`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filters, pageSize, sortKey, sortDir); }, [page, filters, pageSize, sortKey, sortDir, fetchData]);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await apiRequest<{ items: Array<{ id: string; name: string; type: string }> }>('/admin/organizations?type=&pageSize=200');
      setOrgs(res.items
        .filter((o) => o.type !== 'HQ')
        .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'zh-CN')));
    } catch {}
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleAllocate = async () => {
    if (selected.size === 0 || !toOrgId) return;
    setOperating(true);
    try {
      await apiRequest('/admin/warranty-codes/allocate', {
        method: 'POST', body: JSON.stringify({ code_ids: [...selected], to_org_id: toOrgId }),
      });
      setSelected(new Set()); setAllocateOpen(false); setToOrgId('');
      fetchData(page, filters, pageSize, sortKey, sortDir);
    } catch (err) { alert(err instanceof Error ? err.message : '划拨失败'); }
    finally { setOperating(false); }
  };

  const handleRevoke = async () => {
    if (selected.size === 0) return;
    setOperating(true);
    try {
      await apiRequest('/admin/warranty-codes/revoke', {
        method: 'POST', body: JSON.stringify({ code_ids: [...selected] }),
      });
      setSelected(new Set()); fetchData(page, filters, pageSize, sortKey, sortDir);
    } catch (err) { alert(err instanceof Error ? err.message : '撤回失败'); }
    finally { setOperating(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const transferableRows = data.filter((row) => ['unallocated', 'in_stock', 'partial_used'].includes(row.status) && row.used_count < row.usage_limit);
  const pageSelected = transferableRows.length > 0 && transferableRows.every((row) => selected.has(row.id));
  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      transferableRows.forEach((row) => pageSelected ? next.delete(row.id) : next.add(row.id));
      return next;
    });
  };

  const openCreate = async () => {
    setCreateForm({ code: '', product_model_id: '', store_id: '', batch_no: '', usage_limit: '' });
    setCreateOpen(true);
    // 拉取型号（门店改为搜索选择，无需预加载）
    if (models.length === 0) {
      try {
        const res = await apiRequest<{ items: Array<{ id: string; model_code: string; display_name: string; usage_limit: number | null; product_name?: string }> }>(`/admin/product-models?status=active`);
        setModels(res.items || []);
      } catch { /* ignore */ }
    }
  };

  // 门店搜索（关键字联想）
  const fetchStores = useCallback(async (kw: string) => {
    const res = await apiRequest<{ items: Array<{ id: string; name: string }> }>(`/admin/organizations?type=STORE&keyword=${encodeURIComponent(kw)}&pageSize=20`);
    return res.items || [];
  }, []);

  // 组织搜索（省代 + 门店，用于批量划拨接收方）
  const fetchAllocateOrgs = useCallback(async (kw: string) => {
    const res = await apiRequest<{ items: Array<{ id: string; name: string; type: string }> }>(`/admin/organizations?keyword=${encodeURIComponent(kw)}&pageSize=20`);
    return (res.items || [])
      .filter((o) => o.type !== 'HQ')
      .map((o) => ({ id: o.id, name: `${o.name}（${o.type === 'PROVINCE' ? '省代' : '门店'}）` }));
  }, []);

  const handleCreateSubmit = async () => {
    const f = createForm;
    if (!f.code.trim()) { alert('请输入质保码'); return; }
    if (!f.product_model_id) { alert('请选择产品型号'); return; }
    if (!f.store_id) { alert('请选择所属门店'); return; }
    setCreating(true);
    try {
      await apiRequest('/admin/warranty-codes', { method: 'POST', body: JSON.stringify({
        code: f.code.trim(),
        product_model_id: f.product_model_id,
        store_id: f.store_id,
        batch_no: f.batch_no.trim() || undefined,
        usage_limit: f.usage_limit ? Number(f.usage_limit) : undefined,
      }) });
      setCreateOpen(false);
      setPage(1);
      fetchData(1, filters, pageSize, sortKey, sortDir);
    } catch (err) { alert(err instanceof Error ? err.message : '新增失败'); }
    finally { setCreating(false); }
  };

  const COLUMNS: Column[] = [
    { key: 'select', title: (
      <input type="checkbox" checked={pageSelected} onChange={togglePage} disabled={transferableRows.length === 0}
        aria-label="选择当前页可划拨质保码" className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
    ), width: '40px', render: (_, record) => (
      <input type="checkbox" checked={selected.has(record.id as string)} onChange={() => toggleSelect(record.id as string)}
        disabled={!['unallocated', 'in_stock', 'partial_used'].includes(record.status as string) || Number(record.used_count) >= Number(record.usage_limit)}
        aria-label={`选择质保码 ${record.code as string}`}
        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 disabled:opacity-40" />
    )},
    { key: 'code', title: '质保码', dataIndex: 'code', sortable: true },
    { key: 'model_name', title: '型号', dataIndex: 'model_name', sortable: true },
    { key: 'batch_no', title: '批次', dataIndex: 'batch_no', sortable: true },
    { key: 'owner_name', title: '归属', dataIndex: 'owner_name', sortable: true, render: (v) => (v as string) || '-' },
    { key: 'used_count', title: '已用/总额', sortable: true, render: (_, r) => `${r.used_count}/${r.usage_limit}` },
    { key: 'status', title: '状态', dataIndex: 'status', sortable: true, render: (v) => <StatusBadge status={v as string} /> },
  ];

  return (
    <div>
      <PageHeader title="质保码库存" description="管理质保码库存、划拨与撤回"
        actions={(
          <div className="flex gap-2">
            <button onClick={openCreate}
              className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors">+ 手动新增质保码</button>
            {selected.size > 0 && (
              <>
                <button onClick={() => setAllocateOpen(true)}
                  className="rounded-lg border border-[#5C1A1A] px-4 py-2 text-sm font-medium text-[#5C1A1A] hover:bg-[#5C1A1A]/5">批量划拨 ({selected.size})</button>
                <button onClick={handleRevoke} disabled={operating}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">批量撤回</button>
              </>
            )}
          </div>
        )}
      />
      <FilterBar fields={filterFields} onFilter={(v) => { setFilters(v); setPage(1); setSelected(new Set()); }} className="mb-4" />
      <DataTable
        columns={COLUMNS}
        data={data as any}
        loading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={(key, direction) => { setSortKey(key); setSortDir(direction); setPage(1); setSelected(new Set()); }}
      />

      <ConfirmDialog open={allocateOpen} onOpenChange={setAllocateOpen} title="批量划拨质保码"
        confirmText="确认划拨" onConfirm={handleAllocate} loading={operating}>
        <p className="text-sm text-gray-500">请选择要把 <b>{selected.size}</b> 个质保码划拨到的组织：</p>
        <div className="mt-4">
          <StoreSearchSelect
            value={toOrgId}
            placeholder="输入省代/门店名称搜索"
            fetchStores={fetchAllocateOrgs}
            onSelect={(id) => setToOrgId(id)}
          />
        </div>
      </ConfirmDialog>

      <DetailDrawer open={createOpen} onOpenChange={setCreateOpen} title="手动新增质保码">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">质保码 <span className="text-red-500">*</span></label>
            <input value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
              placeholder="请输入质保码编码"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品型号 <span className="text-red-500">*</span></label>
            <select value={createForm.product_model_id} onChange={(e) => setCreateForm({ ...createForm, product_model_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400">
              <option value="">请选择产品型号</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.display_name}{m.product_name ? `（${m.product_name}）` : ''}</option>)}
            </select>
          </div>
          <div>
            <StoreSearchSelect
              value={createForm.store_id}
              label="所属门店"
              required
              placeholder="输入门店名称搜索（质保码将分配给该门店）"
              fetchStores={fetchStores}
              onSelect={(id) => setCreateForm({ ...createForm, store_id: id })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">批次号</label>
              <input value={createForm.batch_no} onChange={(e) => setCreateForm({ ...createForm, batch_no: e.target.value })}
                placeholder="留空自动生成"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">可用次数</label>
              <input type="number" min="1" value={createForm.usage_limit} onChange={(e) => setCreateForm({ ...createForm, usage_limit: e.target.value })}
                placeholder="留空取型号默认"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          <p className="text-xs text-gray-400">新增后质保码状态为「库存中」并归属于所选门店，可立即在「质保记录 - 手动录入」中使用该码登记质保。</p>
          <div className="pt-4 border-t border-gray-100">
            <button onClick={handleCreateSubmit} disabled={creating}
              className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors disabled:opacity-50">
              {creating ? '提交中...' : '确认新增'}
            </button>
          </div>
        </div>
      </DetailDrawer>
    </div>
  );
}
