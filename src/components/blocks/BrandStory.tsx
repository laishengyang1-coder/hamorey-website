// ============================================================
// 和膜 HAMOREY — BrandStory 品牌定义区块
// 左：品牌主张 + 三个价值点；右：品牌摄影拼图
// ============================================================

import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { ScrollReveal } from '../ScrollReveal';
import lifestyleA from '../../assets/hamorey/lifestyle-0.jpg';
import lifestyleB from '../../assets/hamorey/lifestyle-2.jpg';

const pillars = [
  {
    title: '产品',
    text: '窗膜、隐形车衣、TPU 改色车衣、天窗冰甲、建筑家居膜五大体系，按场景与预算分级。',
  },
  {
    title: '施工',
    text: '授权门店三级体系，统一施工标准，施工过程拍照留档。',
  },
  {
    title: '保障',
    text: '质保码一码一车，电子质保证书在线可查，车身部位理赔有据可依。',
  },
];

export function BrandStory() {
  return (
    <section className="bg-carbon py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal>
            <p className="text-xs md:text-sm font-medium tracking-[0.3em] text-content-brand uppercase">
              Brand Definition
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold leading-tight text-content-primary text-balance">
              一次选择，长期守护
            </h2>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-content-secondary">
              和膜是和和新材（股票代码 870328）旗下的汽车膜品牌。我们把产品、施工与数字质保连接起来，
              让每一次施工都有记录，每一份保障都可查询。
            </p>

            <ul className="mt-10 divide-y divide-border-subtle border-y border-border-subtle">
              {pillars.map((p, i) => (
                <li key={p.title} className="flex gap-6 py-5">
                  <span className="w-8 shrink-0 text-sm font-semibold text-content-brand">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-content-primary">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-content-secondary">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to="/brand"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-content-brand hover:gap-3 transition-all"
            >
              了解和膜品牌 →
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden rounded-lg">
                <img src={lifestyleA} alt="和膜品牌视觉" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="mt-12 aspect-[3/4] overflow-hidden rounded-lg">
                <img src={lifestyleB} alt="和膜品牌视觉" className="h-full w-full object-cover" loading="lazy" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
