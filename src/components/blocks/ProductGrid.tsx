// ============================================================
// 和膜 HAMOREY — ProductGrid 产品体系网格
// 非对称图片网格布局，移动端变为单列/双列
// ============================================================

import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../ScrollReveal';
import { ProductCard } from './ProductCard';
import { productCategories } from '../../config/products';

export function ProductGrid() {
  return (
    <section className="py-16 md:py-24 bg-carbon">
      <Container>
        <ScrollReveal>
          <SectionHeading
            subtitle="Product System"
            title="五大产品体系"
            description="从车窗到车漆，从改色到天窗，和膜以完整的产品矩阵覆盖全车防护需求。"
          />
        </ScrollReveal>

        {/* 非对称网格 */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-auto">
          {/* 窗膜 - 大卡片 */}
          <ScrollReveal className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <ProductCard category={productCategories[0]} size="large" />
          </ScrollReveal>

          {/* 隐形车衣 */}
          <ScrollReveal delay={100}>
            <ProductCard category={productCategories[1]} />
          </ScrollReveal>

          {/* TPU改色车衣 */}
          <ScrollReveal delay={200}>
            <ProductCard category={productCategories[2]} />
          </ScrollReveal>

          {/* 天窗冰甲 */}
          <ScrollReveal delay={100}>
            <ProductCard category={productCategories[3]} />
          </ScrollReveal>

          {/* 建筑家居膜 */}
          <ScrollReveal delay={200}>
            <ProductCard category={productCategories[4]} />
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
