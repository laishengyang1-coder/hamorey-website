// ============================================================
// 和膜 HAMOREY — TPU改色车衣分类页 /products/color-ppf/
// 高定黑曜石选色台（103色库 + 3D直达）+ 五大工艺矩阵 + 5层真TPU结构 + 真TPU对比PVC + 实装案例 + 13部位理赔
// ============================================================

import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Car,
  Check,
  Layers,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { CTASection } from '../components/blocks/CTASection';
import { CaseGallery } from '../components/blocks/CaseGallery';
import { ppfClaimParts } from '../config/products';
import {
  COLOR_STUDIO_SWATCHES,
  FINISH_FILTERS,
  HECAI_SPEC,
  HUE_GROUPS,
  matchesHueGroup,
  type ColorFilmItem,
  type ColorHueGroup,
  type FilmFinishType,
} from '../config/colorStudio';
import { cn } from '../lib/cn';
import colorPpfImg from '../assets/hamorey/product-color.jpg';

const FINISH_SHOWCASE: Array<{
  key: FilmFinishType;
  title: string;
  subtitle: string;
  desc: string;
  gradient: string;
  accent: string;
}> = [
  {
    key: 'crystal',
    title: '水晶镜面系列',
    subtitle: 'CRYSTAL SOLE',
    desc: '媲美超跑原厂高定车漆的纯净饱和度与深邃镜面清漆，零橘皮通透质感。',
    gradient: 'linear-gradient(135deg, #2b0f12 0%, #9b1c20 52%, #e04a42 100%)',
    accent: '#E6C483',
  },
  {
    key: 'metallic',
    title: '液态金属系列',
    subtitle: 'LIQUID METALLIC',
    desc: '微米级高密金属粒子随车身腰线折光流动，提供高光、丝缎与超哑多档质感。',
    gradient: 'linear-gradient(135deg, #1b1e24 0%, #5f6875 52%, #c9d1dc 100%)',
    accent: '#D8DEE9',
  },
  {
    key: 'pearlescent',
    title: '幻彩珠光系列',
    subtitle: 'PEARLY IRIDESCENT',
    desc: '在柔和底色中融入细腻云母珠光，阳光掠射下呈现层次丰富的双色冷暖过渡。',
    gradient: 'linear-gradient(135deg, #2d2038 0%, #8f6b98 55%, #f0cbd8 100%)',
    accent: '#F0CBD8',
  },
  {
    key: 'chameleon',
    title: '双色 · 变色龙',
    subtitle: 'BICOLOR & CHAMELEON',
    desc: '随视角与光线流转幻化多重色相，专为追求极高辨识度的先锋车主打造。',
    gradient: 'linear-gradient(135deg, #0d2b36 0%, #1d6f7a 48%, #7a3e98 100%)',
    accent: '#82D4DE',
  },
  {
    key: 'special',
    title: '镭射 · 炫彩 · 锻碳',
    subtitle: 'SPECIAL & FORGED CARBON',
    desc: '涵盖星空镭射、立体锻造碳纤维与编织碳纤纹理，赋予性能车赛道定制气场。',
    gradient: 'linear-gradient(135deg, #121216 0%, #2c2d35 48%, #5b4d38 100%)',
    accent: '#C9A86A',
  },
];

const FILM_STRUCTURE_LAYERS = [
  {
    no: '01',
    name: 'PET 表面保护膜',
    tag: '施工前揭除',
    desc: '运输与裁膜期间隔绝灰尘静电，确保镜面纳米涂层装贴前零微划痕。',
  },
  {
    no: '02',
    name: '纳米热修复疏水顶涂层',
    tag: '自修复 · 抗污',
    desc: '洗车细微太阳纹遇阳光或温水自动回弹闭合，荷叶疏水有效抵御酸雨鸟粪。',
  },
  {
    no: '03',
    name: '高显色纳米色浆层',
    tag: '零橘皮 · 抗 UV',
    desc: '高密度光学色浆与金属/珠光微粒均匀分布，户外暴晒长效持色不易发乌褪色。',
  },
  {
    no: '04',
    name: '8.0 mil 光学脂肪族 TPU',
    tag: '核心防护基材',
    desc: '真正隐形车衣级高韧性缓冲基材，从容抵御高速飞石击打与日常剐蹭。',
  },
  {
    no: '05',
    name: '低初粘压敏安装胶层',
    tag: '撕除不留胶',
    desc: '走水顺滑易定位、复杂曲面收边服帖，6 年到期撕除不伤原厂清漆。',
  },
];

