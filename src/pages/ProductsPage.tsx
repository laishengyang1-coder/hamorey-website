// ============================================================
// 和膜 HAMOREY — 产品中心页 /products/
// ============================================================

import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ProductCard } from '../components/blocks/ProductCard';
import { CTASection } from '../components/blocks/CTASection';
import { productCategories } from '../config/products';

export default function ProductsPage() {
  useSEO('products');

  return (
    <PageLayout
      hero
      subtitle="Products"
      title="产品中心"
      description="五大产品体系，覆盖全车玻璃与漆面防护需求。从车窗到车漆，从改色到天窗，和膜以完整的产品矩阵守护您的爱车。"
    >
      {/* 五大分类导航 */}
      <ScrollReveal>
        <SectionHeading
          subtitle="Categories"
          title="五大产品分类"
          description="点击进入各分类详情页，了解产品系列与核心参数。"
        />
      </ScrollReveal>

      {/* 产品网格 */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-auto">
        {/* 窗膜 - 大卡片 */}
        <ScrollReveal className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <ProductCard category={productCategories[0]} size="large" />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <ProductCard category={productCategories[1]} />
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <ProductCard category={productCategories[2]} />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <ProductCard category={productCategories[3]} />
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <ProductCard category={productCategories[4]} />
        </ScrollReveal>
      </div>

      {/* 产品选择建议 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Guide" title="如何选择和膜产品" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: '核心优势',
              items: ['隔热降温', '高清晰度', '防爆安全', 'UV阻隔', '车漆保护', '个性改色'],
            },
            {
              title: '适用需求',
              items: ['日常通勤', '长途驾驶', '新能源车', '商务用车', '家用代步', '商业空间'],
            },
          ].map((group) => (
            <div key={group.title} className="p-6 rounded-lg bg-elevated border border-border-subtle">
              <h3 className="text-base font-semibold text-content-primary mb-4">
                {group.title}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="px-3 py-1.5 rounded-sm bg-graphite text-sm text-content-secondary border border-border-subtle"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* 选择授权门店或咨询产品 */}
      <ScrollReveal className="mt-16">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-elevated border border-border-subtle text-center">
          <h3 className="text-lg font-semibold text-content-primary">
            准备好为您的爱车选择和膜了吗？
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/stores"
              className="px-6 py-3 rounded bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-fast"
            >
              查找授权门店
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded border border-border-default text-content-primary text-sm font-medium hover:border-brand hover:text-content-brand transition-fast"
            >
              咨询产品
            </Link>
          </div>
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
