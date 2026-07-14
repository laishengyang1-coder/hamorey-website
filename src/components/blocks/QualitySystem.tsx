// ============================================================
// 和膜 HAMOREY — QualitySystem 品牌实力区块
// ============================================================

import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../ScrollReveal';

interface QualityItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const items: QualityItem[] = [
  {
    title: '研发与实验室',
    description: '拥有专业材料实验室，持续优化膜层配方与涂布工艺。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M10 4v8L4 22c-1 2 0 4 2 4h16c2 0 3-2 2-4l-6-10V4" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <path d="M8 4h12" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '制造与质量体系',
    description: '标准化生产线与全过程质量管控，确保批次一致性。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="8" width="20" height="16" rx="2" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <path d="M10 8V4M18 8V4M4 14h20" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <circle cx="14" cy="19" r="2" stroke="var(--brand-primary)" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: '工厂和产能',
    description: '规模化产能保障供应稳定，满足全国渠道需求。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M2 24V10l8-4v18M10 24V14l8-4v14M18 24V12l8 4v8" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 24h24" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '认证资质',
    description: '产品通过多项国际与行业认证，品质有据可查。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <path d="M9 14l4 4 7-8" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: '品牌门店与服务标准',
    description: '三级门店体系，统一施工标准与服务流程。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 24V12l10-6 10 6v12" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 24v-6h8v6" stroke="var(--brand-primary)" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export function QualitySystem() {
  return (
    <section className="py-16 md:py-24 bg-graphite">
      <Container>
        <ScrollReveal>
          <SectionHeading
            subtitle="Brand Strength"
            title="品牌实力"
            description="以研发、制造、工厂、认证和服务标准建立长期信任。"
          />
        </ScrollReveal>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 80}>
              <div className="flex flex-col gap-3 p-6 rounded-lg bg-elevated border border-border-subtle transition-normal hover:border-border-default h-full">
                <div className="text-content-brand">{item.icon}</div>
                <h3 className="text-base font-semibold text-content-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            </ScrollReveal>
          ))}

          {/* 占位提示 */}
          <ScrollReveal delay={400}>
            <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-dashed border-border-default h-full">
              <p className="text-sm text-content-muted text-center">
                资质图标与认证素材待品牌方提供后替换
              </p>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
