// ============================================================
// DashboardLayout — 后台通用布局（Atelier Burgundy 设计）
// 深勃艮第侧栏 + 暖纸画布 + 香槟金点缀 + 衬线标题
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

const ROLE_LABEL: Record<DashboardLayoutProps['role'], string> = {
  admin: '总部',
  province: '省代',
  store: '门店',
};

export function DashboardLayout({ menuItems, role, title = '和膜 HAMOREY' }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
    <div className={cn('flex h-screen admin-canvas font-sans', sidebarCollapsed ? 'sidebar-collapsed' : '')}>
      {/* 侧栏 — 深勃艮第渐变 */}
      <aside
        className={cn(
          'admin-sidebar flex flex-col transition-all duration-300 ease-out shrink-0',
          sidebarCollapsed ? 'w-[68px]' : 'w-[232px]',
        )}
      >
        {/* 品牌区 */}
        <div className={cn('flex items-center gap-2.5 h-16 px-4 border-b border-white/10', sidebarCollapsed && 'justify-center px-0')}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-white/12 ring-1 ring-white/20 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold tracking-tight">和膜</span>
              </div>
              <div className="min-w-0 leading-tight">
                <p className="font-display text-base font-semibold text-white tracking-wide">HAMOREY</p>
                <p className="text-[10px] text-white/55 tracking-[0.2em] uppercase">质保管理</p>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-white/12 ring-1 ring-white/20 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">和</span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menuItems.map((item) => {
            const isParent = item.children && item.children.length > 0;
            const isExpanded = expandedGroups.has(item.key);
            const hasActiveChild = item.children?.some((child) =>
              child.children
                ? child.children.some((c) => leafMap.get(c.key) && currentPath.startsWith(leafMap.get(c.key)!))
                : leafMap.get(child.key) && currentPath.startsWith(leafMap.get(child.key)!),
            );

            if (isParent) {
              return (
                <div key={item.key}>
                  <button
                    onClick={() => toggleGroup(item.key)}
                    className={cn(
                      'flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left transition-colors',
                      hasActiveChild
                        ? 'text-white'
                        : 'text-white/55 hover:bg-white/8 hover:text-white/85',
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {sidebarCollapsed ? (
                      <span className="mx-auto h-1 w-1 rounded-full bg-white/40" />
                    ) : (
                      <>
                        <span className={cn('shrink-0 h-1 w-1 rounded-full transition-colors', hasActiveChild ? 'bg-[var(--accent-gold)]' : 'bg-white/30')} />
                        <span className="flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                          {item.label}
                        </span>
                        <svg
                          className={cn('h-3 w-3 text-white/40 transition-transform duration-200', isExpanded && 'rotate-90')}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {!sidebarCollapsed && isExpanded && (
                    <div className="mt-0.5 mb-1 ml-4 border-l border-white/12 pl-3 space-y-0.5">
                      {item.children!.map((child) => {
                        const childActive = leafMap.get(child.key) && currentPath.startsWith(leafMap.get(child.key)!);
                        return (
                          <Link
                            key={child.key}
                            to={child.path}
                            className={cn(
                              'flex items-center gap-2 py-1.5 pl-3 pr-2 text-sm rounded-md transition-colors',
                              childActive
                                ? 'bg-white/14 text-white font-medium shadow-[inset_2px_0_0_var(--accent-gold)]'
                                : 'text-white/60 hover:bg-white/8 hover:text-white/90',
                            )}
                          >
                            <span className="truncate">{child.label}</span>
                            {child.badge !== undefined && child.badge > 0 && (
                              <span className="ml-auto rounded-full bg-[var(--accent-gold)] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D0A0A]">
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
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all',
                    leafActive
                      ? isDashboard
                        ? 'bg-white text-[#5C1A1A] shadow-lg shadow-black/20 font-semibold'
                        : 'bg-white/14 text-white font-medium shadow-[inset_2px_0_0_var(--accent-gold)]'
                      : 'text-white/60 hover:bg-white/8 hover:text-white/90',
                    sidebarCollapsed && 'justify-center px-0',
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {isDashboard ? (
                    <svg className="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={leafActive ? 2.2 : 1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ) : (
                    <span className={cn('shrink-0 h-1.5 w-1.5 rounded-full', leafActive ? 'bg-[var(--accent-gold)]' : 'bg-white/30')} />
                  )}
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate text-sm">{item.label}</span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
                    <span className="ml-auto rounded-full bg-[var(--accent-gold)] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D0A0A]">
                      {item.badge}
                    </span>
                  )}
                </Link>
                {isDashboard && !sidebarCollapsed && (
                  <div className="mx-3 my-2 hairline-gold opacity-40" />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* 用户信息 + 退出 */}
        <div className="border-t border-white/10 p-3">
          <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
            <div className="h-9 w-9 rounded-full bg-white/14 ring-1 ring-white/20 flex items-center justify-center text-sm font-semibold text-white shrink-0">
              {user?.username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <p className="text-[11px] text-white/55 truncate">{user?.organization?.name}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主体 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 — 暖纸浮起 + 发丝边 */}
        <header className="flex items-center justify-between h-16 px-6 bg-[var(--paper-raised)] border-b border-[var(--paper-border)] shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-[var(--paper-muted)] hover:text-[var(--paper-text)] p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
            aria-label="切换侧栏"
          >
            <svg className={cn('h-5 w-5 transition-transform duration-300', sidebarCollapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--burgundy-tint)] px-3 py-1 text-xs font-medium text-[#5C1A1A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5C1A1A]" />
              {ROLE_LABEL[role]}后台
            </span>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--paper-text-soft)] hover:text-[#5C1A1A] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--burgundy-tint)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
              </svg>
              回到官网
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--paper-text-soft)] hover:text-[#5C1A1A] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--burgundy-tint)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
