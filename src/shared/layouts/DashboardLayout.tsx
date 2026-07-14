// ============================================================
// DashboardLayout — 后台通用布局（轻量专业风格）
// ============================================================

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuth } from '../hooks/useAuth';

export interface MenuItem {
  key: string;
  label: string;
  path: string;
  badge?: number;
}

interface DashboardLayoutProps {
  menuItems: MenuItem[];
  role: 'admin' | 'province' | 'store';
  title?: string;
}

export function DashboardLayout({ menuItems, role, title = '和膜 HAMOREY' }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentPath = location.pathname;
  const activeKey = menuItems.find((item) => currentPath.startsWith(item.path))?.key;

  const handleLogout = async () => {
    await logout();
    navigate(`/${role}/login`, { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧栏 */}
      <aside className={cn('flex flex-col bg-white border-r border-gray-100 transition-all duration-200', sidebarCollapsed ? 'w-16' : 'w-56')}>
        {/* Logo 区域 */}
        <div className="flex items-center gap-2.5 h-14 px-4 border-b border-gray-100">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-[#5C1A1A] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold tracking-tight">和膜</span>
              </div>
              <span className="text-sm font-semibold text-gray-800 tracking-wide">HAMOREY</span>
            </div>
          ) : (
            <div className="h-7 w-7 rounded-md bg-[#5C1A1A] flex items-center justify-center shrink-0 mx-auto">
              <span className="text-white text-xs font-bold">和</span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all mb-0.5',
                activeKey === item.key
                  ? 'bg-[#5C1A1A]/8 text-[#5C1A1A] font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: activeKey === item.key ? '#5C1A1A' : 'transparent' }} />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
                <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* 用户信息 + 退出 */}
        <div className="border-t border-gray-100 p-3">
          <div className={cn('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
            <div className="h-7 w-7 rounded-full bg-[#5C1A1A]/10 flex items-center justify-center text-xs font-medium text-[#5C1A1A] shrink-0">
              {user?.username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{user?.username}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.organization?.name}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主体 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 */}
        <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-100">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          >
            <svg className={cn('h-5 w-5 transition-transform', sidebarCollapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded">
            退出登录
          </button>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
