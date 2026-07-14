// ============================================================
// 和膜 HAMOREY — RootLayout 全局布局
// 包含 Navbar + Outlet + Footer
// ============================================================

import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '../components/blocks/Navbar';
import { Footer } from '../components/blocks/Footer';

export default function RootLayout() {
  const { pathname } = useLocation();

  // 路由变化时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-carbon">
      <Navbar />
      <main className="flex-1 pt-nav">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
