// ============================================================
// 和膜 HAMOREY — Hero 首屏区块
// 全幅深色主视觉 + 左侧标题 + 底部信任条
// ============================================================

import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { siteConfig } from '../../config/site';
import heroImage from '../../assets/hamorey/hero.jpg';

const trustItems = [
  { value: '5', unit: '大', label: '全场景产品体系' },
  { value: '15', unit: '年', label: '旗舰最长官方质保' },
  { value: '13', unit: '项', label: '车身部位理赔报价' },
  { value: '1', unit: '车1档', label: '电子质保终身可溯' },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0B0606] text-white">
      {/* 背景图 */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt="和膜 HAMOREY 全车资产管家"
          className="h-full w-full object-cover object-[65%_center] opacity-90"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0606] via-[#0B0606]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0B0606] to-transparent" />
      </div>

      <Container className="flex min-h-[calc(100svh-var(--nav-height))] flex-col justify-center py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="hero-enter hero-enter-delay-1 mb-5 flex items-center gap-3 text-xs md:text-sm font-medium tracking-[0.3em] text-[#D9B97A] uppercase">
            <span className="h-px w-10 bg-[#D9B97A]" />
            {siteConfig.brandNameEn} · 全车资产管家
          </p>
          <h1 className="hero-enter hero-enter-delay-2 text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-balance">
            {siteConfig.slogan}
          </h1>
          <p className="hero-enter hero-enter-delay-3 mt-6 max-w-xl text-base md:text-lg leading-relaxed text-white/75 text-balance">
            窗膜、隐形车衣、TPU 改色车衣、天窗冰甲与建筑家居膜，
            授权门店标准施工，电子质保一车一档，覆盖选膜、施工、质保与理赔。
          </p>
          <div className="hero-enter hero-enter-delay-3 mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              to="/products"
              className="inline-flex h-12 items-center justify-center rounded px-8 text-sm font-semibold bg-brand text-white hover:bg-brand-hover transition-fast"
            >
              探索产品
            </Link>
            <Link
              to="/stores"
              className="inline-flex h-12 items-center justify-center rounded px-8 text-sm font-semibold border border-white/35 text-white hover:border-[#D9B97A] hover:text-[#D9B97A] transition-fast"
            >
              寻找授权门店
            </Link>
            <Link
              to="/warranty"
              className="inline-flex h-12 items-center justify-center px-2 text-sm font-semibold text-white/85 hover:text-[#D9B97A] transition-fast"
            >
              查询电子质保 →
            </Link>
          </div>
        </div>

        {/* 信任条 */}
        <dl className="hero-enter hero-enter-delay-3 mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 backdrop-blur-md">
          {trustItems.map((item) => (
            <div key={item.label} className="bg-[#0B0606]/75 px-5 py-5 md:px-7 md:py-6">
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="text-3xl md:text-4xl font-bold text-white">{item.value}</span>
                <span className="ml-1.5 text-sm font-semibold text-[#D9B97A]">{item.unit}</span>
                <p className="mt-1.5 text-xs md:text-sm text-white/75">{item.label}</p>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
