// ============================================================
// Province StoreInventoryPage — 省代「门店库存」
// ------------------------------------------------------------
// 列表：下属每家门店一行（总码数 / 可用 / 未用 / 部分使用 / 已用完）
// 点行：右侧抽屉看该门店的质保码明细
//
// 数据全部来自 /api/province/store-inventory（汇总与明细同源，口径一致）
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface Counts {
  total: number;
  in_stock: number;
  partial_used: number;
  exhausted: number;
  frozen_voided: number;
  available: number;
}

interface StoreRow extends Counts {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  status: string;
  audit_status: string;
}

interface Summary extends Counts {
  store_count: number;
}

interface CodeRow {
  id: string;
  code: string;
  model_name: string;
  model_code: string;
  batch_no: string;
  usage_limit: number;
  used_count: number;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 20;

/** 顶部汇总小卡 */
function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--paper-border)] bg-white px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[#5C1A1A] tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div>}
    </div>
  );
}

export default function StoreInventoryPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // 抽屉
  const [open, setOpen] = useState(false);
  const [activeStore, setActiveStore] = useState<StoreRow | null>(null);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesError, setCodesError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ summary: Summary; stores: StoreRow[] }>('/province/store-inventory');
      setStores(res.stores || []);
      setSummary(res.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openStore = useCallback(async (store: StoreRow) => {
    setActiveStore(store);
    setOpen(true);
    setCodes([]);
    setCodesError(null);
    setCodesLoading(true);
    try {
      const res = await apiRequest<{ summary: Counts; items: CodeRow[] }>(
        `/province/store-inventory?store_id=${encodeURIComponent(store.id)}&pageSize=500`,
      );
      setCodes(res.items || []);
    } catch (err) {
      setCodesError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setCodesLoading(false);
    }
  }, []);

  const columns: Column[] = useMemo(
    () => [
      { key: 'name', title: '门店', dataIndex: 'name' },
      { key: 'city', title: '城市', dataIndex: 'city', render: (v) => (v ? String(v) : '—') },
      {
        key: 'status',
        title: '状态',
        render: (_, r: StoreRow) => (
          <span className="inline-flex items-center gap-1">
            <StatusBadge status={r.status} />
            {r.audit_status !== 'approved' && <StatusBadge status={r.audit_status} />}
          </span>
        ),
      },
      {
        key: 'total',
        title: '总码数',
        className: 'text-right',
        render: (_, r: StoreRow) => <span className="font-medium tabular-nums">{r.total}</span>,
      },
      {
        key: 'available',
        title: '可用',
        className: 'text-right',
        render: (_, r: StoreRow) => (
          <span className={r.available > 0 ? 'font-medium tabular-nums text-emerald-700' : 'tabular-nums text-gray-400'}>
            {r.available}
          </span>
        ),
      },
      { key: 'in_stock', title: '未用', className: 'text-right', render: (_, r: StoreRow) => <span className="tabular-nums">{r.in_stock}</span> },
      { key: 'partial_used', title: '部分使用', className: 'text-right', render: (_, r: StoreRow) => <span className="tabular-nums">{r.partial_used}</span> },
      { key: 'exhausted', title: '已用完', className: 'text-right', render: (_, r: StoreRow) => <span className="tabular-nums text-gray-500">{r.exhausted}</span> },
      // 冻结/作废的码也算「支货」，计入总码数；但不在上面三类里。
      // 只有真存在时才显示这一列，否则「总码数 = 未用+部分+用完」看不出差额、会让人以为算错。
      ...(summary && summary.frozen_voided > 0
        ? [{
            key: 'frozen_voided',
            title: '冻结/作废',
            className: 'text-right',
            render: (_: unknown, r: StoreRow) => <span className="tabular-nums text-gray-400">{r.frozen_voided}</span>,
          } as Column]
        : []),
    ],
    [summary],
  );

  const paged = useMemo(() => stores.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [stores, page]);

  const drawerCounts = useMemo<Counts | null>(() => {
    if (!codes.length) return null;
    const c: Counts = { total: codes.length, in_stock: 0, partial_used: 0, exhausted: 0, frozen_voided: 0, available: 0 };
    for (const k of codes) {
      if (k.status === 'in_stock') c.in_stock += 1;
      else if (k.status === 'partial_used') c.partial_used += 1;
      else if (k.status === 'exhausted') c.exhausted += 1;
      else c.frozen_voided += 1;
    }
    c.available = c.in_stock + c.partial_used;
    return c;
  }, [codes]);

  return (
    <div>
      <PageHeader
        title="门店库存"
        description="查看下属门店的质保码库存，点门店可看每一支码的明细"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="下属门店" value={summary?.store_count ?? 0} hint="含待审核 / 停用" />
        <Kpi label="质保码合计" value={summary?.total ?? 0} hint="所有门店名下码数" />
        <Kpi label="可用码数" value={summary?.available ?? 0} hint="库存中 + 部分使用" />
        <Kpi label="已用完" value={summary?.exhausted ?? 0} hint="用满次数" />
      </div>

      <DataTable
        columns={columns}
        data={paged as unknown as Record<string, unknown>[]}
        loading={loading}
        error={error}
        page={page}
        pageSize={PAGE_SIZE}
        total={stores.length}
        onPageChange={setPage}
        onRowClick={(record) => openStore(record as unknown as StoreRow)}
        emptyText="暂无下属门店"
      />

      <DetailDrawer open={open} onOpenChange={setOpen} title={activeStore ? activeStore.name : '门店库存'}>
        {codesLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        )}

        {!codesLoading && codesError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{codesError}</div>
        )}

        {!codesLoading && !codesError && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              {[
                { label: '合计', value: drawerCounts?.total ?? 0 },
                { label: '未用', value: drawerCounts?.in_stock ?? 0 },
                { label: '部分使用', value: drawerCounts?.partial_used ?? 0 },
                { label: '已用完', value: drawerCounts?.exhausted ?? 0 },
                { label: '可用', value: drawerCounts?.available ?? 0 },
                ...((drawerCounts?.frozen_voided ?? 0) > 0
                  ? [{ label: '冻结/作废', value: drawerCounts?.frozen_voided ?? 0 }]
                  : []),
              ].map((it) => (
                <div key={it.label} className="rounded-lg bg-[var(--burgundy-tint)] px-3 py-2">
                  <div className="text-[11px] text-gray-500">{it.label}</div>
                  <div className="text-lg font-semibold tabular-nums text-[#5C1A1A]">{it.value}</div>
                </div>
              ))}
            </div>

            {activeStore && (
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] text-gray-400">门店编码</div>
                  <div>{activeStore.code || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">城市</div>
                  <div>{activeStore.city || '—'}</div>
                </div>
              </div>
            )}

            {codes.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">该门店名下暂无质保码</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--paper-border)] text-left text-xs text-gray-500">
                      <th className="py-2 pr-2 font-normal">质保码</th>
                      <th className="py-2 pr-2 font-normal">型号</th>
                      <th className="py-2 pr-2 font-normal">批次</th>
                      <th className="py-2 pr-2 text-right font-normal">已用/总额</th>
                      <th className="py-2 font-normal">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <tr key={c.id} className="border-b border-[var(--paper-border)] last:border-0">
                        <td className="py-2 pr-2 font-mono text-[12.5px]">{c.code}</td>
                        <td className="py-2 pr-2">{c.model_name}</td>
                        <td className="py-2 pr-2 text-xs text-gray-500">{c.batch_no}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {c.used_count}/{c.usage_limit}
                        </td>
                        <td className="py-2">
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
