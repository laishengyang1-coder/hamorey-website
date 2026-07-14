// ============================================================
// 和膜 HAMOREY — 百店计划页 /partner/
// 合作对象/门店层级/产品支持/品牌支持/数字工具/培训/流程 + 合作申请表
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PartnerForm } from '../components/blocks/PartnerForm';

const partnerSections = [
  {
    title: '合作对象',
    items: ['省级代理商', '城市合作伙伴', '汽车美容门店', '汽车4S店集团', '汽车服务连锁'],
  },
  {
    title: '产品支持',
    items: ['五大产品体系全品类供应', '稳定产能与快速交付', '新品优先供应权', '产品培训与技术指导'],
  },
  {
    title: '品牌与门店形象支持',
    items: ['品牌视觉物料', '门店形象设计指导', '品牌推广资源', '区域广告支持'],
  },
  {
    title: '数字质保与积分工具',
    items: ['数字质保管理系统', '门店积分与兑换商城', '合作线索管理', '数据看板与运营支持'],
  },
  {
    title: '培训、施工和运营支持',
    items: ['标准化施工培训', '产品知识培训', '门店运营指导', '售后服务支持'],
  },
];

const cooperationProcess = [
  { step: '01', title: '提交申请', desc: '填写合作申请表，提交基本信息' },
  { step: '02', title: '初步沟通', desc: '和膜招商团队 1-3 个工作日内联系' },
  { step: '03', title: '实地考察', desc: '双方实地考察，评估合作条件' },
  { step: '04', title: '签约合作', desc: '签署合作协议，启动门店建设' },
];

export default function PartnerPage() {
  useSEO('partner');

  return (
    <PageLayout
      hero
      subtitle="Hundred Stores Plan"
      title="和膜百店计划"
      description="以产品体系、数字质保、品牌物料和门店服务工具，支持区域伙伴建立长期经营能力。"
    >
      {/* 门店层级 */}
      <ScrollReveal>
        <SectionHeading
          subtitle="Store Tiers"
          title="门店层级"
          description="三级门店体系，满足不同规模与定位的合作需求。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              level: 'HEBC',
              name: '品牌灯塔店',
              desc: '城市级品牌形象标杆，全产品线体验与高端服务标准，代表和膜品牌最高形象。',
            },
            {
              level: 'HSS',
              name: '标准服务中心',
              desc: '区域级标准服务点，覆盖核心产品线与标准化施工，面向大众市场提供正规服务。',
            },
            {
              level: 'Service Point',
              name: '区域服务点',
              desc: '社区级便捷服务，提供基础产品施工与质保服务，贴近车主日常需求。',
            },
          ].map((tier) => (
            <Card key={tier.level} padding="lg" className="h-full">
              <Badge variant="brand">{tier.level}</Badge>
              <h3 className="mt-3 text-lg font-semibold text-content-primary">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm text-content-secondary leading-relaxed">
                {tier.desc}
              </p>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* 合作支持内容 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Support" title="合作支持" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerSections.map((section) => (
            <Card key={section.title} padding="lg" className="h-full">
              <h3 className="text-base font-semibold text-content-primary mb-3">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-content-secondary">
                    <span className="text-content-brand mt-0.5">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* 合作流程 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Process" title="合作流程" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {cooperationProcess.map((item, index) => (
            <ScrollReveal key={item.step} delay={index * 80}>
              <div className="relative flex flex-col gap-3 p-6 rounded-lg bg-elevated border border-border-subtle h-full">
                <span className="text-3xl font-bold text-border-default/30">
                  {item.step}
                </span>
                <h3 className="text-base font-semibold text-content-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-content-secondary">{item.desc}</p>
                {index < cooperationProcess.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-content-muted">
                    →
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 合作申请表 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Application"
          title="合作申请"
          description="填写以下信息，和膜招商团队将在 1-3 个工作日内与您联系。"
        />
        <div className="mt-8 p-6 md:p-8 rounded-lg bg-elevated border border-border-subtle">
          <PartnerForm />
        </div>
      </ScrollReveal>
    </PageLayout>
  );
}
