// ============================================================
// SystemSettingsPage — 总部系统设置
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { DetailDrawer } from '../../shared/components/DetailDrawer';

interface SettingEntry { id: string; key: string; value: string | null; value_type: string; description: string | null; updated_at: string; }

export default function SystemSettingsPage() {
  const [data, setData] = useState<SettingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<SettingEntry | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await apiRequest<{ items: SettingEntry[] }>('/admin/system-settings'); setData(res.items); }
    catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (s: SettingEntry) => {
    setSelected(s); setEditValue(s.value ?? '');
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiRequest(`/admin/system-settings/${selected.id}`, { method: 'PUT', body: JSON.stringify({ value: editValue }) });
      setDrawerOpen(false); fetchData();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const COLUMNS: Column[] = [
    { key: 'key', title: '设置键', dataIndex: 'key' },
    { key: 'value', title: '设置值', dataIndex: 'value', render: (v) => (v as string)?.slice(0, 60) || '(空)' },
    { key: 'value_type', title: '类型', dataIndex: 'value_type' },
    { key: 'description', title: '说明', dataIndex: 'description' },
    { key: 'actions', title: '操作', dataIndex: 'id', render: (_, r) => (
      <button onClick={() => openEdit(r)} className="text-xs text-gray-600 hover:text-gray-900">编辑</button>
    )},
  ];

  return (
    <div>
      <PageHeader title="系统设置" description="管理系统的全局配置项" />
      <DataTable columns={COLUMNS} data={data as any} loading={loading} error={error} emptyText="暂无系统设置" />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="编辑设置">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">设置键</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{selected.key}</p>
            </div>
            {selected.description && <p className="text-xs text-gray-500">{selected.description}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">设置值</label>
              {selected.value_type === 'boolean' ? (
                <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="true">true</option><option value="false">false</option>
                </select>
              ) : selected.value_type === 'json' ? (
                <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono" />
              ) : (
                <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              )}
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
