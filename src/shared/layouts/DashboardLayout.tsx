// ============================================================
// DashboardLayout — 后台通用布局（轻量专业风格）
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuth } from '../hooks/useAuth';

export interface MenuItem {
  key: string;
  label: string;
  path: string;
  badge?: number;
  children?: MenuItem[];
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentPath = location.pathname;

  // 递归查找所有叶子项的 key→path 映射用于 active 判定
  const leafMap = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.children?.length) walk(item.children);
        else map.set(item.key, item.path);
      }
    };
    walk(menuItems);
    return map;
  }, [menuItems]);

  // 查找当前路径匹配的叶子 key
  const activeKey = useMemo(() => {
    let best: { key: string; len: number } | null = null;
    for (const [key, path] of leafMap) {
      if (currentPath.startsWith(path) && path.length > (best?.len ?? 0)) {
        best = { key, len: path.length };
      }
    }
    return best?.key ?? '';
  }, [currentPath, leafMap]);

  // 自动展开含 active 子项的分组
  useEffect(() => {
    const toExpand = new Set<string>();
    const walk = (items: MenuItem[], parentKey?: string) => {
      for (const item of items) {
        if (item.children?.length) {
          walk(item.children, item.key);
        } else if (item.key === activeKey && parentKey) {
          toExpand.add(parentKey);
        }
      }
    };
    walk(menuItems);
    if (toExpand.size > 0) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        for (const k of toExpand) next.add(k);
        return next;
      });
    }
  }, [activeKey, menuItems]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
          {menuItems.map((item) => {
            const isParent = item.children && item.children.length > 0;
            const isExpanded = expandedGroups.has(item.key);
            const hasActiveChild = item.children?.some((child) =>
              child.children
                ? child.children.some((c) => leafMap.get(c.key) && currentPath.startsWith(leafMap.get(c.key)!))
                : leafMap.get(child.key) && currentPath.startsWith(leafMap.get(child.key)!)
            );

            if (isParent) {
              return (
                <div key={item.key} className="mb-0.5">
                  <button
                    onClick={() => toggleGroup(item.key)}
                    className={cn(
                      'flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all text-left',
                      hasActiveChild
                        ? 'text-[#5C1A1A] font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className={cn('shrink-0 w-1 h-1 rounded-full', hasActiveChild ? 'bg-[#5C1A1A]' : 'bg-transparent')} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate text-xs font-medium uppercase tracking-wider text-gray-400">
                          {item.label}
                        </span>
                        <svg
                          className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {!sidebarCollapsed && isExpanded && (
                    <div className="ml-3 mt-0.5 border-l border-gray-100">
                      {item.children!.map((child) => {
                        const childActive = leafMap.get(child.key) && currentPath.startsWith(leafMap.get(child.key)!);
                        return (
                          <Link
                            key={child.key}
                            to={child.path}
                            className={cn(
                              'flex items-center gap-2 py-1.5 pl-4 pr-2 text-sm transition-all rounded-r-md',
                              childActive
                                ? 'text-[#5C1A1A] font-medium bg-[#5C1A1A]/5'
                                : 'text-gray-500 hover:text-gray-700',
                            )}
                          >
                            <span className="truncate">{child.label}</span>
                            {child.badge !== undefined && child.badge > 0 && (
                              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // 叶子节点（无 children 的独立项）
            const leafActive = leafMap.get(item.key) && currentPath.startsWith(leafMap.get(item.key)!);
            const isDashboard = item.key === 'dashboard';
            return (
              <React.Fragment key={item.key}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all mb-0.5',
                    isDashboard
                      ? 'text-sm font-semibold'
                      : 'text-sm',
                    leafActive
                      ? isDashboard
                        ? 'bg-[#5C1A1A] text-white'
                        : 'bg-[#5C1A1A]/8 text-[#5C1A1A] font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {isDashboard ? (
                    <svg className="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={leafActive ? 2 : 1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ) : (
                    <span className={cn('shrink-0 w-1 h-1 rounded-full', leafActive ? 'bg-[#5C1A1A]' : 'bg-transparent')} />
                  )}
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">{item.badge}</span>
                  )}
                </Link>
                {isDashboard && !sidebarCollapsed && (
                  <div className="mx-2 mb-2 border-b border-gray-100" />
                )}
              </React.Fragment>
            );
          })}
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
