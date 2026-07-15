// ============================================================
// WarrantyResultPage — 质保查询结果详情页
// ============================================================

import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchWarrantyByQuery } from '../lib/api';
import { StatusBadge } from '../shared/components/StatusBadge';
import type { WarrantyCardData, WarrantyVehicleGroup } from '../types/api';

function formatWarrantyPrice(cents?: number | null): string {
  return cents == null ? '-' : `¥${Math.round(cents / 100).toLocaleString('zh-CN')}`;
}

export default function WarrantyResultPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicles, setVehicles] = React.useState<WarrantyVehicleGroup[]>([]);
  const [records, setRecords] = React.useState<WarrantyCardData[]>([]);

  React.useEffect(() => {
    if (!query) { setLoading(false); return; }
    setLoading(true);
    searchWarrantyByQuery(query)
      .then((result) => {
        setVehicles(result.vehicles || []);
        setRecords(result.records || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '查询失败'))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="mt-3 text-gray-500">查询中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="mt-3 text-red-600 font-medium">查询失败</p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
          <Link to="/warranty" className="mt-4 inline-block text-sm text-gray-900 underline">返回质保查询</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">质保查询结果</h1>
            <p className="mt-1 text-sm text-gray-500">查询内容：{query}</p>
          </div>
          <Link to="/warranty" className="text-sm text-gray-900 underline">重新查询</Link>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">未找到相关质保记录</p>
            <p className="mt-1 text-sm text-gray-400">请确认输入的VIN/车牌/手机号/质保码正确，或联系施工门店</p>
          </div>
        ) : (
          <div className="space-y-6">
            {vehicles.map((v, vi) => (
              <div key={vi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-50 bg-gray-50/50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">{v.brand} {v.model}</h3>
                  <p className="text-xs text-gray-500">车牌: {v.plate_no} | VIN: {v.vin || '-'}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {records
                    .filter((r: any) => r.plate_no_snapshot === v.plate_no || r.plate_no === v.plate_no)
                    .map((record) => (
                      <div key={record.id} className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{record.product_name} - {record.product_model}</p>
                          </div>
                          <StatusBadge status={record.status} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div><span className="text-gray-400">施工日期</span><p className="text-gray-700">{record.installation_date}</p></div>
                          <div><span className="text-gray-400">到期日期</span><p className="text-gray-700">{record.warranty_expiry_date || '-'}</p></div>
                          <div><span className="text-gray-400">质保年限</span><p className="text-gray-700">{record.warranty_years} 年</p></div>
                          <div><span className="text-gray-400">质保价格</span><p className="text-gray-700">{formatWarrantyPrice(record.warranty_price_cents)}</p></div>
                          <div><span className="text-gray-400">施工门店</span><p className="text-gray-700">{record.store_name}</p></div>
                        </div>
                        {record.certificate_no && (
                          <a href={`/api/public/certificates/${record.certificate_no}/download`}
                            className="mt-3 inline-flex items-center gap-1 text-sm text-[#C84444] hover:text-[#A03030]">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            下载证书
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
