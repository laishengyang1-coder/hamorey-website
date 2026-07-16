// ============================================================
// CodeInventoryTreePage — 质保码库存层级可视化（独立全屏页）
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { CodeInventoryTree } from '../components/CodeInventoryTree';

export default function CodeInventoryTreePage() {
  const [treeData, setTreeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<any>('/admin/warranty-codes?type=tree');
      setTreeData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  return (
    <div>
      <PageHeader
        title="库存层级总览"
        description="质保码在总部、省代、门店三级的分布情况。点击省代节点的 +/− 按钮展开或收起下属门店。"
      />
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--paper-border-strong)] border-t-[#5C1A1A]" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-[var(--paper-muted)]">
          <p>{error}</p>
          <button onClick={fetchTree} className="mt-2 text-sm text-[#5C1A1A] underline">重试</button>
        </div>
      ) : (
        <CodeInventoryTree data={treeData} />
      )}
    </div>
  );
}
