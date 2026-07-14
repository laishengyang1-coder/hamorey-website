// ============================================================
// 和膜 HAMOREY — ServiceFlow 全车资产管家流程
// 四个连续环节
// ============================================================

import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../ScrollReveal';
import { Link } from 'react-router-dom';

interface FlowStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: FlowStep[] = [
  {
    number: '01',
    title: '选择产品',
    description: '根据车辆和使用需求，从五大产品体系中匹配最适合的膜类组合。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="18" rx="2" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <path d="M4 14h24M10 8V4M22 8V4" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="19" r="3" stroke="var(--brand-primary)" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    number: '02',
    title: '授权施工',
    description: '由和膜授权门店完成标准施工，全程拍照留档，确保交付品质。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4l10 6v12l-10 6L6 22V10l10-6z" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <path d="M16 10v12M10 13l12 6M22 13l-12 6" stroke="var(--brand-primary)" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  },
  {
    number: '03',
    title: '电子质保',
    description: '总部审核后形成可查询的电子质保证书，三码合一，随时验证。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 3l11 5v8c0 7-5 11-11 13C5 27 0 23 0 16V8l16-5z" transform="translate(2 0)" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <path d="M11 16l4 4 8-8" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: '04',
    title: '售后与理赔',
    description: '车主和保险公司可在线查询产品、质保和部位报价，长期守护车辆资产。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" stroke="var(--brand-primary)" strokeWidth="1.5" />
        <path d="M16 10v6l4 2" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function ServiceFlow() {
  return (
    <section className="py-16 md:py-24 bg-graphite">
      <Container>
        <ScrollReveal>
          <SectionHeading
            subtitle="Full-Vehicle Asset Guardian"
            title="全车资产管家"
            description="把品牌口号转化为清晰的服务流程，让每一次施工都有记录，每一份保障都可查询。"
          />
        </ScrollReveal>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 100}>
              <div className="relative flex flex-col gap-4 p-6 rounded-lg bg-elevated border border-border-subtle h-full transition-normal hover:border-border-default">
                {/* 连接线（桌面端） */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-3 w-6 h-px bg-border-default z-10" />
                )}
                <div className="flex items-center justify-between">
                  <div className="text-content-brand">{step.icon}</div>
                  <span className="text-2xl font-bold text-border-default/50">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-content-primary">
                  {step.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/service"
            className="inline-flex items-center gap-1 text-sm font-medium text-content-brand hover:text-brand-light transition-fast"
          >
            了解完整服务闭环 →
          </Link>
        </div>
      </Container>
    </section>
  );
}
