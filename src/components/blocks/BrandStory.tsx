// ============================================================
// 和膜 HAMOREY — BrandStory 品牌定义区块
// ============================================================

import { Container } from '../ui/Container';
import { ScrollReveal } from '../ScrollReveal';
import { siteConfig } from '../../config/site';
import heroImage from '../../assets/hero-main.png';

export function BrandStory() {
  return (
    <section className="py-16 md:py-24 bg-carbon">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 文字 */}
          <ScrollReveal>
            <p className="text-sm font-medium text-content-brand tracking-wider uppercase mb-3">
              Brand Definition
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-6 text-balance">
              一次选择，长期守护
            </h2>
            <p className="text-base md:text-lg text-content-secondary leading-relaxed mb-6">
              {siteConfig.brandName}将窗膜、车衣、改色、天窗防护与数字质保连接起来，
              让每一次施工都有记录，每一份保障都可查询。
            </p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-bold text-content-brand">5</p>
                <p className="text-sm text-content-muted mt-1">大产品体系</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-content-brand">3</p>
                <p className="text-sm text-content-muted mt-1">级门店体系</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-content-brand">10年</p>
                <p className="text-sm text-content-muted mt-1">最长质保</p>
              </div>
            </div>
          </ScrollReveal>

          {/* 图片 */}
          <ScrollReveal delay={200}>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src={heroImage}
                alt="和膜品牌"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#3D0A0A]/30 via-transparent to-transparent" />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
