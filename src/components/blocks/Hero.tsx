// ============================================================
// 和膜 HAMOREY — Hero 首屏区块
// ============================================================

import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { siteConfig } from '../../config/site';
import heroImage from '../../assets/hero-main.png';

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-var(--nav-height))] flex items-center overflow-hidden">
      {/* 背景图片 */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="和膜 HAMOREY 全车资产管家"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* 深色氛围遮罩：左侧加深保证白字可读，右侧渐隐露出原图细节 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
        {/* 底部柔过渡：深色 Hero 自然融入下方浅色内容区 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FEFAF8] via-transparent to-transparent" />
      </div>

      {/* 内容 */}
      <Container className="relative z-10 py-20">
        <div className="max-w-2xl">
          <p className="hero-enter hero-enter-delay-1 text-sm md:text-base font-medium text-white/80 tracking-widest uppercase mb-4">
            {siteConfig.brandNameEn} · 全车资产管家
          </p>
          <h1 className="hero-enter hero-enter-delay-2 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-balance">
            {siteConfig.slogan}
          </h1>
          <p className="hero-enter hero-enter-delay-3 mt-6 text-base md:text-lg text-white/70 leading-relaxed max-w-xl text-balance">
            {siteConfig.description}
          </p>
          <div className="hero-enter hero-enter-delay-3 mt-8 flex flex-col sm:flex-row gap-4">
            <Link to="/products">
              <Button size="lg" className="w-full sm:w-auto">
                探索产品
              </Button>
            </Link>
            <Link to="/warranty">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:border-white hover:text-white">
                查询质保
              </Button>
            </Link>
          </div>
        </div>
      </Container>

      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-brand via-brand/50 to-transparent" />
    </section>
  );
}
