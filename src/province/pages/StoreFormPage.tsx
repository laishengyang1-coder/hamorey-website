// ============================================================
// Province StoreFormPage — 省代创建门店表单页
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';

export default function StoreFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    code: '', name: '', province: '', city: '', address: '', contact_name: '', phone: '', username: '', password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('名称不能为空'); return; }
    if (!form.username.trim()) { setError('登录账号不能为空'); return; }
    if (form.password.length < 8) { setError('登录密码至少 8 位'); return; }

    setSaving(true);
    try {
      await apiRequest('/province/organizations', { method: 'POST', body: JSON.stringify({ ...form, code: undefined }) });
      navigate('/province/stores');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="新增门店" breadcrumb={[{ label: '下属门店', href: '/province/stores' }, { label: '新增门店' }]} />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">编码</label>
            <input value="（自动生成 MD-xxx）" disabled
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">省份</label>
            <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">登录账号 *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="off" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">登录密码 *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password" placeholder="至少 8 位" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/province/stores')}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828] transition-colors disabled:opacity-50">
              {saving ? '创建中...' : '创建门店'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
