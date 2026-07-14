// ============================================================
// DashboardLayout — 后台通用布局（侧栏+顶栏+Outlet）
// ============================================================

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';

export interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
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
  const activeKey = menuItems.find((item) =>
    currentPath.startsWith(item.path),
  )?.key;

  const handleLogout = async () => {
    await logout();
    navigate(`/${role}/login`, { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧栏 */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-gray-100 transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 h-14 px-4 border-b border-gray-100">
          <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">和</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold text-gray-900 truncate">{title}</span>
          )}
        </div>

        {/* 菜单 */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors mb-0.5',
                activeKey === item.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon && <span className="shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>}
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs font-medium',
                      activeKey === item.key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600',
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* 折叠按钮 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center h-10 border-t border-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className={cn('h-5 w-5 transition-transform', sidebarCollapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* 主体 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 */}
        <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-100">
          <div />
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                {user?.username?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span className="hidden sm:inline">{user?.username}</span>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-100 bg-white shadow-lg z-20 py-1">
                  <div className="px-3 py-2 border-b border-gray-50">
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.organization?.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
