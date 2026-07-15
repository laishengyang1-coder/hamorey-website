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

        {/* 统一网格：桌面 3 列 / 平板 2 列 / 手机 1 列 */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {productCategories.map((cat, i) => (
            <ScrollReveal key={cat.code} delay={i * 80}>
              <ProductCard category={cat} size={i === 0 ? 'large' : 'default'} />
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
