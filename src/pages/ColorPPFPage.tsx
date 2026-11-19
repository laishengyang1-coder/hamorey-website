// ============================================================
// 和膜 HAMOREY — TPU改色车衣分类页 /products/color-ppf/
// 3D 选色展厅入口 + 首批20色拟真色板预览 + 真TPU对比PVC + 实装案例 + 13部位理赔
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
import { CaseGallery } from '../components/blocks/CaseGallery';
import { ppfClaimParts } from '../config/products';
import {
  COLOR_STUDIO_SWATCHES,
  HECAI_SPEC,
  type ColorFilmItem,
  type FilmFinishType,
} from '../config/colorStudio';
import { cn } from '../lib/cn';
import colorPpfImg from '../assets/hamorey/product-color.jpg';

const finishTabs: Array<{ key: 'all' | FilmFinishType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'crystal', label: '水晶' },
  { key: 'metallic', label: '金属' },
  { key: 'pearlescent', label: '珠光' },
  { key: 'chameleon', label: '双色·变色龙' },
  { key: 'special', label: '镭射·炫彩·锻碳' },
];

const tpuVsPvc = [
  { dim: '核心基材', tpu: '光学级脂肪族 TPU（8.0 mil）', pvc: '普通压延级 PVC 塑料膜（3–4 mil）' },
  { dim: '漆面防护力', tpu: '兼具隐形车衣级抗碎石、防剐蹭能力', pvc: '薄且脆，几乎无抗刮抗石击保护' },
  { dim: '划痕自修复', tpu: '带纳米热修复顶涂层，太阳纹受热自愈', pvc: '划痕永久残留，洗车数次即显旧' },
  { dim: '色彩质感', tpu: '原厂车漆般饱满通透，无橘皮纹', pvc: '橘皮感明显，户外暴晒易褪色发白' },
  { dim: '官方质保与撕除', tpu: '6 年电子质保，到期撕除不易留残胶', pvc: '通常仅 1–2 年，老化后极易留胶伤漆' },
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
      image={colorPpfImg}
      imagePosition="center 75%"
      subtitle="Color PPF"
      title="TPU改色车衣"
      description="和彩 QCCY 全彩车衣系列：2026 官方 103 款全系电子色卡，8.0 mil 真 TPU 基材与 6 年官方电子质保，覆盖水晶、金属、珠光、变色龙、镭射、炫彩与锻碳，支持 Model 3 / Model Y 全屏 3D 实时换色预览。"
    >
      {/* 核心价值与关键指标 */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 border-l-2 border-brand pl-5 md:pl-6">
            <h2 className="text-2xl md:text-3xl font-bold text-content-primary">
              真 TPU 改色车衣，不止好看更能抗刮
            </h2>
            <p className="mt-3 text-base leading-relaxed text-content-secondary">
              告别传统 PVC 改色膜易橘皮、易褪色、撕膜留胶的痛点。和膜「{HECAI_SPEC.modelName}」采用 {HECAI_SPEC.thickness} {HECAI_SPEC.substrate}结合高显色纳米色浆工艺，呈现媲美原厂定制车漆的镜面光泽与抗石击自修复防护。
            </p>
          </div>
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            {[
              { v: HECAI_SPEC.thickness, l: '真 TPU 防护厚度' },
              { v: `${HECAI_SPEC.warrantyYears}年`, l: '官方电子质保' },
              { v: '¥16,800', l: '整车建议零售价' },
            ].map((item) => (
              <div
                key={item.l}
                className="rounded-lg bg-elevated border border-border-subtle p-4 text-center"
              >
                <p className="text-xl md:text-2xl font-bold text-content-brand">{item.v}</p>
                <p className="mt-1 text-xs text-content-secondary">{item.l}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* 3D 在线选色展厅交互横幅 */}
      <ScrollReveal className="mt-12">
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
                赏鉴 3D 流光雕塑样板，一键装上 Model 3 / Y 实看
              </h2>
              <p className="mt-2.5 text-sm text-white/70 leading-relaxed">
                解决「色卡好看、上车拿不准」痛点：收录 2026 官方电子色卡全系 {COLOR_STUDIO_SWATCHES.length} 款色号，内置柔光棚拍 HDR 与三档灯光切换，支持 3D 样板廊与 Model 3 / Model Y 360° 整车实时换色。
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                <span className="px-3 py-1 rounded-full bg-white/10">37 款水晶</span>
                <span className="px-3 py-1 rounded-full bg-white/10">23 款金属</span>
                <span className="px-3 py-1 rounded-full bg-white/10">27 款珠光</span>
                <span className="px-3 py-1 rounded-full bg-white/10">16 款变色龙·镭射·炫彩·锻碳</span>
                <span className="px-3 py-1 rounded-full bg-white/10">Model 3 / Y 双车型切换</span>
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
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Color Selection"
          title={`2026 全系 ${COLOR_STUDIO_SWATCHES.length} 款色彩与表面工艺`}
          description="同步《2026 电子色卡》全系色号，点击下方色块即可切换质感预览，并一键跳转到 3D 样板廊与 Model 3 / Model Y 实车深度对比。"
        />
      </ScrollReveal>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 色板选择 */}
        <ScrollReveal>
          <div className="flex flex-col gap-4">
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
                      'px-3.5 py-1.5 rounded-sm text-sm font-medium transition-fast',
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
        <ScrollReveal delay={150}>
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
                门店配备完整色卡样册（200+ 色号持续更新），实际效果请以实物样板为准。
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

      {/* 真 TPU 改色车衣 vs 传统 PVC 改色膜 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="TPU vs PVC"
          title="为什么选择真 TPU 改色车衣"
          description="用一套车衣的预算，同时拥有个性车色与 6 年长效漆面保护。"
        />
        <div className="mt-8 overflow-x-auto rounded-lg border border-border-subtle bg-elevated">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="bg-[#1A0D0D] text-white text-xs uppercase tracking-wider">
                <th className="py-4 px-5 font-semibold w-40">对比维度</th>
                <th className="py-4 px-5 font-semibold text-[#E6C88A]">和膜 TPU 改色车衣（和彩 QCCY）</th>
                <th className="py-4 px-5 font-semibold text-white/70">传统 PVC 改色膜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {tpuVsPvc.map((row) => (
                <tr key={row.dim} className="hover:bg-graphite/60">
                  <td className="py-3.5 px-5 font-semibold text-content-primary">{row.dim}</td>
                  <td className="py-3.5 px-5 font-medium text-content-primary">{row.tpu}</td>
                  <td className="py-3.5 px-5 text-content-muted">{row.pvc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      {/* 授权门店真实装贴案例 */}
      <div className="mt-16 md:mt-20 -mx-6 md:-mx-8">
        <CaseGallery />
      </div>

      {/* 13个部位报价规则 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Claim Parts"
          title="13 个车身部位独立理赔参考"
          description="同享和膜电子质保体系，局部碰撞剐蹭可按单部位查询补膜理赔参考价。"
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {ppfClaimParts.map((part, index) => (
            <div
              key={part}
              className="flex items-center gap-2.5 px-4 py-3 rounded bg-elevated border border-border-subtle min-w-[152px]"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-brand/15 flex items-center justify-center text-xs font-bold text-content-brand">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-content-primary">{part}</span>
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
