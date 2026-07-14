// ============================================================
// ContentEntriesPage — 总部官网内容管理
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';

interface ContentEntry { id: string; page: string; section: string; title: string | null; body: string | null; image_file_key: string | null; sort_order: number; status: string; updated_at: string; }

export default function ContentEntriesPage() {
  const [data, setData] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await apiRequest<{ items: ContentEntry[] }>('/admin/content-entries'); setData(res.items); }
    catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const COLUMNS: Column[] = [
    { key: 'page', title: '页面', dataIndex: 'page' },
    { key: 'section', title: '区块', dataIndex: 'section' },
    { key: 'title', title: '标题', dataIndex: 'title' },
    { key: 'status', title: '状态', dataIndex: 'status', render: (v) => {
      const statusMap: Record<string, string> = { draft: '草稿', published: '已发布', archived: '已归档' };
      return <StatusBadge status={statusMap[v as string] || (v as string)} />;
    }},
    { key: 'updated_at', title: '更新时间', dataIndex: 'updated_at', render: (v) => (v as string)?.slice(0, 10) },
  ];

  if (!loading && !error && data.length === 0) {
    return (
      <div>
        <PageHeader title="官网内容" description="管理品牌官网各页面的内容区块" />
        <EmptyState title="暂无内容" description="当前数据库中没有内容条目，可通过 SQL 直接插入或通过后续版本的管理界面添加" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="官网内容" description="管理品牌官网各页面的内容区块" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无内容" />
    </div>
  );
}
