// ============================================================
// 和膜 HAMOREY — 隐形车衣分类页 /products/ppf/
// 4个系列：和御HY8/和旺HW8·HW9/和兴HX8·HX9/和雅HYM哑光
// 含13个理赔部位说明
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { getCategoryConfig, ppfClaimParts } from '../config/products';
import ppfImg from '../assets/ppf.jpeg';

export default function PPFPage() {
  useSEO('products/ppf');

  const config = getCategoryConfig('ppf')!;

  return (
    <PageLayout
      hero
      subtitle="Paint Protection Film"
      title="隐形车衣"
      description="守护原厂车漆与车辆残值。和膜隐形车衣四大系列，以高光、修复、抗污、疏水和哑光效果守护您的爱车。"
    >
      {/* 核心价值 */}
      <ScrollReveal>
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
          <img
            src={ppfImg}
            alt="和膜隐形车衣"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3D0A0A]/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white">
              高光 · 修复 · 抗污 · 疏水
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              TPU 材质基膜，自修复涂层，守护原厂车漆与车辆残值。
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* 4个系列 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Series" title="隐形车衣四大系列" />
      </ScrollReveal>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.series.map((series, index) => (
          <ScrollReveal key={series.code} delay={index * 80}>
            <Card padding="lg" hover className="h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-content-primary">
                    {series.nameCn}
                  </h3>
                  <span className="text-sm text-content-brand">{series.nameEn}</span>
                </div>
                <Badge variant="brand">{series.warrantyYears}年质保</Badge>
              </div>
              <p className="text-sm text-content-secondary mb-3">{series.tagline}</p>
              <div className="flex flex-wrap gap-2">
                {series.highlights.map((h) => (
                  <Badge key={h} variant="default">{h}</Badge>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {/* 核心效果说明 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Features" title="核心效果" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: '高光', desc: '提升车漆光泽度' },
            { name: '修复', desc: '轻微划痕自修复' },
            { name: '抗污', desc: '抵抗污渍附着' },
            { name: '疏水', desc: '水珠快速滑落' },
            { name: '哑光', desc: '高级哑光质感' },
          ].map((feature) => (
            <div key={feature.name} className="p-4 rounded-lg bg-elevated border border-border-subtle text-center">
              <h4 className="text-base font-semibold text-content-brand">{feature.name}</h4>
              <p className="text-xs text-content-muted mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* 13个理赔部位 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Claim Parts"
          title="13个理赔报价部位"
          description="隐形车衣贴覆的车身部位，可用于保险理赔参考报价。"
        />
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

      {/* 电子质保说明 */}
      <ScrollReveal className="mt-16">
        <div className="p-6 rounded-lg bg-elevated border border-border-subtle">
          <h3 className="text-base font-semibold text-content-primary mb-3">
            电子质保与授权施工
          </h3>
          <p className="text-sm text-content-secondary leading-relaxed">
            和膜隐形车衣在授权门店施工后，可通过质保码登记电子质保。
            审核通过后生成可查询的电子质保证书，最长享10年质保服务。
            理赔时可通过官网质保查询查看13个部位的参考报价。
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
