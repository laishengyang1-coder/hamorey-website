// ============================================================
// OrganizationForm — 省代/门店新建/编辑表单（共享组件）
// ============================================================

import React, { useState, useEffect } from 'react';

interface OrganizationFormData {
  code: string;
  name: string;
  type: 'PROVINCE' | 'STORE';
  parent_id?: string;
  province: string;
  city: string;
  contact_name: string;
  phone: string;
  username: string;
  password: string;
}

interface OrganizationFormProps {
  initial?: Partial<OrganizationFormData>;
  type: 'PROVINCE' | 'STORE';
  parentId?: string;
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function OrganizationForm({
  initial,
  type,
  parentId,
  onSubmit,
  onCancel,
  loading = false,
}: OrganizationFormProps) {
  const [form, setForm] = useState<OrganizationFormData>({
    code: initial?.code || '',
    name: initial?.name || '',
    type,
    parent_id: parentId || initial?.parent_id,
    province: initial?.province || '',
    city: initial?.city || '',
    contact_name: initial?.contact_name || '',
    phone: initial?.phone || '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        code: initial.code || '',
        name: initial.name || '',
        type: type,
        parent_id: parentId || initial.parent_id,
        province: initial.province || '',
        city: initial.city || '',
        contact_name: initial.contact_name || '',
        phone: initial.phone || '',
      });
    }
  }, [initial, type, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.code.trim()) { setError('编码不能为空'); return; }
    if (!form.name.trim()) { setError('名称不能为空'); return; }
    if (!initial?.code) {
      if (!form.username.trim()) { setError('账号不能为空'); return; }
      if (!form.password.trim()) { setError('密码不能为空'); return; }
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">编码 *</label>
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          disabled={!!initial?.code}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-50"
          placeholder={type === 'PROVINCE' ? '如: PROV-001' : '如: STORE-001'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          placeholder={type === 'PROVINCE' ? '如: 广东省代理' : '如: 广州旗舰店'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">省份</label>
          <input
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
          <input
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {!initial?.code && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-500 mb-3">登录账号设置</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号 *</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="登录用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="登录密码"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
