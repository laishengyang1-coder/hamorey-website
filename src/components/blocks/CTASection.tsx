// ============================================================
// 和膜 HAMOREY — CTASection 页尾三栏行动区
// 车主找门店 / 查询质保 / 门店申请合作
// ============================================================

import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { siteConfig } from '../../config/site';

const actions = [
  {
    eyebrow: 'For Owners',
    title: '寻找授权门店',
    text: '按省份城市查找附近的和膜授权门店，获得正规施工与质保。',
    href: '/stores',
    cta: '查找门店',
  },
  {
    eyebrow: 'E-Warranty',
    title: '查询电子质保',
    text: '输入手机号、车牌号、车架号或质保码，查看整车质保记录。',
    href: '/warranty',
    cta: '立即查询',
  },
  {
    eyebrow: 'For Partners',
    title: '加入和膜百店计划',
    text: '面向汽车服务门店与区域伙伴，提供产品、品牌、数字质保与培训支持。',
    href: '/partner',
    cta: '申请合作',
  },
];

export function CTASection() {
  return (
    <section className="bg-[#0B0606] py-20 md:py-24 text-white">
      <Container>
        <div className="text-center">
          <p className="text-xs md:text-sm font-medium tracking-[0.3em] text-[#D9B97A] uppercase">
            {siteConfig.brandNameEn}
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">{siteConfig.cta.title}</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
          {actions.map((a) => (
            <Link
              key={a.href}
              to={a.href}
              className="group flex flex-col bg-[#0B0606] p-8 md:p-10 transition-colors hover:bg-[#1A0D0D]"
            >
              <span className="text-[11px] font-medium tracking-[0.25em] text-[#D9B97A] uppercase">
                {a.eyebrow}
              </span>
              <h3 className="mt-3 text-xl md:text-2xl font-bold">{a.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">{a.text}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
                {a.cta}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
