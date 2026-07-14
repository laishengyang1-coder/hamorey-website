// ============================================================
// 和膜 HAMOREY — ProductSeriesHighlight 产品系列精选
// 分类标签切换，每次展示3-5个重点系列
// ============================================================

import { useState } from 'react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../ScrollReveal';
import { Badge } from '../ui/Badge';
import { productCategories, type ProductCategoryConfig } from '../../config/products';
import { cn } from '../../lib/cn';

export function ProductSeriesHighlight() {
  // 只有有系列的分类才显示标签
  const categoriesWithSeries = productCategories.filter((c) => c.series.length > 0);
  const [activeCategory, setActiveCategory] = useState<ProductCategoryConfig>(
    categoriesWithSeries[0],
  );

  return (
    <section className="py-16 md:py-24 bg-graphite">
      <Container>
        <ScrollReveal>
          <SectionHeading
            subtitle="Featured Series"
            title="产品系列精选"
            description="和膜不只是分类名称，每个产品体系都有明确的系列和型号。"
          />
        </ScrollReveal>

        {/* 分类标签 */}
        <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-2">
          {categoriesWithSeries.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-fast',
                activeCategory.category === cat.category
                  ? 'bg-brand text-white'
                  : 'bg-elevated text-content-secondary hover:text-content-primary border border-border-subtle',
              )}
            >
              {cat.nameCn}
            </button>
          ))}
        </div>

        {/* 系列卡片 */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {activeCategory.series.map((series, index) => (
            <ScrollReveal key={series.code} delay={index * 80}>
              <div className="flex flex-col gap-3 p-6 rounded-lg bg-elevated border border-border-subtle transition-normal hover:border-border-default h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-content-primary">
                      {series.nameCn}
                    </h3>
                    <p className="text-sm text-content-brand mt-0.5">
                      {series.nameEn}
                    </p>
                  </div>
                  <Badge variant="brand">{series.warrantyYears}年质保</Badge>
                </div>
                <p className="text-sm text-content-secondary">{series.tagline}</p>
                <ul className="flex flex-col gap-1.5 mt-1">
                  {series.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-center gap-2 text-sm text-content-secondary"
                    >
                      <span className="text-content-brand">·</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
                {!series.paramsConfirmed && (
                  <p className="text-xs text-content-muted mt-1">
                    参数待补充
                  </p>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
