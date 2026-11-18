// ============================================================
// 和膜 HAMOREY — TPU改色车衣分类页 /products/color-ppf/
// 交互式色板 + 真TPU对比传统PVC + 授权店实装案例 + 13部位理赔
// ============================================================

import { useState } from 'react';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { CaseGallery } from '../components/blocks/CaseGallery';
import { colorPpfSwatches, ppfClaimParts, type ColorSwatch } from '../config/products';
import { cn } from '../lib/cn';
import colorPpfImg from '../assets/hamorey/product-color.jpg';

const materialCategories = ['亮面', '哑光', '缎面', '金属'] as const;

const tpuVsPvc = [
  { dim: '核心基材', tpu: '光学级脂肪族 TPU（8.0 mil）', pvc: '普通压延级 PVC 塑料膜（3–4 mil）' },
  { dim: '漆面防护力', tpu: '兼具隐形车衣级抗碎石、防剐蹭能力', pvc: '薄且脆，几乎无抗刮抗石击保护' },
  { dim: '划痕自修复', tpu: '带纳米热修复顶涂层，太阳纹受热自愈', pvc: '划痕永久残留，洗车数次即显旧' },
  { dim: '色彩质感', tpu: '原厂车漆般饱满通透，无橘皮纹', pvc: '橘皮感明显，户外暴晒易褪色发白' },
  { dim: '官方质保与撕除', tpu: '6 年电子质保，到期撕除不易留残胶', pvc: '通常仅 1–2 年，老化后极易留胶伤漆' },
];

export default function ColorPPFPage() {
  useSEO('products/color-ppf');

  const [selectedColor, setSelectedColor] = useState<ColorSwatch>(colorPpfSwatches[2]);
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const filteredSwatches =
    activeCategory === '全部'
      ? colorPpfSwatches
      : colorPpfSwatches.filter((s) => s.category === activeCategory);

  return (
    <PageLayout
      hero
      image={colorPpfImg}
      imagePosition="center 75%"
      subtitle="Color PPF"
      title="TPU改色车衣"
      description="和彩 QCCY 全彩车衣系列：200+ 潮流定制色号，8.0 mil 真 TPU 基材与 6 年官方电子质保，一次施工同步完成个性改色与原厂漆防护。"
    >
      {/* 核心价值 */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 border-l-2 border-brand pl-5 md:pl-6">
            <h2 className="text-2xl md:text-3xl font-bold text-content-primary">
              真 TPU 改色车衣，不止好看更能抗刮
            </h2>
            <p className="mt-3 text-base leading-relaxed text-content-secondary">
              告别传统 PVC 改色膜易橘皮、易褪色、撕膜留胶的痛点。和膜「和彩 QCCY」采用脂肪族 TPU 基材结合高显色纳米色浆工艺，呈现媲美原厂定制车漆的镜面光泽与细腻缎面质感。
            </p>
          </div>
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            {[
              { v: '8.0mil', l: '真 TPU 防护厚度' },
              { v: '6年', l: '官方电子质保' },
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

      {/* 颜色分类与材质分类 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Color Studio"
          title="经典色号与质感预览"
          description="门店配备完整色卡样册（200+ 色号持续更新），支持亮面、哑光、缎面与液态金属质感。"
        />
      </ScrollReveal>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 色板选择 */}
        <ScrollReveal>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('全部')}
                className={cn(
                  'px-3.5 py-1.5 rounded text-sm font-medium transition-fast',
                  activeCategory === '全部'
                    ? 'bg-brand text-white'
                    : 'bg-elevated text-content-secondary border border-border-subtle',
                )}
              >
                全部质感
              </button>
              {materialCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 rounded text-sm font-medium transition-fast',
                    activeCategory === cat
                      ? 'bg-brand text-white'
                      : 'bg-elevated text-content-secondary border border-border-subtle',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {filteredSwatches.map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => setSelectedColor(swatch)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded transition-fast bg-elevated',
                    selectedColor.name === swatch.name
                      ? 'ring-2 ring-brand border border-brand'
                      : 'border border-border-subtle hover:border-border-default',
                  )}
                >
                  <span
                    className="w-full aspect-square rounded-sm border border-black/10"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-xs text-content-secondary text-center leading-tight">
                    {swatch.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 预览区：自动根据浅色/深色调整文字颜色 */}
        <ScrollReveal delay={150}>
          <Card padding="lg" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-content-primary">
                  和彩 QCCY · {selectedColor.name}
                </h3>
                <p className="text-xs text-content-muted mt-0.5">色值参考 {selectedColor.hex}</p>
              </div>
              <Badge variant="brand">{selectedColor.category}质感</Badge>
            </div>
            <div
              className="relative flex-1 rounded-lg flex flex-col items-center justify-center min-h-[220px] border border-black/10 overflow-hidden transition-colors duration-300"
              style={{
                background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22), transparent 55%), ${selectedColor.hex}`,
              }}
            >
              <span
                className={cn(
                  'text-2xl md:text-3xl font-bold tracking-wide',
                  selectedColor.lightText === false ? 'text-[#1A1412]' : 'text-white drop-shadow',
                )}
              >
                {selectedColor.name}
              </span>
              <span
                className={cn(
                  'mt-2 text-xs tracking-widest uppercase',
                  selectedColor.lightText === false ? 'text-[#1A1412]/65' : 'text-white/75',
                )}
              >
                HAMOREY COLOR PPF · 8.0 MIL TPU
              </span>
            </div>
            <p className="mt-4 text-xs text-content-muted">
              屏幕显示受色温影响仅供参考，欢迎前往附近和膜授权门店体验实物色卡并获取爱车贴装建议。
            </p>
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
