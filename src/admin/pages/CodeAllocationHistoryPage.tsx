// ============================================================
// CodeAllocationHistoryPage — 总部库存流转记录
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar, type FilterField } from '../../shared/components/FilterBar';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface CodeAllocation {
  id: string;
  action: string;
  reason: string | null;
  created_at: string;
  code: string;
  imported_product_name: string | null;
  model_code: string | null;
  model_name: string | null;
  from_org_name: string | null;
  to_org_name: string | null;
  operator_name: string | null;
}

const FILTER_FIELDS: FilterField[] = [
  {
    key: 'action', label: '流转类型', type: 'select', options: [
      { value: 'allocate', label: '划拨' },
      { value: 'revoke', label: '撤回' },
      { value: 'adjust', label: '调整' },
    ],
  },
  { key: 'keyword', label: '关键词', type: 'text', placeholder: '质保码、产品或组织名称', width: '260px' },
];

const ACTION_LABELS: Record<string, string> = {
  allocate: '划拨',
  revoke: '撤回',
  adjust: '调整',
};

export default function CodeAllocationHistoryPage() {
  const [data, setData] = useState<CodeAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchData = useCallback(async (nextPage: number, nextFilters: Record<string, string>, nextPageSize: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ...nextFilters, page: String(nextPage), pageSize: String(nextPageSize) });
      const result = await apiRequest<{ items: CodeAllocation[]; total: number }>(`/admin/code-allocations?${params}`);
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, filters, pageSize);
  }, [fetchData, filters, page, pageSize]);

  const columns: Column[] = [
    { key: 'created_at', title: '时间', dataIndex: 'created_at', width: '160px', render: (value) => String(value || '').slice(0, 16) },
    { key: 'code', title: '质保码', dataIndex: 'code', width: '180px' },
    {
      key: 'model_name', title: '产品型号', dataIndex: 'model_name',
      render: (value, record) => value || record.imported_product_name || record.model_code || '-',
    },
    { key: 'from_org_name', title: '转出方', dataIndex: 'from_org_name', render: (value) => value || '总部未分配' },
    { key: 'to_org_name', title: '接收方', dataIndex: 'to_org_name', render: (value) => value || '总部' },
    {
      key: 'action', title: '类型', dataIndex: 'action', width: '92px',
      render: (value) => <StatusBadge status={String(value)} label={ACTION_LABELS[String(value)] || String(value)} />,
    },
    { key: 'operator_name', title: '操作人', dataIndex: 'operator_name', width: '110px', render: (value) => value || '系统同步' },
    { key: 'reason', title: '备注', dataIndex: 'reason', render: (value) => value || '-' },
  ];

  return (
    <div>
      <PageHeader title="库存流转记录" description="追溯质保码的划拨、撤回与历史库存同步去向" />
      <FilterBar
        fields={FILTER_FIELDS}
        onFilter={(values) => { setFilters(values); setPage(1); }}
        className="mb-4"
      />
      <DataTable
        columns={columns}
        data={data as unknown as Record<string, unknown>[]}
        loading={loading}
        error={error}
        emptyText="暂无库存流转记录"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
