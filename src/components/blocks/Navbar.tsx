// ============================================================
// 和膜 HAMOREY — Navbar 顶部导航
// 桌面端单行导航 + 移动端汉堡菜单
// ============================================================

import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { navItems } from '../../config/navigation';
import { siteConfig } from '../../config/site';
import { cn } from '../../lib/cn';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // 滚动时改变导航栏样式
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 路由变化时关闭移动端菜单
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-nav flex items-center transition-normal',
          scrolled
            ? 'bg-carbon/95 backdrop-blur-lg border-b border-border-subtle shadow-sm'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto w-full max-w-content px-6 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-content-primary">
              {siteConfig.brandName}
            </span>
            <span className="text-sm font-medium text-content-brand tracking-wider">
              {siteConfig.brandNameEn}
            </span>
          </Link>

          {/* 桌面端导航 */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative group">
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-2 text-sm font-medium rounded transition-fast',
                      'hover:text-content-primary',
                      item.highlight
                        ? 'text-content-brand'
                        : 'text-content-secondary',
                      isActive && 'text-content-primary',
                    )
                  }
                >
                  {item.label}
                </NavLink>
                {/* 产品体系下拉菜单 */}
                {item.children && (
                  <div className="absolute top-full left-0 mt-1 w-64 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-normal">
                    <div className="rounded-lg bg-elevated border border-border-subtle shadow-xl shadow-brand/10 p-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block px-3 py-2.5 rounded transition-fast hover:bg-graphite"
                        >
                          <div className="text-sm font-medium text-content-primary">
                            {child.label}
                          </div>
                          {child.description && (
                            <div className="text-xs text-content-muted mt-0.5">
                              {child.description}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 移动端菜单按钮 */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="打开菜单"
          >
            <span className="block w-5 h-0.5 bg-content-primary" />
            <span className="block w-5 h-0.5 bg-content-primary" />
            <span className="block w-5 h-0.5 bg-content-primary" />
          </button>
        </div>
      </header>

      {/* 移动端菜单 */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#3D0A0A]/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-carbon border-l border-border-subtle p-6 overflow-y-auto data-[state=open]:animate-scale-in">
            <Dialog.Title className="sr-only">导航菜单</Dialog.Title>
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-lg font-bold text-content-primary">
                  {siteConfig.brandName}
                </span>
                <span className="text-sm text-content-brand">{siteConfig.brandNameEn}</span>
              </Link>
              <Dialog.Close asChild>
                <button
                  className="p-2 text-content-secondary hover:text-content-primary"
                  aria-label="关闭菜单"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <div key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'block px-4 py-3 rounded text-base font-medium transition-fast',
                        item.highlight
                          ? 'text-content-brand bg-brand/10'
                          : 'text-content-secondary hover:text-content-primary hover:bg-elevated',
                        isActive && 'text-content-primary',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                  {item.children && (
                    <div className="ml-4 mt-1 mb-2 flex flex-col gap-0.5 border-l border-border-subtle pl-3">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={({ isActive }) =>
                            cn(
                              'block px-3 py-2 rounded text-sm transition-fast',
                              'text-content-muted hover:text-content-primary',
                              isActive && 'text-content-brand',
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