const TPU_VS_PVC_ROWS = [
  {
    dim: '核心基材厚度',
    tpu: '8.0 mil 光学级脂肪族 TPU，真正车衣级韧性',
    pvc: '3–4 mil 普通压延 PVC 塑料膜，薄脆易穿破',
  },
  {
    dim: '抗石击与防剐蹭',
    tpu: '兼具隐形车衣物理铠甲防护，守护原厂车漆残值',
    pvc: '仅提供表层改色，几乎无抗飞石、防开门杀能力',
  },
  {
    dim: '细微划痕自修复',
    tpu: '纳米热修复顶涂层，太阳纹受热自动愈合如新',
    pvc: '无自修复涂层，洗车数次即满布划痕显旧',
  },
  {
    dim: '色彩通透与橘皮',
    tpu: '媲美原厂定制车漆的镜面光泽，告别塑料橘皮感',
    pvc: '近看橘皮纹明显，户外长期日晒易褪色发白',
  },
  {
    dim: '质保周期与撕膜',
    tpu: '6 年官方电子质保一车一档，到期撕除不易留胶',
    pvc: '通常仅 1–2 年寿命，老化脆裂后撕膜极易伤原漆',
  },
];

function getOrbGlossStyle(swatch: ColorFilmItem) {
  const shiftTone = swatch.shiftHex || swatch.hex;
  const isMatte = swatch.material.roughness >= 0.34;
  const isSatin = !isMatte && swatch.material.roughness >= 0.2;
  return {
    orbBg: `radial-gradient(circle at 31% 24%, rgba(255,255,255,${isMatte ? 0.22 : isSatin ? 0.36 : 0.62}) 0%, ${shiftTone} 26%, ${swatch.hex} 68%, #07080b 100%)`,
    specularOpacity: isMatte ? 0.16 : isSatin ? 0.32 : 0.72,
    specularBlur: isMatte ? 'blur-md' : isSatin ? 'blur-[3px]' : 'blur-[1px]',
  };
}

