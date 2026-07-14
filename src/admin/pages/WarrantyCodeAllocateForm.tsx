// ============================================================
// WarrantyCodeAllocateForm — 划拨表单组件
// ============================================================

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';

interface Organization { id: string; name: string; type: string; }

interface WarrantyCodeAllocateFormProps {
  codeIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function WarrantyCodeAllocateForm({ codeIds, onSuccess, onCancel }: WarrantyCodeAllocateFormProps) {
  const [toOrgId, setToOrgId] = useState('');
  const [reason, setReason] = useState('');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ items: Organization[] }>('/admin/organizations?pageSize=200')
      .then((res) => setOrgs(res.items.filter((o) => o.type !== 'HQ')))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toOrgId) { setError('请选择接收方'); return; }
    setLoading(true); setError('');
    try {
      await apiRequest('/admin/warranty-codes/allocate', {
        method: 'POST', body: JSON.stringify({ code_ids: codeIds, to_org_id: toOrgId, reason }),
      });
      onSuccess();
    } catch (err) { setError(err instanceof Error ? err.message : '划拨失败'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">将 {codeIds.length} 个质保码划拨到指定组织</p>
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">接收方 *</label>
        <select value={toOrgId} onChange={(e) => setToOrgId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400">
          <option value="">请选择接收方</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.type === 'PROVINCE' ? '省代' : '门店'})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">取消</button>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {loading ? '划拨中...' : '确认划拨'}
        </button>
      </div>
    </form>
  );
}
