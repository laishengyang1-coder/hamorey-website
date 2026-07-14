// ============================================================
// 和膜 HAMOREY — 404 页面
// ============================================================

import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { siteConfig } from '../config/site';

export default function NotFoundPage() {
  useSEO('404');

  return (
    <div className="min-h-[calc(100vh-var(--nav-height))] flex items-center justify-center">
      <Container size="narrow">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* 404 大字 */}
          <h1 className="text-8xl md:text-9xl font-bold text-brand/20">404</h1>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-content-primary">
              页面未找到
            </h2>
            <p className="text-sm text-content-secondary max-w-md text-balance">
              您访问的页面不存在或已被移除。请返回首页继续浏览和膜 HAMOREY 的产品与服务。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/">
              <Button size="lg">返回首页</Button>
            </Link>
            <Link to="/products">
              <Button size="lg" variant="outline">
                浏览产品
              </Button>
            </Link>
          </div>

          {/* 快速链接 */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/warranty" className="text-content-brand hover:text-brand-light transition-fast">
              质保查询
            </Link>
            <Link to="/stores" className="text-content-brand hover:text-brand-light transition-fast">
              授权门店
            </Link>
            <Link to="/partner" className="text-content-brand hover:text-brand-light transition-fast">
              百店计划
            </Link>
            <Link to="/contact" className="text-content-brand hover:text-brand-light transition-fast">
              联系我们
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
