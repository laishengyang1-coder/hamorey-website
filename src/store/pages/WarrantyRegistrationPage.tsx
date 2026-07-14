// ============================================================
// WarrantyRegistrationPage — 门店质保登记（6步流程）
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, uploadWarrantyPhoto } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { StepWizard } from '../../shared/components/StepWizard';

const STEPS = [
  { key: 'code', title: '质保码', description: '输入质保码' },
  { key: 'customer', title: '车主信息', description: '填写车主资料' },
  { key: 'vehicle', title: '车辆信息', description: '填写车辆资料' },
  { key: 'date', title: '施工日期', description: '选择施工日期' },
  { key: 'photos', title: '施工照片', description: '上传照片' },
  { key: 'confirm', title: '确认提交', description: '核对信息' },
];

export default function WarrantyRegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoNames, setPhotoNames] = useState<string[]>([]);

  // 质保码自动补全
  const [codeQuery, setCodeQuery] = useState('');
  const [codeOptions, setCodeOptions] = useState<Array<{ id: string; code: string; model_name: string; model_code: string }>>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchCodes = useCallback(async (value: string) => {
    if (!value.trim()) { setCodeOptions([]); setDropdownOpen(false); return; }
    try {
      const res = await apiRequest<{ items: typeof codeOptions }>(`/store/warranty-codes?q=${encodeURIComponent(value)}&limit=10`);
      setCodeOptions(res.items || []);
      setDropdownOpen(true);
    } catch {
      setCodeOptions([]);
    }
  }, []);

  const handleCodeInput = (value: string) => {
    setCodeQuery(value);
    updateField('warranty_code', value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchCodes(value), 200);
  };

  const selectCode = (item: typeof codeOptions[0]) => {
    setCodeQuery(item.code);
    updateField('warranty_code', item.code);
    setDropdownOpen(false);
    setCodeOptions([]);
  };

  const [form, setForm] = useState({
    warranty_code: '',
    customer_name: '',
    customer_phone: '',
    plate_no: '',
    vin: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    installation_date: '',
    photo_keys: [] as string[],
  });

  const updateField = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    // 客户端校验
    const required: Array<[keyof typeof form, string]> = [
      ['warranty_code', '质保码'], ['customer_name', '车主姓名'], ['customer_phone', '联系电话'],
      ['plate_no', '车牌号'], ['vehicle_brand', '车辆品牌'], ['vehicle_model', '车辆型号'],
      ['installation_date', '施工日期'],
    ];
    for (const [field, label] of required) {
      if (!form[field]) { setError(`请填写「${label}」`); return; }
    }

    setLoading(true); setError('');
    try {
      await apiRequest('/store/warranty-records', {
        method: 'POST', body: JSON.stringify(form),
      });
      setSuccess('质保登记已提交，等待总部审核');
    } catch (err) {
      const msg = (err as any)?.data?.errors
        ? (err as any).data.errors.map((e: { field: string; message: string }) => e.message).join('；')
        : (err instanceof Error ? err.message : '提交失败');
      setError(msg);
    }
    finally { setLoading(false); }
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 6);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    setError('');
    try {
      const uploaded = await Promise.all(files.map(uploadWarrantyPhoto));
      updateField('photo_keys', uploaded.map((item) => item.fileKey));
      setPhotoNames(files.map((file) => file.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : '照片上传失败');
      updateField('photo_keys', []);
      setPhotoNames([]);
    } finally {
      setUploadingPhotos(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">提交成功</h2>
        <p className="mt-2 text-gray-500">{success}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/store/records')} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">查看记录</button>
          <button onClick={() => { setSuccess(''); setCodeQuery(''); setCodeOptions([]); setStep(0); setPhotoNames([]); setForm({ warranty_code: '', customer_name: '', customer_phone: '', plate_no: '', vin: '', vehicle_brand: '', vehicle_model: '', vehicle_year: '', installation_date: '', photo_keys: [] }); }}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">继续登记</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="录入质保" description="为车主登记质保信息" />
      <StepWizard steps={STEPS} currentStep={step} onStepClick={setStep}>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <div className="bg-white rounded-xl border border-gray-100 p-6 min-h-[300px]">
          {step === 0 && (
            <div className="max-w-md" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">质保码 *</label>
              <div className="relative">
                <input
                  value={codeQuery}
                  onChange={(e) => handleCodeInput(e.target.value)}
                  onFocus={() => { if (codeOptions.length > 0) setDropdownOpen(true); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="输入字母或数字搜索质保码"
                  autoComplete="off"
                />
                {dropdownOpen && codeOptions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-100 shadow-lg max-h-56 overflow-y-auto">
                    {codeOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectCode(item)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#5C1A1A]/5 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <span className="font-medium text-gray-900">{item.code}</span>
                        <span className="ml-2 text-xs text-gray-400">{item.model_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">输入质保码后自动匹配门店库存中的可用质保码</p>
            </div>
          )}

          {step === 1 && (
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车主姓名 *</label>
                <input value={form.customer_name} onChange={(e) => updateField('customer_name', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                <input value={form.customer_phone} onChange={(e) => updateField('customer_phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车牌号 *</label>
                <input value={form.plate_no} onChange={(e) => updateField('plate_no', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN（车架号）</label>
                <input value={form.vin} onChange={(e) => updateField('vin', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车辆品牌 *</label>
                <input value={form.vehicle_brand} onChange={(e) => updateField('vehicle_brand', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车辆型号 *</label>
                <input value={form.vehicle_model} onChange={(e) => updateField('vehicle_model', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">施工日期 *</label>
              <input type="date" value={form.installation_date} onChange={(e) => updateField('installation_date', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">施工照片</label>
              <input type="file" accept="image/*" multiple
                onChange={handlePhotoSelect}
                disabled={uploadingPhotos}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
              <p className="mt-2 text-xs text-gray-400">{uploadingPhotos ? '照片上传中...' : '上传施工过程照片，最多 6 张，每张不超过 10MB'}</p>
              {photoNames.length > 0 && (
                <p className="mt-2 text-xs text-emerald-600">已上传 {photoNames.length} 张：{photoNames.join('、')}</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 max-w-lg">
              <h3 className="text-sm font-semibold text-gray-900">请核对以下信息</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['质保码', form.warranty_code], ['车主', form.customer_name], ['电话', form.customer_phone],
                  ['车牌', form.plate_no], ['VIN', form.vin || '-'], ['品牌', form.vehicle_brand],
                  ['型号', form.vehicle_model], ['施工日期', form.installation_date],
                ].map(([label, val]) => (
                  <div key={label}><span className="text-gray-500">{label}</span><p className="text-gray-900 font-medium">{val || '-'}</p></div>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={loading || uploadingPhotos}
                className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 mt-4">
                {loading ? '提交中...' : '确认提交'}
              </button>
            </div>
          )}
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">上一步</button>
          {step < 4 && (
            <button onClick={() => setStep(step + 1)}
              className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">下一步</button>
          )}
          {step === 4 && (
            <button onClick={() => setStep(5)}
              className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">确认提交</button>
          )}
        </div>
      </StepWizard>
    </div>
  );
}
