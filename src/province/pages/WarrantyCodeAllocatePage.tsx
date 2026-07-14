// ============================================================
// Province WarrantyCodeAllocatePage — 省代划拨给门店
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface WarrantyCode { id: string; code: string; model_name: string; batch_no: string; status: string; }
interface Store { id: string; name: string; }

const COLUMNS: Column[] = [
  { key: 'code', title: '质保码', dataIndex: 'code' },
  { key: 'model_name', title: '型号', dataIndex: 'model_name' },
  { key: 'batch_no', title: '批次', dataIndex: 'batch_no' },
  { key: 'status', title: '状态', dataIndex: 'status', render: (v) => <StatusBadge status={v as string} /> },
];

export default function WarrantyCodeAllocatePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WarrantyCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stores, setStores] = useState<Store[]>([]);
  const [toStoreId, setToStoreId] = useState('');
  const [operating, setOperating] = useState(false);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const res = await apiRequest<{ items: WarrantyCode[]; total: number }>(`/province/warranty-codes?status=in_stock&page=${p}&pageSize=20`);
      setData(res.items); setTotal(res.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page); }, [page, fetchData]);
  useEffect(() => {
    apiRequest<{ items: Store[] }>('/province/organizations?pageSize=200').then((r) => setStores(r.items)).catch(() => {});
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleAllocate = async () => {
    if (selected.size === 0 || !toStoreId) return;
    setOperating(true);
    try {
      await apiRequest('/province/warranty-codes/allocate', {
        method: 'POST', body: JSON.stringify({ code_ids: [...selected], to_store_id: toStoreId }),
      });
      setSelected(new Set()); setToStoreId(''); fetchData(page);
    } catch (err) { alert(err instanceof Error ? err.message : '划拨失败'); }
    finally { setOperating(false); }
  };

  const COLS: Column[] = [
    { key: 'select', title: '', width: '40px', render: (_, r) => (
      <input type="checkbox" checked={selected.has(r.id as string)} onChange={() => toggleSelect(r.id as string)} className="rounded border-gray-300" />
    )},
    ...COLUMNS,
  ];

  return (
    <div>
      <PageHeader title="质保码划拨" description="将库存质保码划拨给下属门店"
        actions={selected.size > 0 && (
          <div className="flex items-center gap-2">
            <select value={toStoreId} onChange={(e) => setToStoreId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">选择门店</option>{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <button onClick={handleAllocate} disabled={operating || !toStoreId}
              className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">划拨 {selected.size} 个</button>
          </div>
        )}
      />
      <DataTable columns={COLS} data={data as any} loading={loading} error={error} page={page} total={total} onPageChange={setPage} emptyText="暂无库存质保码" />
    </div>
  );
}
