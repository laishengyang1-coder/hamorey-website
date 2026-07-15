// ============================================================
// ExportPage — 总部数据导出
// ============================================================

import React, { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';

const EXPORT_OPTIONS = [
  { value: 'warranty_records', label: '质保记录', description: '导出所有质保记录的车主、车辆、产品等字段' },
  { value: 'warranty_codes', label: '质保码', description: '导出所有质保码及使用状态' },
  { value: 'partner_leads', label: '合作线索', description: '导出所有合作申请线索' },
  { value: 'points_ledger', label: '积分流水', description: '导出所有积分变更记录' },
  { value: 'organizations', label: '组织列表', description: '导出省代/门店基本信息' },
];

export default function ExportPage() {
  const [exportType, setExportType] = useState('warranty_records');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fileKey: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await apiRequest<{ fileKey: string; total: number }>('/admin/exports', {
        method: 'POST',
        body: JSON.stringify({ exportType }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="数据导出" description="将业务数据导出为 CSV 文件（Excel 可打开）" />

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6 max-w-lg">
        <div className="space-y-3 mb-6">
          {EXPORT_OPTIONS.map((opt) => (
            <label key={opt.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${exportType === opt.value ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name="exportType" value={opt.value} checked={exportType === opt.value} onChange={(e) => setExportType(e.target.value)} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        <button onClick={handleExport} disabled={loading} className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">
          {loading ? '导出中...' : '生成导出文件'}
        </button>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        {result && (
          <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <p>导出成功！共 {result.total} 条记录。</p>
            <p className="text-xs mt-1 text-green-500">文件 Key: {result.fileKey}</p>
          </div>
        )}
      </div>
    </div>
  );
}
