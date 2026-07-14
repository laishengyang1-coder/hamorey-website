// ============================================================
// 和膜 HAMOREY — 建筑家居膜分类页 /products/architectural-film/
// V1仅展示，不接质保
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import archFilmImg from '../assets/architectural-film.jpeg';

const directions = [
  {
    title: '隔热',
    description: '阻隔太阳热量，降低室内温度与空调能耗。',
    icon: '☀️',
  },
  {
    title: '隐私',
    description: '单向透视效果，白天室外不可见室内。',
    icon: '🔒',
  },
  {
    title: '装饰',
    description: '多种颜色与纹理选择，提升空间美感。',
    icon: '🎨',
  },
  {
    title: '安全',
    description: '防爆膜防止玻璃碎裂飞溅，保护人身安全。',
    icon: '🛡️',
  },
];

export default function ArchitecturalFilmPage() {
  useSEO('products/architectural-film');

  return (
    <PageLayout
      hero
      subtitle="Architectural Film"
      title="建筑家居膜"
      description="将玻璃保护延伸到居住与商业空间。和膜建筑家居膜，为住宅和商业空间提供隔热、隐私、装饰和安全方向解决方案。"
    >
      {/* 质保说明 */}
      <ScrollReveal>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
          <Badge variant="warning">提示</Badge>
          <p className="text-sm text-content-secondary">
            建筑家居膜暂不提供电子质保服务，V1仅做产品展示。
          </p>
        </div>
      </ScrollReveal>

      {/* 住宅和商业空间场景 */}
      <ScrollReveal className="mt-12">
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
          <img
            src={archFilmImg}
            alt="和膜建筑家居膜"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-content-primary">
              住宅 · 商业 · 安全
            </h2>
            <p className="mt-2 text-sm text-content-secondary max-w-xl">
              将汽车膜的技术积累延伸到建筑玻璃，守护生活与工作空间。
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* 隔热、隐私、装饰和安全方向 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Solutions"
          title="四大方向"
          description="根据不同空间需求，选择合适的膜类方案。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {directions.map((direction, index) => (
            <ScrollReveal key={direction.title} delay={index * 80}>
              <Card padding="lg" className="h-full text-center">
                <div className="text-3xl mb-3">{direction.icon}</div>
                <h3 className="text-base font-semibold text-content-primary mb-2">
                  {direction.title}
                </h3>
                <p className="text-sm text-content-secondary">{direction.description}</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 产品或解决方案分类 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Categories" title="产品分类" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">住宅系列</h3>
            <ul className="flex flex-col gap-2 text-sm text-content-secondary">
              <li>· 卧室隐私膜 — 单向透视，保护家庭隐私</li>
              <li>· 客厅隔热膜 — 阻隔热量，降低空调能耗</li>
              <li>· 浴室磨砂膜 — 透光不透影，装饰与隐私兼顾</li>
              <li>· 阳台防晒膜 — UV阻隔，保护家具不褪色</li>
            </ul>
          </Card>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">商业系列</h3>
            <ul className="flex flex-col gap-2 text-sm text-content-secondary">
              <li>· 办公楼隔热膜 — 大面积玻璃幕墙隔热方案</li>
              <li>· 商铺装饰膜 — 个性化装饰，提升品牌形象</li>
              <li>· 银行防爆膜 — 高级别安全防护</li>
              <li>· 酒店隔断膜 — 装饰与功能结合</li>
            </ul>
          </Card>
        </div>
      </ScrollReveal>

      {/* 项目合作咨询 */}
      <ScrollReveal className="mt-16">
        <div className="p-6 rounded-lg bg-elevated border border-border-subtle text-center">
          <h3 className="text-lg font-semibold text-content-primary mb-2">
            项目合作咨询
          </h3>
          <p className="text-sm text-content-secondary mb-4 max-w-xl mx-auto">
            如您有建筑家居膜项目需求，欢迎联系和膜团队获取定制方案。
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 rounded bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-fast"
          >
            联系我们
          </a>
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
