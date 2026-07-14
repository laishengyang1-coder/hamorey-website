// ============================================================
// 和膜 HAMOREY — 品牌介绍页 /brand/
// 8个内容区块
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { QualitySystem } from '../components/blocks/QualitySystem';
import { siteConfig } from '../config/site';

const brandValues = [
  { title: '专业', description: '以材料科学与涂布工艺为核心，持续优化产品性能。' },
  { title: '品质', description: '从原料到成品的全过程质量管控，确保每一卷膜都达标。' },
  { title: '服务', description: '三级门店体系与数字质保系统，让每一次施工可追溯。' },
];

const brandTimeline = [
  { phase: '产品销售', description: '提供高质量汽车膜产品，建立基础产品认知。' },
  { phase: '服务升级', description: '建立授权门店体系，标准化施工与交付。' },
  { phase: '资产管理', description: '以数字质保连接产品与服务，构建全车资产管理体系。' },
];

export default function BrandPage() {
  useSEO('brand');

  return (
    <PageLayout
      hero
      subtitle="Brand"
      title="和膜，不止于膜"
      description="和膜是面向中国车主、保险公司和渠道伙伴的高端汽车膜品牌，以全车资产管家为定位。"
    >
      {/* 1. 品牌定位 */}
      <ScrollReveal>
        <SectionHeading
          align="left"
          title="品牌定位"
          description="高端汽车膜品牌 · 全车资产管家"
        />
        <p className="mt-4 text-base text-content-secondary leading-relaxed max-w-3xl">
          和膜 HAMOREY 不是将海外官网翻译成中文，而是基于中国市场的实际需求，
          重新建设一套适合国内品牌长期经营的数字化系统。我们以产品、智能与服务，
          构建覆盖选膜、施工、质保与理赔的全车资产管理体系。
        </p>
      </ScrollReveal>

      {/* 2. 品牌价值 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Core Values" title="品牌价值" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {brandValues.map((value, index) => (
            <ScrollReveal key={value.title} delay={index * 100}>
              <Card padding="lg" className="h-full">
                <h3 className="text-2xl font-bold text-content-brand mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {value.description}
                </p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 3. 从产品销售到长期资产管理 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Evolution"
          title="从产品销售到长期资产管理"
          description="和膜的品牌思路不只是卖出一卷膜，而是建立车辆全生命周期的防护记录。"
        />
        <div className="mt-8 flex flex-col gap-4">
          {brandTimeline.map((item, index) => (
            <ScrollReveal key={item.phase} delay={index * 100}>
              <div className="flex items-start gap-4 p-5 rounded-lg bg-elevated border border-border-subtle">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-sm font-bold text-content-brand">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">
                    {item.phase}
                  </h3>
                  <p className="text-sm text-content-secondary mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 4. 企业与工厂实力 */}
      <div className="mt-16">
        <QualitySystem />
      </div>

      {/* 5. 授权服务体系与百店计划 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Service Network"
          title="授权服务体系"
          description="三级门店体系，统一标准，长期经营。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { level: 'HEBC', name: '品牌灯塔店', desc: '城市级品牌形象标杆' },
            { level: 'HSS', name: '标准服务中心', desc: '区域级标准服务' },
            { level: 'Service Point', name: '区域服务点', desc: '社区级便捷服务' },
          ].map((tier, index) => (
            <ScrollReveal key={tier.level} delay={index * 100}>
              <Card padding="lg" className="h-full">
                <Badge variant="brand">{tier.level}</Badge>
                <h3 className="mt-3 text-lg font-semibold text-content-primary">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-content-secondary">{tier.desc}</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 6. 联系或合作入口 */}
      <ScrollReveal className="mt-16">
        <Card padding="lg" className="text-center">
          <h3 className="text-xl font-semibold text-content-primary">
            与和膜一起，共建全车资产管家服务网络
          </h3>
          <p className="mt-3 text-sm text-content-secondary max-w-xl mx-auto">
            无论您是车主、保险公司还是潜在合作伙伴，我们都欢迎您与和膜建立联系。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <span className="text-sm text-content-muted">
              联系电话：{siteConfig.contact.phone}
            </span>
            <span className="text-sm text-content-muted">
              邮箱：{siteConfig.contact.email}
            </span>
          </div>
        </Card>
      </ScrollReveal>

      {/* 页尾行动区 */}
      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
