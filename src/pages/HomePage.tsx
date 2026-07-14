// ============================================================
// 和膜 HAMOREY — 首页
// 10 大区块：Hero + 品牌定义 + 产品体系 + 产品系列精选 +
// 全车资产管家 + 质保查询入口 + 授权门店 + 品牌实力 + 百店计划 + 页尾行动区
// ============================================================

import { useSEO } from '../lib/seo';
import { Hero } from '../components/blocks/Hero';
import { BrandStory } from '../components/blocks/BrandStory';
import { ProductGrid } from '../components/blocks/ProductGrid';
import { ServiceFlow } from '../components/blocks/ServiceFlow';
import { WarrantySearch } from '../components/blocks/WarrantySearch';
import { StoreFinder } from '../components/blocks/StoreFinder';
import { QualitySystem } from '../components/blocks/QualitySystem';
import { StatsSection } from '../components/blocks/StatsSection';
import { CTASection } from '../components/blocks/CTASection';
import { ProductSeriesHighlight } from '../components/blocks/ProductSeriesHighlight';

export default function HomePage() {
  useSEO('home');

  return (
    <>
      {/* 1. 首屏 Hero */}
      <Hero />

      {/* 2. 品牌定义 */}
      <BrandStory />

      {/* 3. 产品体系 */}
      <ProductGrid />

      {/* 4. 产品系列精选 */}
      <ProductSeriesHighlight />

      {/* 5. 全车资产管家 */}
      <ServiceFlow />

      {/* 6. 电子质保入口 */}
      <WarrantySearch />

      {/* 7. 授权门店预览 */}
      <StoreFinder />

      {/* 8. 品牌实力 */}
      <QualitySystem />

      {/* 9. 百店计划 */}
      <StatsSection />

      {/* 10. 页尾行动区 */}
      <CTASection />
    </>
  );
}
