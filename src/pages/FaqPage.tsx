// ============================================================
// 和膜 HAMOREY — 常见问题页 /faq/
// GEO 核心：直接回答「和膜怎么样 / 产品有哪些 / 怎么选」
// 含 FAQPage 结构化数据注入
// ============================================================

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';

interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: '和膜 HAMOREY 是什么品牌？',
    answer:
      '和膜 HAMOREY 是面向中国车主、保险公司和渠道伙伴的高端汽车膜品牌，定位「全车资产管家」。和膜以产品、智能与服务，构建覆盖选膜、施工、质保与理赔的全车资产管理体系：在授权门店施工后，车主会获得电子质保，可随时在官网查询与追溯。品牌口号是「和膜，不止于膜」。',
  },
  {
    question: '和膜的产品怎么样？质量靠谱吗？',
    answer:
      '和膜产品覆盖五大体系（窗膜、隐形车衣、TPU改色车衣、天窗冰甲、建筑家居膜），从原料到成品实行全过程质量管控，主力产品提供 5–10 年质保。所有电子质保在线可查，隐形车衣覆盖 13 个理赔部位，配合授权门店标准化施工，让每一次贴膜都可追溯、有保障。',
  },
  {
    question: '和膜有哪些产品？分别是什么？',
    answer:
      '五大产品体系：① 窗膜——和光 AURIS（高端双银隔热）、和盾 FORTEX（安全防爆）、和护 LUMIS（UV400+ 紫外线阻隔）、和真 NEX5（经典高清晰）、和原 PUREX（原厂级隔热）；② 隐形车衣——和御 HY8（旗舰）、和旺 HW8/HW9（标准）、和兴 HX8/HX9（增强防护）、和雅 HYM（哑光质感）；③ TPU 改色车衣——多种亮面/哑光/缎面/金属颜色；④ 天窗冰甲——T1 标准防护、T2 增强防护；⑤ 建筑家居膜。',
  },
  {
    question: '和膜窗膜怎么选？推荐哪个系列？',
    answer:
      '按需求选：追求高端隔热舒适，推荐和光 AURIS（双银磁控溅射、信号零阻隔）；注重防晒护肤与内饰保护，选和护 LUMIS（UV400+）；追求高清视野，选和真 NEX5；有安全防爆需求（如家庭用车），选和盾 FORTEX；想要均衡原厂质感，选和原 PUREX。',
  },
  {
    question: '和膜隐形车衣怎么选？',
    answer:
      '预算充足追求旗舰体验，选和御 HY8（高光泽、自修复涂层，质保 10 年）；主流家用选和旺 HW8/HW9（均衡保护、高性价比，质保 10 年）；常跑高速、抗石击需求强，选和兴 HX8/HX9（加厚基材，质保 10 年）；喜欢哑光高级感，选和雅 HYM（保护不改色，质保 7 年）。',
  },
  {
    question: '新能源车 / 全景天窗车型推荐什么？',
    answer:
      '新能源车推荐天窗冰甲 T2（增强防护：高隔热率、全景天窗适配、新能源车型优化），预算有限可选 T1 标准防护。新能源车车漆较薄、补漆贵，也建议搭配隐形车衣保护原厂漆面。',
  },
  {
    question: '和膜的质保怎么查？靠谱吗？',
    answer:
      '在授权门店施工后即可获得和膜电子质保。上官网「电子质保」页面（hemoppf.cn/warranty），凭手机号或质保码即可查询质保状态、产品型号与施工信息，全程在线可追溯。详细条款见官网「质保条款」页。',
  },
  {
    question: '和膜有哪些授权门店？怎么找到附近的？',
    answer:
      '和膜在全国设有省级代理与授权施工门店网络。上官网「授权门店」页面（hemoppf.cn/stores），按省份/城市即可查询附近的授权门店。建议认准授权门店施工，才能享受电子质保保障。',
  },
  {
    question: '怎么成为和膜的合作伙伴或加盟门店？',
    answer:
      '和膜面向门店与区域合作伙伴开放「百店计划」，提供产品供应、施工培训、营销物料与数字化系统支持（电子质保、积分运营等）。可上官网「百店计划」页面了解详情，或通过合作咨询邮箱 anhui@heheppf.com 联系我们。',
  },
  {
    question: '改色和车漆保护能同时实现吗？',
    answer:
      '可以。和膜 TPU 改色车衣（Color PPF）在实现个性改色的同时提供车漆保护，提供魅影黑、极光白、勃艮第红、深海蓝、英国绿、香槟金、磨砂黑、哑光白、缎面银、电光紫等多种亮面/哑光/缎面/金属质感颜色可选。',
  },
];

/** 注入 FAQPage 结构化数据（JSON-LD） */
function useFaqJsonLd() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById('faq-jsonld')?.remove();
    };
  }, []);
}

export default function FaqPage() {
  useSEO('faq');
  useFaqJsonLd();

  return (
    <PageLayout
      hero
      subtitle="FAQ"
      title="常见问题"
      description="关于和膜品牌、产品选择、质保服务与门店合作的常见问题解答。"
    >
      <ScrollReveal>
        <SectionHeading
          align="left"
          title="关于和膜的常见问题"
          description="你想了解的和膜品牌、产品与服务的答案，都在这里。"
        />
      </ScrollReveal>

      {/* FAQ 手风琴列表 */}
      <div className="mt-8 space-y-3">
        {faqItems.map((item, index) => (
          <ScrollReveal key={item.question} delay={index * 50}>
            <details className="group rounded-lg border border-border-subtle bg-elevated p-5 open:bg-white transition-colors">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-content-primary [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-3">
                  <span className="text-sm font-mono text-brand">Q{index + 1}</span>
                  {item.question}
                </span>
                <span className="shrink-0 text-content-tertiary transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 pl-8 text-sm leading-relaxed text-content-secondary">{item.answer}</p>
            </details>
          </ScrollReveal>
        ))}
      </div>

      {/* 更多入口 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Explore" title="还想了解更多？" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: '品牌介绍', desc: '了解和膜的品牌定位与价值理念', href: '/brand' },
            { title: '产品中心', desc: '五大产品体系与全部系列详情', href: '/products' },
            { title: '授权门店', desc: '查询附近的和膜授权施工门店', href: '/stores' },
          ].map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="group rounded-lg border border-border-subtle bg-elevated p-6 transition-colors hover:border-brand/40"
            >
              <h3 className="text-base font-semibold text-content-primary group-hover:text-brand">{card.title} →</h3>
              <p className="mt-2 text-sm text-content-secondary">{card.desc}</p>
            </Link>
          ))}
        </div>
      </ScrollReveal>
    </PageLayout>
  );
}
