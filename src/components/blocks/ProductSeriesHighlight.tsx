// ============================================================
// 和膜 HAMOREY — ProductSeriesHighlight 产品系列精选
// 对称网格（4列 / 2列）+ 核心规格参数 + 详情直达
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../ScrollReveal';
import { Badge } from '../ui/Badge';
import { productCategories, type ProductCategoryConfig } from '../../config/products';
import { cn } from '../../lib/cn';

export function ProductSeriesHighlight() {
  const categoriesWithSeries = productCategories.filter((c) => c.series.length > 0);
  const [activeCategory, setActiveCategory] = useState<ProductCategoryConfig>(
    categoriesWithSeries[0],
  );

  const count = activeCategory.series.length;

  return (
    <section className="py-20 md:py-28 bg-graphite">
      <Container>
        <ScrollReveal>
          <SectionHeading
            subtitle="Featured Series"
            title="主力产品系列与参数"
            description="从高光增亮、缎面哑光到新能源全景天窗隔热防爆，按保护等级与预算清晰分级。"
          />
        </ScrollReveal>

        {/* 分类切换标签 */}
        <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-2.5">
          {categoriesWithSeries.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-5 py-2.5 rounded text-sm font-medium transition-fast',
                activeCategory.category === cat.category
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-elevated text-content-secondary hover:text-content-primary border border-border-subtle',
              )}
            >
              {cat.nameCn}
            </button>
          ))}
          <Link
            to="/products/window-film"
            className="px-5 py-2.5 rounded text-sm font-medium bg-elevated text-content-secondary hover:text-content-brand border border-border-subtle transition-fast"
          >
            汽车窗膜参数表 →
          </Link>
        </div>

        {/* 系列卡片：4项用4列、2项用居中双列，消除孤立尾行 */}
        <div
          className={cn(
            'mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5',
            count >= 4 ? 'lg:grid-cols-4' : 'max-w-4xl mx-auto',
          )}
        >
          {activeCategory.series.map((series, index) => (
            <ScrollReveal key={series.code} delay={index * 60}>
              <div className="flex flex-col justify-between gap-4 p-6 rounded-lg bg-elevated border border-border-subtle transition-normal hover:border-brand/40 h-full">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-content-primary">
                        {series.nameCn}
                      </h3>
                      <p className="text-xs font-medium tracking-wider text-content-brand mt-0.5 uppercase">
                        {series.nameEn}
                      </p>
                    </div>
                    <Badge variant="brand">{series.warrantyYears}年质保</Badge>
                  </div>

                  <p className="text-sm text-content-secondary leading-relaxed">
                    {series.tagline}
                  </p>

                  <ul className="flex flex-col gap-1.5 pt-1">
                    {series.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-center gap-2 text-sm text-content-secondary"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {series.specs.length > 0 && (
                  <dl className="pt-4 mt-2 border-t border-border-subtle flex flex-col gap-1.5 text-xs">
                    {series.specs.map((sp) => (
                      <div key={sp.label} className="flex items-center justify-between gap-2">
                        <dt className="text-content-muted">{sp.label}</dt>
                        <dd className="font-semibold text-content-primary">{sp.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to={activeCategory.path}
            className="inline-flex items-center gap-2 text-sm font-semibold text-content-brand hover:gap-3 transition-all"
          >
            查看{activeCategory.nameCn}完整对比与理赔说明 →
          </Link>
        </div>
      </Container>
    </section>
  );
}
