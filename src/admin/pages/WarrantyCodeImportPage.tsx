// ============================================================
// WarrantyCodeImportPage — 质保码导入（上传+预检+确认）
// ============================================================

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { FileUpload } from '../../shared/components/FileUpload';
import { StatusBadge } from '../../shared/components/StatusBadge';

interface CheckResult {
  total: number;
  valid: number;
  errors: Array<{ row: number; code: string; reason: string }>;
  errorFileKey?: string;
}

export default function WarrantyCodeImportPage() {
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setCheckResult(null);
    setSuccess(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
      setRows(jsonData);
    } catch {
      setError('Excel 文件解析失败，请检查文件格式');
    }
  };

  const handleCheck = async () => {
    if (rows.length === 0) { setError('没有可预检的数据'); return; }
    setChecking(true);
    setError(null);
    try {
      const importRows = rows.map((r) => ({
        code: String(r['质保编码'] || r['编码'] || r['code'] || ''),
        batch_no: String(r['批次号'] || r['batch_no'] || r['批次'] || ''),
        model_code: String(r['产品型号'] || r['型号编码'] || r['model_code'] || ''),
        product_name: String(r['产品名称'] || r['product_name'] || ''),
      }));
      const result = await apiRequest<CheckResult>('/admin/warranty-codes/import', {
        method: 'POST', body: JSON.stringify({ mode: 'check', rows: importRows }),
      });
      setCheckResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '预检失败');
    } finally {
      setChecking(false);
    }
  };

  const handleImport = async () => {
    if (!checkResult || checkResult.errors.length > 0) { setError('请先修复所有错误'); return; }
    const finalBatchName = batchName.trim() || `导入_${new Date().toLocaleDateString('zh-CN')}`;
    setImporting(true);
    setError(null);
    try {
      const importRows = rows.map((r) => ({
        code: String(r['质保编码'] || r['编码'] || r['code'] || ''),
        batch_no: String(r['批次号'] || r['batch_no'] || r['批次'] || ''),
        model_code: String(r['产品型号'] || r['型号编码'] || r['model_code'] || ''),
        product_name: String(r['产品名称'] || r['product_name'] || ''),
      }));
      const result = await apiRequest<{ batchId: string; total: number }>('/admin/warranty-codes/import', {
        method: 'POST', body: JSON.stringify({ mode: 'import', batch_name: finalBatchName, rows: importRows }),
      });
      setSuccess(`成功导入 ${result.total} 条质保码`);
      setRows([]);
      setCheckResult(null);
      setBatchName('');
      setBatchName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setRows([]);
    setCheckResult(null);
    setError(null);
    setSuccess(null);
    setBatchName('');
  };

  const downloadTemplate = () => {
    const template = [
      { '质保编码': 'FH060207260001', '批次号': 'Batch001', '产品型号': 'PPF', '产品名称': '和御HY8' },
      { '质保编码': 'FH060207260002', '批次号': 'Batch001', '产品型号': 'WL-70', '产品名称': '和光70' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '质保码导入模板');
    XLSX.writeFile(wb, '质保码导入模板.xlsx');
  };

  return (
    <div>
      <PageHeader title="质保码导入" description="上传 Excel 文件批量导入质保码（4列：编码/批次号/型号编码/产品名称）" actions={
        <button onClick={downloadTemplate} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          下载导入模板
        </button>
      } />
      {success && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <FileUpload
          accept=".xlsx,.xls,.csv"
          onFileSelect={handleFileSelect}
          onFileRemove={handleReset}
          loading={checking || importing}
          label="点击或拖拽 Excel 文件到此处"
          hint="支持 .xlsx / .xls / .csv，第一行为表头（编码、批次号、型号编码、产品名称）"
        />

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">已加载 <strong>{rows.length}</strong> 行数据</span>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="批次名称（如：2024Q3-第一批）"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleCheck} disabled={checking || importing}
                className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors disabled:opacity-50">
                {checking ? '预检中...' : '预检'}
              </button>
              {checkResult && checkResult.errors.length === 0 && (
                <button onClick={handleImport} disabled={importing}
                  className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors disabled:opacity-50">
                  {importing ? '导入中...' : `确认导入 ${checkResult.valid} 条`}
                </button>
              )}
              <button onClick={handleReset}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                重置
              </button>
            </div>

            {checkResult && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-4 text-sm mb-3">
                  <span className="text-gray-500">总计: <strong>{checkResult.total}</strong></span>
                  <span className="text-emerald-600">有效: <strong>{checkResult.valid}</strong></span>
                  <span className="text-red-500">错误: <strong>{checkResult.errors.length}</strong></span>
                </div>
                {checkResult.errors.length > 0 && (
                  <div className="max-h-64 overflow-y-auto rounded border border-red-100">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-red-50"><th className="px-3 py-2 text-left text-xs font-medium text-red-700">行号</th><th className="px-3 py-2 text-left text-xs font-medium text-red-700">质保码</th><th className="px-3 py-2 text-left text-xs font-medium text-red-700">错误原因</th></tr></thead>
                      <tbody className="divide-y divide-red-50">
                        {checkResult.errors.map((e, i) => (
                          <tr key={i}><td className="px-3 py-1.5 text-red-600">{e.row}</td><td className="px-3 py-1.5">{e.code}</td><td className="px-3 py-1.5 text-red-500">{e.reason}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
