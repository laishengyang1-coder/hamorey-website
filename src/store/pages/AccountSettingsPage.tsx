// ============================================================
// Store AccountSettingsPage — 门店账号设置
// ============================================================

import React, { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { useAuth } from '../../shared/hooks/useAuth';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setSuccess('');
    try {
      await apiRequest('/store/account', { method: 'PUT', body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }) });
      setSuccess('密码修改成功'); setOldPassword(''); setNewPassword('');
    } catch (err) { alert(err instanceof Error ? err.message : '修改失败'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="账号设置" description="修改登录密码" />
      <div className="max-w-md mt-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">当前账号</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{user?.username}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.organization?.name} ({user?.organization?.type})</p>
          </div>
          {success && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">原密码</label><input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">新密码（至少6位）</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" minLength={6} required /></div>
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50">{saving ? '保存中...' : '修改密码'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
