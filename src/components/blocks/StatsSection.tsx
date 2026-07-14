// ============================================================
// 和膜 HAMOREY — StatsSection 百店计划区块
// ============================================================

import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../ScrollReveal';

interface StoreTier {
  level: string;
  name: string;
  description: string;
}

const tiers: StoreTier[] = [
  {
    level: 'HEBC',
    name: '品牌灯塔店',
    description: '城市级品牌形象标杆，全产品线体验与高端服务标准。',
  },
  {
    level: 'HSS',
    name: '标准服务中心',
    description: '区域级标准服务点，覆盖核心产品线与标准化施工。',
  },
  {
    level: 'Service Point',
    name: '区域服务点',
    description: '社区级便捷服务，提供基础产品施工与质保服务。',
  },
];

export function StatsSection() {
  return (
    <section className="py-16 md:py-24 bg-carbon">
      <Container>
        <ScrollReveal>
          <SectionHeading
            subtitle="Hundred Stores Plan"
            title="和膜百店计划"
            description="以产品体系、数字质保、品牌物料和门店服务工具，支持区域伙伴建立长期经营能力。"
          />
        </ScrollReveal>

        {/* 门店层级 */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {tiers.map((tier, index) => (
            <ScrollReveal key={tier.level} delay={index * 100}>
              <div className="flex flex-col gap-3 p-6 rounded-lg bg-elevated border border-border-subtle transition-normal hover:border-brand/30 h-full">
                <Badge variant="brand">{tier.level}</Badge>
                <h3 className="text-lg font-semibold text-content-primary">
                  {tier.name}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {tier.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={300}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-base text-content-secondary text-center max-w-lg text-balance">
              诚邀省代和门店合作伙伴加入和膜百店计划，共建全车资产管家服务网络。
            </p>
            <Link to="/partner">
              <Button size="lg">申请合作</Button>
            </Link>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
