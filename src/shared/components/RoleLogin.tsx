// ============================================================
// RoleLogin — 后台角色登录（总部 / 省代 / 门店 共用）
// 勃艮第品牌头部 + 暖白表单卡 + 返回枢纽链接
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleLoginProps {
  /** 头像字符：和 / 省 / 店 */
  roleIcon: string;
  /** 系统标题，如「总部管理」 */
  roleTitle: string;
  /** 副标题提示 */
  roleSubtitle: string;
  /** 登录成功跳转路径 */
  redirectTo: string;
}

export function RoleLogin({ roleIcon, roleTitle, roleSubtitle, redirectTo }: RoleLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    }
  };

  const fieldClass =
    'h-11 w-full rounded-lg border border-[var(--paper-border-strong)] bg-white px-3.5 text-[15px] text-[var(--paper-text)] placeholder:text-[var(--paper-muted)] transition-colors focus:border-[#5C1A1A] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy-tint-strong)]';

  return (
    <div className="min-h-screen admin-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        {/* 品牌区 */}
        <div className="text-center mb-7">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5C1A1A] shadow-lg shadow-[#5C1A1A]/25 mb-4 ring-1 ring-[var(--accent-gold)]/40">
            <span className="text-white text-xl font-bold">{roleIcon}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--paper-text)] tracking-wide">和膜 HAMOREY</h1>
          <p className="mt-1.5 text-sm text-[var(--paper-muted)]">{roleSubtitle}</p>
        </div>

        {/* 登录卡 */}
        <form onSubmit={handleSubmit} className="admin-card p-7 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--paper-text)] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
              placeholder="请输入用户名"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--paper-text)] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              placeholder="请输入密码"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-[#B23A3A] bg-[#FBEAEA] border border-[#F0D5D5] rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#5C1A1A] text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#7A2828] active:bg-[#3D0A0A] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <a href="/login" className="inline-flex items-center gap-1 text-sm text-[var(--paper-muted)] hover:text-[#5C1A1A] transition-colors">
            <span aria-hidden>←</span> 返回登录枢纽
          </a>
        </div>
      </div>
    </div>
  );
}
