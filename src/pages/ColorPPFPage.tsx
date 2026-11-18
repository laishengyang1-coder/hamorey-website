// ============================================================
// 和膜 HAMOREY — TPU改色车衣分类页 /products/color-ppf/
// 3D 选色展厅入口 + 首批20色拟真色板预览 + 材质与报价规则
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Car, Palette, Sparkles } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { ppfClaimParts } from '../config/products';
import {
  COLOR_STUDIO_SWATCHES,
  HECAI_SPEC,
  type ColorFilmItem,
  type FilmFinishType,
} from '../config/colorStudio';
import { cn } from '../lib/cn';
import colorPpfImg from '../assets/color-ppf.jpeg';

const finishTabs: Array<{ key: 'all' | FilmFinishType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'crystal', label: '水晶单色' },
  { key: 'metallic', label: '金属' },
  { key: 'pearlescent', label: '珠光' },
];

export default function ColorPPFPage() {
  useSEO('products/color-ppf');

  const [selectedColor, setSelectedColor] = useState<ColorFilmItem>(
    COLOR_STUDIO_SWATCHES[2],
  );
  const [activeFinish, setActiveFinish] = useState<'all' | FilmFinishType>('all');

  const filteredSwatches =
    activeFinish === 'all'
      ? COLOR_STUDIO_SWATCHES
      : COLOR_STUDIO_SWATCHES.filter((s) => s.finish === activeFinish);

  return (
    <PageLayout
      hero
      subtitle="Color PPF"
      title="TPU改色车衣"
      description="个性表达与车漆保护同步完成。首批 20 款水晶单色、金属与珠光膜色支持全屏 3D 实时换色预览。"
    >
      {/* 核心价值 */}
      <ScrollReveal>
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
          <img
            src={colorPpfImg}
            alt="和膜TPU改色车衣"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3D0A0A]/70 via-[#3D0A0A]/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                改色 · 保护 · 个性
              </h2>
              <p className="mt-2 text-sm text-white/80 max-w-xl">
                {HECAI_SPEC.modelName}（{HECAI_SPEC.thickness} 脂肪族光学级 TPU），既有原厂烤漆般高光质感，又有抗石击自修复保护。
              </p>
            </div>
            <Link
              to="/color-studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#1A1412] font-semibold text-sm hover:bg-white/90 transition-all shadow-lg self-start md:self-auto"
            >
              <Sparkles className="w-4 h-4 text-brand" />
              <span>进入 3D 选色展厅</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* 3D 在线选色展厅交互横幅 */}
      <ScrollReveal className="mt-10">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#14151a] via-[#1c1114] to-[#2e0c12] border border-brand/30 p-6 md:p-8 text-white shadow-xl">
          <div
            className="absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-25 blur-3xl pointer-events-none"
            style={{ background: selectedColor.shiftHex || selectedColor.hex }}
          />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#E6C483] mb-3">
                <Palette className="w-3.5 h-3.5" />
                <span>3D 在线选色展厅 · 选色从这里开始</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                赏鉴 3D 流光雕塑样板，一键装上 3D 超跑实看
              </h2>
              <p className="mt-2.5 text-sm text-white/70 leading-relaxed">
                解决「色卡好看、上车拿不准」痛点：内置高动态 HDR 影棚环境光与三档灯光切换，支持在 3D 悬浮曲率样板廊、微距颗粒、光影球体与 360° 整车之间无缝对比。
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                <span className="px-3 py-1 rounded-full bg-white/10">8 款水晶单色</span>
                <span className="px-3 py-1 rounded-full bg-white/10">6 款微晶金属</span>
                <span className="px-3 py-1 rounded-full bg-white/10">6 款双色珠光</span>
                <span className="px-3 py-1 rounded-full bg-white/10">整车 / 悬浮黑顶切换</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
              <Link
                to={`/color-studio?code=${selectedColor.code}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#14151a] hover:bg-white/95 font-bold text-sm shadow-lg transition-transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-brand" />
                <span>立即进入全屏 3D 选色器</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/color-studio?code=${selectedColor.code}&mode=car`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm transition-colors"
              >
                <Car className="w-4 h-4" />
                <span>直接看 3D 整车效果</span>
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 颜色分类与材质分类 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Color Selection"
          title="首批 20 款色彩与表面工艺"
          description="点击下方色块即可切换质感预览，并可一键跳转到 3D 扇形色卡与整车中深度对比。"
        />
      </ScrollReveal>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 色板选择 */}
        <ScrollReveal>
          <div className="flex flex-col gap-4">
            {/* 材质分类标签 */}
            <div className="flex flex-wrap gap-2">
              {finishTabs.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? COLOR_STUDIO_SWATCHES.length
                    : COLOR_STUDIO_SWATCHES.filter((s) => s.finish === tab.key).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFinish(tab.key)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-sm text-sm transition-fast',
                      activeFinish === tab.key
                        ? 'bg-brand text-white'
                        : 'bg-elevated text-content-secondary border border-border-subtle hover:border-border-default',
                    )}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* 色板网格 */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {filteredSwatches.map((swatch) => {
                const active = selectedColor.code === swatch.code;
                return (
                  <button
                    key={swatch.code}
                    onClick={() => setSelectedColor(swatch)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded transition-fast text-left',
                      active
                        ? 'bg-brand/10 border border-brand shadow-sm'
                        : 'border border-border-subtle hover:border-border-default bg-elevated/60',
                    )}
                  >
                    <span
                      className="w-full aspect-square rounded-sm border border-black/10 relative overflow-hidden"
                      style={{
                        background: swatch.shiftHex
                          ? `linear-gradient(135deg, ${swatch.hex} 20%, ${swatch.shiftHex} 88%)`
                          : swatch.hex,
                      }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/35 pointer-events-none" />
                    </span>
                    <span className="text-[11px] font-medium text-content-primary text-center leading-tight w-full truncate">
                      {swatch.name}
                    </span>
                    <span className="text-[10px] text-content-muted font-mono">
                      {swatch.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* 拟真膜面预览区 */}
        <ScrollReveal delay={200}>
          <Card padding="lg" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-content-primary">
                  {selectedColor.code} · {selectedColor.name}
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  {selectedColor.nameEn}
                </p>
              </div>
              <Badge variant="brand">{selectedColor.finishLabel}</Badge>
            </div>

            <div
              className="flex-1 rounded-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[240px] p-6 border border-black/10 shadow-inner"
              style={{
                background: selectedColor.shiftHex
                  ? `linear-gradient(135deg, ${selectedColor.hex} 18%, ${selectedColor.shiftHex} 85%)`
                  : selectedColor.hex,
              }}
            >
              {/* 模拟车漆影棚高光流动 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/30 pointer-events-none" />
              <div className="absolute -top-10 left-1/4 w-2/3 h-16 bg-white/25 blur-xl -rotate-12 pointer-events-none" />

              <span className="relative z-10 text-2xl md:text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                {selectedColor.name}
              </span>
              <span className="relative z-10 mt-2 px-3 py-1 rounded-full bg-black/45 backdrop-blur-sm text-xs text-white/90">
                {selectedColor.seriesName} · {selectedColor.finishLabel}
              </span>
            </div>

            <p className="mt-4 text-sm text-content-secondary">
              {selectedColor.tagline}
            </p>

            <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-content-muted">
                实际施工效果请到和膜授权门店对比实物样板。
              </span>
              <Link
                to={`/color-studio?code=${selectedColor.code}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-hover text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <span>在 3D 流光样板与实车上查看此颜色</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </ScrollReveal>
      </div>

      {/* TPU材质保护价值 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Material" title="TPU材质保护价值" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: '抗石击', desc: 'TPU材质具有优异的抗冲击性能，有效防止石子飞溅造成漆面损伤。' },
            { title: '自修复', desc: '轻微划痕在常温或加热条件下可自动修复，保持表面光洁。' },
            { title: '耐黄变', desc: '优质TPU基材抗紫外线老化，长期使用不易黄变。' },
          ].map((item) => (
            <Card key={item.title} padding="lg">
              <h3 className="text-base font-semibold text-content-brand mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-content-secondary">{item.desc}</p>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* 13个部位报价规则 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Claim Parts" title="13个部位报价规则" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ppfClaimParts.map((part, index) => (
            <div
              key={part}
              className="flex items-center gap-2 p-3 rounded bg-elevated border border-border-subtle"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-brand/15 flex items-center justify-center text-xs font-bold text-content-brand">
                {index + 1}
              </span>
              <span className="text-sm text-content-secondary">{part}</span>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
