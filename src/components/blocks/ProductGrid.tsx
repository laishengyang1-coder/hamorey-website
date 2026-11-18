// ============================================================
// 和膜 HAMOREY — ProductGrid 产品体系（深色编辑式瓷砖）
// 桌面：隐形车衣大图 + 4 个小图；移动端单列
// ============================================================

import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { ScrollReveal } from '../ScrollReveal';
import { productCategories, type ProductCategoryConfig } from '../../config/products';
import { cn } from '../../lib/cn';

// 展示顺序：隐形车衣作为主推大图
const ORDER = ['ppf', 'window_film', 'color_ppf', 'sunroof_film', 'architectural_film'];

function Tile({ cat, large }: { cat: ProductCategoryConfig; large?: boolean }) {
  return (
    <Link
      to={cat.path}
      className={cn(
        'group relative block h-full overflow-hidden rounded-lg bg-[#1A0F0F] border border-white/10',
        large ? 'min-h-[360px] md:min-h-[560px]' : 'min-h-[268px]',
      )}
    >
      <img
        src={cat.image}
        alt={cat.nameCn}
        className="absolute inset-0 h-full w-full object-cover transition-[transform] duration-700 group-hover:scale-105"
        loading="lazy"
      />
      {/* 双层遮罩：确保明亮场景图（如建筑家居膜玻璃窗）上文字依然高对比清晰可读 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 drop-shadow-sm">
        <p className="text-[11px] md:text-xs font-semibold tracking-[0.25em] text-[#E6C88A] uppercase">
          {cat.nameEn}
        </p>
        <h3 className={cn('mt-2 font-bold text-white', large ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl')}>
          {cat.nameCn}
        </h3>
        <p className="mt-2 max-w-md text-sm text-white/80">{cat.oneLiner}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white group-hover:text-[#E6C88A] transition-colors">
          了解产品
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

export function ProductGrid() {
  const cats = ORDER.map((k) => productCategories.find((c) => c.category === k)).filter(
    (c): c is ProductCategoryConfig => Boolean(c),
  );
  const [main, ...rest] = cats;

  return (
    <section className="bg-[#0B0606] py-20 md:py-28">
      <Container>
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs md:text-sm font-medium tracking-[0.3em] text-[#D9B97A] uppercase">
                Product System
              </p>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold text-white">五大产品体系</h2>
              <p className="mt-4 max-w-xl text-base text-white/65">
                从车窗到车漆，从改色到天窗，再到居住空间——一套产品矩阵覆盖全车与玻璃防护。
              </p>
            </div>
            <Link
              to="/products"
              className="shrink-0 text-sm font-medium text-white/85 hover:text-[#D9B97A] transition-fast"
            >
              查看全部产品 →
            </Link>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {main && (
            <ScrollReveal className="h-full">
              <Tile cat={main} large />
            </ScrollReveal>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {rest.map((cat, i) => (
              <ScrollReveal key={cat.category} delay={i * 60} className="h-full">
                <Tile cat={cat} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