export default function ColorPPFPage() {
  useSEO('products/color-ppf');

  const vaultRef = useRef<HTMLDivElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorFilmItem>(
    COLOR_STUDIO_SWATCHES[2] ?? COLOR_STUDIO_SWATCHES[0],
  );
  const [activeFinish, setActiveFinish] = useState<'all' | FilmFinishType>('all');
  const [activeHue, setActiveHue] = useState<ColorHueGroup>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const finishCounts = useMemo(() => {
    const map: Record<'all' | FilmFinishType, number> = {
      all: COLOR_STUDIO_SWATCHES.length,
      crystal: 0,
      metallic: 0,
      pearlescent: 0,
      chameleon: 0,
      special: 0,
    };
    for (const item of COLOR_STUDIO_SWATCHES) {
      map[item.finish] += 1;
    }
    return map;
  }, []);

  const filteredSwatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return COLOR_STUDIO_SWATCHES.filter((item) => {
      if (activeFinish !== 'all' && item.finish !== activeFinish) return false;
      if (!matchesHueGroup(item, activeHue)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.seriesName.toLowerCase().includes(q)
      );
    });
  }, [activeFinish, activeHue, searchQuery]);

  const orbStyle = getOrbGlossStyle(selectedColor);

  const jumpToFinishInVault = (finish: FilmFinishType) => {
    setActiveFinish(finish);
    setActiveHue('all');
    setSearchQuery('');
    const first = COLOR_STUDIO_SWATCHES.find((s) => s.finish === finish);
    if (first) setSelectedColor(first);
    vaultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageLayout
      hero
      image={colorPpfImg}
      imagePosition="center 72%"
      subtitle="HAMOREY ATELIER · COLOR PPF"
      title="和彩 TPU 改色车衣"
      description="以 8.0 mil 隐形车衣级物理铠甲，重塑原厂高定车漆美学。收录 2026 官方 103 款全系色库，支持全屏 3D 流光样板与 Model 3 / Model Y 实时装车预览。"
    >
      {/* 1. 核心价值与建筑感规格带 */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-6 border-l-2 border-brand pl-5 md:pl-6">
            <p className="text-xs font-semibold tracking-[0.24em] text-content-brand uppercase">
              Invisible Armor · Visible Art
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-content-primary tracking-tight">
              真 TPU 改色车衣，不止惊艳更护原漆
            </h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-content-secondary">
              告别传统 PVC 改色膜橘皮重、易褪色、撕膜留胶的妥协。和膜「{HECAI_SPEC.modelName}」以{' '}
              {HECAI_SPEC.thickness} {HECAI_SPEC.substrate}结合纳米热修复顶涂层，一套预算兼得高定车色与 6 年硬核漆面防护。
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { v: HECAI_SPEC.thickness, l: '光学级真 TPU', sub: '抗石击自修复' },
              { v: `${COLOR_STUDIO_SWATCHES.length} 款`, l: '2026 官方色库', sub: '五大表面工艺' },
              { v: `${HECAI_SPEC.warrantyYears} 年`, l: '官方电子质保', sub: '一车一档可查' },
              { v: '¥16,800', l: '整车参考价', sub: '含专车装贴' },
            ].map((item) => (
              <div
                key={item.l}
                className="relative rounded-xl bg-elevated border border-border-subtle p-4 shadow-sm overflow-hidden"
              >
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-[#C9A86A] to-transparent" />
                <p className="text-xl md:text-2xl font-bold text-content-primary tracking-tight">
                  {item.v}
                </p>
                <p className="mt-1 text-xs font-semibold text-content-brand">{item.l}</p>
                <p className="mt-0.5 text-[11px] text-content-muted">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* 2. 全页视觉核心：高定黑曜石选色台（Atelier Color Vault） */}
      <div ref={vaultRef} className="mt-12 md:mt-16 scroll-mt-24">
        <ScrollReveal>
          <section
            aria-label="和彩高定选色台"
            className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#0B0A0D] text-[#F7F3EB] border border-[#C9A86A]/30 shadow-[0_24px_70px_rgba(20,10,12,0.28)]"
          >
            {/* 随当前颜色联动的暗夜环境光晕 */}
            <div
              className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-25 blur-[96px] pointer-events-none transition-colors duration-700"
              style={{ background: selectedColor.shiftHex || selectedColor.hex }}
            />
            <div
              className="absolute -left-24 bottom-0 w-72 h-72 rounded-full opacity-15 blur-[90px] pointer-events-none transition-colors duration-700"
              style={{ background: selectedColor.hex }}
            />

            {/* 顶部控制栏：标题 + 搜索 + 3D 工坊直达 */}
            <div className="relative z-10 px-5 py-5 md:px-8 md:py-6 border-b border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.22em] text-[#C9A86A] uppercase">
                    <Palette className="w-3.5 h-3.5" />
                    <span>HAMOREY ATELIER VAULT · 2026</span>
                  </div>
                  <h2 className="mt-1.5 text-xl md:text-2xl font-bold tracking-tight text-white">
                    高定在线选色台 · {COLOR_STUDIO_SWATCHES.length} 款官方电子色卡
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索色名 / 色号，如 纳多灰、TPU-011S"
                      className="w-full h-10 pl-9 pr-8 rounded-xl bg-white/[0.06] border border-white/12 text-base sm:text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A86A]/70 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        aria-label="清空搜索"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <Link
                    to={`/color-studio?code=${selectedColor.code}`}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#C9A86A] hover:bg-[#d8ba80] text-[#0A0A0D] font-bold text-xs transition-colors whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>进入全屏 3D 选色工坊</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 工艺筛选胶囊 + 7 大色系圆点（双行自适应换行，桌面与手机均零裁切、零横向溢出） */}
              <div className="mt-4 flex flex-col gap-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {FINISH_FILTERS.map((tab) => {
                    const active = activeFinish === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveFinish(tab.key)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                          active
                            ? 'bg-[#C9A86A] text-[#0B0A0D] border-[#C9A86A] font-semibold'
                            : 'bg-white/[0.04] text-white/70 border-white/10 hover:border-white/25 hover:text-white',
                        )}
                      >
                        {tab.label}
                        <span className={cn('ml-1 font-mono text-[11px]', active ? 'text-[#0B0A0D]/75' : 'text-white/40')}>
                          {finishCounts[tab.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {HUE_GROUPS.map((hue) => {
                    const active = activeHue === hue.key;
                    return (
                      <button
                        key={hue.key}
                        type="button"
                        onClick={() => setActiveHue(hue.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all border',
                          active
                            ? 'bg-white/14 text-[#F2D9A2] border-[#C9A86A]/55 font-medium'
                            : 'bg-transparent text-white/55 border-white/10 hover:text-white/90',
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/30 flex-shrink-0"
                          style={{ background: hue.dotColor }}
                        />
                        <span>{hue.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 双栏主体：左固定高度可滚动流光色珠矩阵 + 右高定漆面检视台 */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">
              {/* 左栏：立体色珠画廊（受控高度，彻底告别 2000px 色块墙） */}
              <div className="lg:col-span-7 p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col">
                <div className="flex items-center justify-between text-[11px] text-white/45 mb-3 px-1">
                  <span>
                    当前展示 <b className="text-[#E6C483] font-mono">{filteredSwatches.length}</b> 款色号 · 滚动浏览全系
                  </span>
                  <span className="hidden sm:inline">点击任意色珠即时预览漆面光学</span>
                </div>

                {filteredSwatches.length === 0 ? (
                  <div className="h-[340px] sm:h-[420px] flex flex-col items-center justify-center text-center gap-3 text-white/55">
                    <p className="text-sm">未找到符合条件的色号</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFinish('all');
                        setActiveHue('all');
                        setSearchQuery('');
                      }}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-[#E6C483] border border-[#C9A86A]/35"
                    >
                      重置全部筛选
                    </button>
                  </div>
                ) : (
                  <div className="h-[340px] sm:h-[420px] lg:h-[470px] overflow-y-auto pr-1.5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 content-start">
                    {filteredSwatches.map((swatch) => {
                      const active = selectedColor.code === swatch.code;
                      const shiftTone = swatch.shiftHex || swatch.hex;
                      return (
                        <button
                          key={swatch.code}
                          type="button"
                          onClick={() => setSelectedColor(swatch)}
                          className={cn(
                            'group flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all text-center',
                            active
                              ? 'bg-white/[0.1] border-[#C9A86A] shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
                              : 'bg-white/[0.025] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/20',
                          )}
                        >
                          <span
                            className={cn(
                              'w-12 h-12 sm:w-13 sm:h-13 rounded-full relative transition-transform duration-200',
                              active
                                ? 'scale-105 ring-2 ring-[#C9A86A] ring-offset-2 ring-offset-[#0B0A0D]'
                                : 'group-hover:scale-105 ring-1 ring-white/20',
                            )}
                            style={{
                              background: `radial-gradient(circle at 30% 24%, rgba(255,255,255,0.52) 0%, ${shiftTone} 28%, ${swatch.hex} 72%, #050608 100%)`,
                              boxShadow: 'inset -4px -5px 10px rgba(0,0,0,0.62), 0 6px 14px rgba(0,0,0,0.5)',
                            }}
                          >
                            <span className="absolute top-1.5 left-2 w-3.5 h-1.5 rounded-full bg-white/65 -rotate-[25deg] pointer-events-none" />
                          </span>
                          <div className="w-full min-w-0">
                            <p
                              className={cn(
                                'text-xs font-medium truncate leading-tight',
                                active ? 'text-[#F2D9A2]' : 'text-white/90',
                              )}
                            >
                              {swatch.name}
                            </p>
                            <p className="mt-0.5 text-[10px] font-mono text-white/40 truncate">
                              {swatch.code}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 右栏：高定漆面检视台 */}
              <div className="lg:col-span-5 p-5 md:p-7 flex flex-col justify-between bg-gradient-to-b from-white/[0.02] to-black/30">
                <div>
                  {/* 顶部铭牌 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono tracking-[0.18em] text-[#C9A86A]">
                        {selectedColor.code} · {HECAI_SPEC.thickness} TPU
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-white truncate">
                        {selectedColor.name}
                      </h3>
                      <p className="text-xs font-mono text-white/50 truncate mt-0.5">
                        {selectedColor.nameEn}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#C9A86A]/15 border border-[#C9A86A]/45 text-[11px] font-medium text-[#F0D59B] whitespace-nowrap">
                      {selectedColor.finishLabel}
                    </span>
                  </div>

                  {/* 中央暗黑影棚球体舞台 */}
                  <div className="mt-5 relative rounded-2xl border border-white/10 bg-[#070709] py-8 px-4 flex flex-col items-center justify-center overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-30 transition-all duration-700 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 42%, ${selectedColor.shiftHex || selectedColor.hex}, transparent 68%)`,
                      }}
                    />

                    {/* 立体高定漆面球体 */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className="w-36 h-36 sm:w-40 sm:h-40 rounded-full relative transition-all duration-500"
                        style={{
                          background: orbStyle.orbBg,
                          boxShadow:
                            'inset -14px -18px 34px rgba(0,0,0,0.72), inset 6px 8px 18px rgba(255,255,255,0.16), 0 22px 46px rgba(0,0,0,0.75)',
                        }}
                      >
                        {/* 主棚拍柔光高光带 */}
                        <span
                          className={cn(
                            'absolute top-5 left-7 w-14 h-7 rounded-full bg-white -rotate-[28deg] pointer-events-none transition-all duration-500',
                            orbStyle.specularBlur,
                          )}
                          style={{ opacity: orbStyle.specularOpacity }}
                        />
                        {/* 底部反光轮廓线 */}
                        <span
                          className="absolute inset-x-6 bottom-3 h-3 rounded-full opacity-35 blur-sm pointer-events-none"
                          style={{ background: selectedColor.shiftHex || selectedColor.hex }}
                        />
                      </div>

                      {/* 曜石展台光环投影 */}
                      <div className="mt-3 w-32 h-3.5 rounded-full border border-[#C9A86A]/45 bg-gradient-to-b from-[#17161a] to-black shadow-[0_6px_18px_rgba(0,0,0,0.9)]" />
                    </div>

                    <p className="relative z-10 mt-3 text-[11px] font-mono tracking-[0.2em] text-white/45 uppercase">
                      {selectedColor.seriesName}
                    </p>
                  </div>

                  {/* 短评 + 3 项光学数据条 */}
                  <p className="mt-4 text-xs md:text-sm text-white/70 leading-relaxed">
                    {selectedColor.tagline}
                  </p>

                  <div className="mt-4 space-y-2">
                    {[
                      { label: '镜面清漆', value: selectedColor.optics.gloss },
                      { label: '金属微粒', value: selectedColor.optics.metallic },
                      { label: '折光幻彩', value: selectedColor.optics.shift },
                    ].map((metric) => (
                      <div key={metric.label} className="flex items-center gap-3 text-xs">
                        <span className="w-16 text-white/50 flex-shrink-0">{metric.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#C9A86A] to-[#f4dfb0] transition-all duration-500"
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                        <span className="w-7 text-right font-mono text-white/75">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 底部 3D 工坊直达动作组 */}
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5">
                  <Link
                    to={`/color-studio?code=${selectedColor.code}`}
                    className="w-full h-11 rounded-xl bg-[#C9A86A] hover:bg-[#d7b87b] text-[#0B0A0D] font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>在 3D 流光样板中赏鉴此色</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      to={`/color-studio?code=${selectedColor.code}&mode=car&car=model3`}
                      className="h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/12 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Car className="w-3.5 h-3.5 text-[#C9A86A]" />
                      <span>Model 3 实车</span>
                    </Link>
                    <Link
                      to={`/color-studio?code=${selectedColor.code}&mode=car&car=modely`}
                      className="h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/12 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Car className="w-3.5 h-3.5 text-[#C9A86A]" />
                      <span>Model Y 实车</span>
                    </Link>
                  </div>

                  <p className="text-[11px] text-white/40 text-center">
                    授权门店均配备实体色卡样册，装贴前建议以实物样板核对实车光照效果
                  </p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>

      {/* 3. 五大表面工艺美学矩阵 */}
      <ScrollReveal className="mt-16 md:mt-24">
        <SectionHeading
          subtitle="Surface Craftsmanship"
          title="五大表面光学工艺体系"
          description="从超跑原厂单色漆到流动变色龙与锻造碳纤，点击任意工艺卡片立即筛选对应色库。"
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FINISH_SHOWCASE.map((item) => {
            const samples = COLOR_STUDIO_SWATCHES.filter((s) => s.finish === item.key).slice(0, 4);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => jumpToFinishInVault(item.key)}
                className="group text-left rounded-2xl bg-elevated border border-border-subtle hover:border-brand/50 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div
                  className="h-24 relative p-4 flex flex-col justify-between overflow-hidden"
                  style={{ background: item.gradient }}
                >
                  <span className="absolute -top-6 right-2 w-24 h-12 bg-white/25 blur-xl -rotate-12 pointer-events-none" />
                  <span className="relative z-10 text-[10px] font-mono tracking-[0.2em] text-white/75">
                    {item.subtitle}
                  </span>
                  <div className="relative z-10 flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <span className="text-xs font-mono text-white/85">
                      {finishCounts[item.key]} 色
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-xs text-content-secondary leading-relaxed">{item.desc}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                    <div className="flex items-center -space-x-1.5">
                      {samples.map((s) => (
                        <span
                          key={s.code}
                          title={s.name}
                          className="w-5 h-5 rounded-full ring-2 ring-elevated"
                          style={{
                            background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), ${s.shiftHex || s.hex} 35%, ${s.hex} 85%)`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-content-brand group-hover:translate-x-0.5 transition-transform">
                      筛选查看
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* 4. 8.0 mil 真 TPU 五层精密防护结构 */}
      <ScrollReveal className="mt-16 md:mt-24">
        <SectionHeading
          subtitle="5-Layer TPU Architecture"
          title="8.0 mil 真 TPU 五层精密防护结构"
          description="从顶层疏水热修复到底层低初粘胶水，每一层都按旗舰隐形车衣标准打造。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          {FILM_STRUCTURE_LAYERS.map((layer) => (
            <div
              key={layer.no}
              className="rounded-2xl bg-elevated border border-border-subtle p-5 flex flex-col justify-between hover:border-brand/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-brand/25">{layer.no}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/8 text-[11px] font-medium text-content-brand">
                    <Layers className="w-3 h-3" />
                    {layer.tag}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-content-primary">{layer.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-content-secondary">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* 5. 真 TPU 改色车衣 vs 传统 PVC 改色膜（旗舰双栏对比卡） */}
      <ScrollReveal className="mt-16 md:mt-24">
        <SectionHeading
          subtitle="TPU vs PVC"
          title="为什么高端车主选择真 TPU 改色车衣"
          description="不只是换个颜色，而是用一套车衣的投入，同时获得个性美学与 6 年硬核漆面保值。"
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左卡：和膜和彩真 TPU（黑金勃艮第主推卡） */}
          <div className="rounded-2xl bg-gradient-to-br from-[#1C0B0D] via-[#2A0E12] to-[#120A0C] text-white border border-[#C9A86A]/45 p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between gap-3 pb-5 border-b border-white/12">
              <div>
                <p className="text-[11px] font-mono tracking-[0.2em] text-[#C9A86A] uppercase">
                  RECOMMENDED · {HECAI_SPEC.modelName}
                </p>
                <h3 className="mt-1 text-xl md:text-2xl font-bold text-white">
                  和膜真 TPU 改色车衣
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A86A]/20 border border-[#C9A86A]/50 text-xs font-semibold text-[#F2D9A2]">
                <ShieldCheck className="w-3.5 h-3.5" />
                6 年电子质保
              </span>
            </div>

            <ul className="mt-5 space-y-4">
              {TPU_VS_PVC_ROWS.map((row) => (
                <li key={row.dim} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#C9A86A]/20 border border-[#C9A86A]/50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#F2D9A2]" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#E6C483]">{row.dim}</p>
                    <p className="mt-0.5 text-sm text-white/90 leading-relaxed">{row.tpu}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 右卡：传统 PVC 改色膜（浅暖灰警示卡） */}
          <div className="rounded-2xl bg-elevated border border-border-subtle p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 pb-5 border-b border-border-subtle">
              <div>
                <p className="text-[11px] font-mono tracking-[0.2em] text-content-muted uppercase">
                  TRADITIONAL VINYL WRAP
                </p>
                <h3 className="mt-1 text-xl md:text-2xl font-bold text-content-primary">
                  传统压延 PVC 改色膜
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-graphite text-xs font-medium text-content-muted">
                1–2 年易老化
              </span>
            </div>

            <ul className="mt-5 space-y-4">
              {TPU_VS_PVC_ROWS.map((row) => (
                <li key={row.dim} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-graphite border border-border-default flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-content-muted" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-content-secondary">{row.dim}</p>
                    <p className="mt-0.5 text-sm text-content-muted leading-relaxed">{row.pvc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ScrollReveal>

      {/* 6. 授权门店真实装贴案例 */}
      <div className="mt-16 md:mt-24 -mx-6 md:-mx-8">
        <CaseGallery />
      </div>

      {/* 7. 13 个车身部位独立理赔参考 */}
      <ScrollReveal className="mt-16 md:mt-24">
        <SectionHeading
          subtitle="Claim Parts"
          title="13 个车身部位独立理赔参考"
          description="同享和膜官方电子质保体系，局部碰撞剐蹭可按单部位透明定损补膜。"
        />
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ppfClaimParts.map((part, index) => (
            <div
              key={part}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-elevated border border-border-subtle hover:border-brand/35 transition-colors"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-xs font-mono font-bold text-content-brand">
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
