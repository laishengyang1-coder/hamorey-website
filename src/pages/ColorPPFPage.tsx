// ============================================================
// 和膜 HAMOREY — TPU改色车衣分类页 /products/color-ppf/
// 颜色分类与材质分类 + 可点击色板
// ============================================================

import { useState } from 'react';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { colorPpfSwatches, ppfClaimParts, type ColorSwatch } from '../config/products';
import { cn } from '../lib/cn';
import colorPpfImg from '../assets/color-ppf.jpeg';

const materialCategories = ['亮面', '哑光', '缎面', '金属'] as const;

export default function ColorPPFPage() {
  useSEO('products/color-ppf');

  const [selectedColor, setSelectedColor] = useState<ColorSwatch>(colorPpfSwatches[0]);
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const filteredSwatches =
    activeCategory === '全部'
      ? colorPpfSwatches
      : colorPpfSwatches.filter((s) => s.category === activeCategory);

  return (
    <PageLayout
      hero
      subtitle="Color PPF"
      title="TPU改色车衣"
      description="个性表达与车漆保护同步完成。多种颜色与材质选择，让您的爱车与众不同。"
    >
      {/* 核心价值 */}
      <ScrollReveal>
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
          <img
            src={colorPpfImg}
            alt="和膜TPU改色车衣"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3D0A0A]/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white">
              改色 · 保护 · 个性
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              TPU材质改色车衣，既有个性表达，又有车漆保护。
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* 颜色分类与材质分类 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Color Selection"
          title="颜色与材质选择"
          description="选择您喜欢的颜色，查看预览效果。"
        />
      </ScrollReveal>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 色板选择 */}
        <ScrollReveal>
          <div className="flex flex-col gap-4">
            {/* 材质分类标签 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('全部')}
                className={cn(
                  'px-3 py-1.5 rounded-sm text-sm transition-fast',
                  activeCategory === '全部'
                    ? 'bg-brand text-white'
                    : 'bg-elevated text-content-secondary border border-border-subtle',
                )}
              >
                全部
              </button>
              {materialCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-sm transition-fast',
                    activeCategory === cat
                      ? 'bg-brand text-white'
                      : 'bg-elevated text-content-secondary border border-border-subtle',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 色板网格 */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {filteredSwatches.map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => setSelectedColor(swatch)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded transition-fast',
                    selectedColor.name === swatch.name
                      ? 'bg-brand/10 border border-brand'
                      : 'border border-border-subtle hover:border-border-default',
                  )}
                >
                  <span
                    className="w-full aspect-square rounded-sm border border-border-subtle"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-xs text-content-secondary text-center leading-tight">
                    {swatch.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 预览区 */}
        <ScrollReveal delay={200}>
          <Card padding="lg" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-content-primary">
                已选颜色
              </h3>
              <Badge variant="brand">{selectedColor.category}</Badge>
            </div>
            <div
              className="flex-1 rounded-lg flex items-center justify-center min-h-[200px]"
              style={{ backgroundColor: selectedColor.hex }}
            >
              <span className="text-2xl font-bold text-white/90 drop-shadow-lg">
                {selectedColor.name}
              </span>
            </div>
            <p className="mt-4 text-sm text-content-muted">
              色板为预设颜色展示，实际施工效果请到授权门店查看实物样板。
            </p>
          </Card>
        </ScrollReveal>
      </div>

      {/* TPU材质保护价值 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Material" title="TPU材质保护价值" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: '抗石击', desc: 'TPU材质具有优异的抗冲击性能，有效防止石子飞溅造成漆面损伤。' },
            { title: '自修复', desc: '轻微划痕在常温或加热条件下可自动修复，保持表面光洁。' },
            { title: '耐黄变', desc: '优质TPU基材抗紫外线老化，长期使用不易黄变。' },
          ].map((item) => (
            <Card key={item.title} padding="lg">
              <h3 className="text-base font-semibold text-content-brand mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-content-secondary">{item.desc}</p>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* 13个部位报价规则 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Claim Parts" title="13个部位报价规则" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ppfClaimParts.map((part, index) => (
            <div
              key={part}
              className="flex items-center gap-2 p-3 rounded bg-elevated border border-border-subtle"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-brand/15 flex items-center justify-center text-xs font-bold text-content-brand">
                {index + 1}
              </span>
              <span className="text-sm text-content-secondary">{part}</span>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
