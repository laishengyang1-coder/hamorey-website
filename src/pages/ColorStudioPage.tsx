// ============================================================
// 和膜 HAMOREY — 3D 高定选色工坊全屏页 V2 (/color-studio)
// 曜石黑 × 香槟金建筑感 UI · 原创流光样板廊 · 三档 HDR 光影 · 立体色珠胶片轨
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Car,
  Info,
  Loader2,
  Moon,
  Sparkles,
  Sun,
  Sunset,
} from 'lucide-react';
import { useSEO } from '../lib/seo';
import {
  COLOR_STUDIO_SWATCHES,
  FINISH_FILTERS,
  HECAI_SPEC,
  LIGHTING_PRESETS,
  findColorSwatchByCode,
  type ColorFilmItem,
  type FilmFinishType,
  type StudioLightingPreset,
  type StudioViewMode,
} from '../config/colorStudio';
import {
  ColorStudioCanvas,
  type CarModelLoadStatus,
} from '../components/color-studio/ColorStudioCanvas';
import { ColorCatalogDrawer } from '../components/color-studio/ColorCatalogDrawer';
import { ColorCardModal } from '../components/color-studio/ColorCardModal';
import { cn } from '../lib/cn';

const VIEW_MODES: Array<{
  key: StudioViewMode;
  label: string;
  shortLabel: string;
  labelEn: string;
}> = [
  { key: 'swatch', label: '流光样板', shortLabel: '样板', labelEn: 'Sculpture' },
  { key: 'car', label: '超跑整车', shortLabel: '整车', labelEn: 'Vehicle' },
  { key: 'closeup', label: '腰线近景', shortLabel: '近景', labelEn: 'Detail' },
  { key: 'macro', label: '微距肌理', shortLabel: '微距', labelEn: 'Macro' },
  { key: 'sphere', label: '光影球体', shortLabel: '球体', labelEn: 'Sphere' },
];

export default function ColorStudioPage() {
  useSEO('color-studio');

  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'miniprogram';

  const initialSwatch = useMemo(
    () => findColorSwatchByCode(searchParams.get('code')),
    [],
  );

  const initialMode = useMemo<StudioViewMode>(() => {
    const raw = searchParams.get('mode');
    if (
      raw === 'car' ||
      raw === 'closeup' ||
      raw === 'macro' ||
      raw === 'sphere' ||
      raw === 'swatch'
    ) {
      return raw;
    }
    return 'swatch';
  }, []);

  const [activeSwatch, setActiveSwatch] = useState<ColorFilmItem>(initialSwatch);
  const [viewMode, setViewMode] = useState<StudioViewMode>(initialMode);
  const [lightingPreset, setLightingPreset] =
    useState<StudioLightingPreset>('studio');
  const [railFinish, setRailFinish] = useState<'all' | FilmFinishType>('all');
  const [twoToneRoof, setTwoToneRoof] = useState<boolean>(false);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [pickedUp, setPickedUp] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [cardModalOpen, setCardModalOpen] = useState<boolean>(false);
  const [modelStatus, setModelStatus] = useState<CarModelLoadStatus>('idle');
  const [modelProgress, setModelProgress] = useState<number>(0);

  const railSwatches = useMemo(
    () =>
      railFinish === 'all'
        ? COLOR_STUDIO_SWATCHES
        : COLOR_STUDIO_SWATCHES.filter((s) => s.finish === railFinish),
    [railFinish],
  );

  const activeGlobalIndex = useMemo(() => {
    const idx = COLOR_STUDIO_SWATCHES.findIndex((s) => s.code === activeSwatch.code);
    return idx === -1 ? 0 : idx;
  }, [activeSwatch.code]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('code', activeSwatch.code);
    params.set('mode', viewMode);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [activeSwatch.code, viewMode]);

  const handleSelectSwatchByIndex = useCallback((idx: number) => {
    const len = COLOR_STUDIO_SWATCHES.length;
    const safeIdx = ((idx % len) + len) % len;
    setActiveSwatch(COLOR_STUDIO_SWATCHES[safeIdx]);
  }, []);

  const handleStepSwatch = useCallback(
    (delta: number) => {
      handleSelectSwatchByIndex(activeGlobalIndex + delta);
    },
    [activeGlobalIndex, handleSelectSwatchByIndex],
  );

  const handleTogglePickedUp = useCallback(() => {
    setPickedUp((prev) => !prev);
  }, []);

  const handleModelStatusChange = useCallback(
    (status: CarModelLoadStatus, progress: number) => {
      setModelStatus(status);
      setModelProgress(progress);
    },
    [],
  );

  const handleChangeViewMode = (mode: StudioViewMode) => {
    if (mode !== 'swatch') setPickedUp(false);
    setViewMode(mode);
  };

  const renderLightIcon = (key: StudioLightingPreset) => {
    if (key === 'studio') return <Moon className="w-3 h-3" />;
    if (key === 'gallery') return <Sun className="w-3 h-3" />;
    return <Sunset className="w-3 h-3" />;
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#08090c] text-[#F7F3EB] select-none">
      {/* 1. 全屏 3D HDR 舞台 */}
      <div className="absolute inset-0">
        <ColorStudioCanvas
          swatches={COLOR_STUDIO_SWATCHES}
          activeSwatch={activeSwatch}
          viewMode={viewMode}
          lightingPreset={lightingPreset}
          twoToneRoof={twoToneRoof}
          lang={lang}
          pickedUp={pickedUp}
          onSelectSwatchByIndex={handleSelectSwatchByIndex}
          onStepSwatch={handleStepSwatch}
          onTogglePickedUp={handleTogglePickedUp}
          onModelStatusChange={handleModelStatusChange}
        />
      </div>

      {/* 2. 顶部高定建筑感导航栏 */}
      <header className="absolute top-0 left-0 right-0 z-20 px-3 py-3 md:px-6 md:py-4 flex items-center justify-between gap-1.5 md:gap-2 pointer-events-none">
        {/* 左侧：返回 + 品牌标识 */}
        <div className="flex items-center gap-1.5 md:gap-3 pointer-events-auto whitespace-nowrap min-w-0">
          {!isEmbed && (
            <Link
              to="/products/color-ppf"
              aria-label={lang === 'zh' ? '返回官网' : 'Back'}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-[#0a0b0f]/75 hover:bg-[#14161e] border border-white/12 text-xs text-white/80 backdrop-blur-xl transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'zh' ? '返回' : 'Back'}</span>
            </Link>
          )}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#0a0b0f]/65 border border-white/10 backdrop-blur-xl">
            <span className="text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.1em] text-[#F7F3EB]">
              和膜 <span className="text-[#C9A86A]">HAMOREY</span>
            </span>
            <span className="hidden sm:inline-block w-px h-3 bg-[#C9A86A]/35" />
            <span className="hidden sm:inline text-[11px] tracking-widest text-white/60">
              {lang === 'zh' ? '高定选色工坊' : 'ATELIER STUDIO'}
            </span>
          </div>
        </div>

        {/* 桌面端居中：5 大视角分段控制器 */}
        <nav
          aria-label="展示模式"
          className="hidden lg:inline-flex items-center p-1 rounded-full bg-[#090a0e]/80 border border-[#C9A86A]/25 backdrop-blur-2xl shadow-2xl pointer-events-auto"
        >
          {VIEW_MODES.map((m) => {
            const active = viewMode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => handleChangeViewMode(m.key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                  active
                    ? 'bg-[#C9A86A] text-[#090A0D] font-semibold shadow'
                    : 'text-white/70 hover:text-[#F7F3EB]',
                )}
              >
                {lang === 'zh' ? m.label : m.labelEn}
              </button>
            );
          })}
        </nav>

        {/* 右侧：三档 HDR 灯光切换 + 语言 + 定制选色单 */}
        <div className="flex items-center gap-1 md:gap-2 pointer-events-auto flex-shrink-0">
          <div
            role="group"
            aria-label={lang === 'zh' ? '影棚光影切换' : 'Studio Lighting'}
            className="inline-flex items-center p-0.5 rounded-full bg-[#090a0e]/80 border border-white/12 backdrop-blur-xl"
          >
            {LIGHTING_PRESETS.map((preset) => {
              const active = lightingPreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setLightingPreset(preset.key)}
                  title={lang === 'zh' ? preset.label : preset.labelEn}
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 sm:px-2 md:px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap',
                    active
                      ? 'bg-white/15 text-[#E5C992] border border-[#C9A86A]/45'
                      : 'text-white/55 hover:text-white border border-transparent',
                  )}
                >
                  {renderLightIcon(preset.key)}
                  <span className="hidden sm:inline">
                    {lang === 'zh' ? preset.shortLabel : preset.shortLabelEn}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'zh' ? 'en' : 'zh'))}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#090a0e]/80 hover:bg-[#14161e] border border-white/15 backdrop-blur-xl text-[11px] font-mono font-semibold flex items-center justify-center transition-colors"
            aria-label="切换中英文"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>

          <button
            type="button"
            onClick={() => setCardModalOpen(true)}
            className="h-8 w-8 sm:w-auto sm:px-3 md:h-9 md:px-3.5 rounded-full bg-[#090a0e]/85 hover:bg-[#171922] border border-[#C9A86A]/55 text-[#E5C992] text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-xl transition-all whitespace-nowrap"
            aria-label={lang === 'zh' ? '定制选色单' : 'Spec Card'}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {lang === 'zh' ? '定制选色单' : 'Spec Card'}
            </span>
          </button>
        </div>
      </header>

      {/* 3. 左侧高定色号铭牌卡（桌面端详细光学参数 / 移动端精简浮层） */}
      <aside className="absolute top-14 left-3.5 md:top-20 md:left-6 z-20 pointer-events-auto max-w-[74vw] md:w-72">
        <div className="rounded-2xl bg-[#090a0e]/78 border border-[#C9A86A]/25 backdrop-blur-2xl p-3 md:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {/* 编号顶标 */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono tracking-[0.16em] text-[#C9A86A]">
            <span>
              {activeSwatch.code} ·{' '}
              {String(activeGlobalIndex + 1).padStart(2, '0')} /{' '}
              {String(COLOR_STUDIO_SWATCHES.length).padStart(2, '0')}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 tracking-normal">
              {HECAI_SPEC.thickness} TPU
            </span>
          </div>

          {/* 主副标题 */}
          <div className="mt-1.5 md:mt-2 flex items-center gap-2.5">
            <div
              className="w-7 h-7 md:hidden rounded-full border border-white/25 flex-shrink-0"
              style={{
                background: `radial-gradient(circle at 30% 25%, ${activeSwatch.shiftHex || activeSwatch.hex}, ${activeSwatch.hex} 75%)`,
              }}
            />
            <div className="min-w-0">
              <h1 className="text-base md:text-2xl font-display font-bold tracking-wide text-[#F7F3EB] truncate">
                {lang === 'zh' ? activeSwatch.name : activeSwatch.nameEn}
              </h1>
              <p className="text-[11px] text-white/50 font-mono truncate">
                {lang === 'zh' ? activeSwatch.nameEn : activeSwatch.name} ·{' '}
                {lang === 'zh' ? activeSwatch.finishLabel : activeSwatch.finishLabelEn}
              </p>
            </div>
          </div>

          {/* 桌面端：质感短评 + 3 项光学指标进度条 */}
          <div className="hidden md:block mt-3 pt-3 border-t border-white/10 space-y-2.5">
            <p className="text-xs text-white/70 leading-relaxed">
              {lang === 'zh' ? activeSwatch.tagline : activeSwatch.taglineEn}
            </p>

            <div className="space-y-1.5 pt-1">
              {[
                {
                  k: lang === 'zh' ? '镜面清漆' : 'Clearcoat Gloss',
                  v: activeSwatch.optics.gloss,
                },
                {
                  k: lang === 'zh' ? '金属微粒' : 'Metallic Flake',
                  v: activeSwatch.optics.metallic,
                },
                {
                  k: lang === 'zh' ? '折光幻彩' : 'Color Shift',
                  v: activeSwatch.optics.shift,
                },
              ].map((metric) => (
                <div key={metric.k} className="flex items-center gap-2 text-[11px]">
                  <span className="w-16 text-white/50 flex-shrink-0">{metric.k}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C9A86A] to-[#f0d8a8] transition-all duration-500"
                      style={{ width: `${metric.v}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-white/70">
                    {metric.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷动作：装车实看 / 全车同色与悬浮黑顶 */}
          <div className="mt-2.5 md:mt-3.5 pt-2.5 md:pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
            {viewMode !== 'car' && viewMode !== 'closeup' ? (
              <button
                type="button"
                onClick={() => handleChangeViewMode('car')}
                className="w-full h-8 md:h-9 rounded-xl bg-white/10 hover:bg-[#C9A86A] hover:text-[#090A0D] border border-white/15 hover:border-[#C9A86A] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Car className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '装车实看 3D 效果' : 'Preview on 3D GT'}</span>
              </button>
            ) : (
              <div className="w-full grid grid-cols-2 p-0.5 rounded-xl bg-black/50 border border-white/12">
                <button
                  type="button"
                  onClick={() => setTwoToneRoof(false)}
                  className={cn(
                    'py-1.5 rounded-lg text-[11px] font-medium transition-all',
                    !twoToneRoof
                      ? 'bg-[#C9A86A] text-[#090A0D] font-semibold'
                      : 'text-white/65 hover:text-white',
                  )}
                >
                  {lang === 'zh' ? '全车同色' : 'Full Wrap'}
                </button>
                <button
                  type="button"
                  onClick={() => setTwoToneRoof(true)}
                  className={cn(
                    'py-1.5 rounded-lg text-[11px] font-medium transition-all',
                    twoToneRoof
                      ? 'bg-[#C9A86A] text-[#090A0D] font-semibold'
                      : 'text-white/65 hover:text-white',
                  )}
                >
                  {lang === 'zh' ? '悬浮黑顶' : 'Black Roof'}
                </button>
              </div>
            )}

            {(viewMode === 'car' || viewMode === 'closeup') &&
              modelStatus === 'loading' && (
                <div className="w-full flex items-center justify-center gap-1.5 text-[11px] text-[#E5C992] py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>
                    {lang === 'zh'
                      ? `加载展车模型 ${modelProgress}%`
                      : `Loading 3D GT ${modelProgress}%`}
                  </span>
                </div>
              )}

            {(viewMode === 'car' || viewMode === 'closeup') &&
              modelStatus === 'error' && (
                <div className="w-full text-[11px] text-red-300 text-center">
                  {lang === 'zh' ? '3D 车模加载失败，请刷新重试' : 'Failed to load car model'}
                </div>
              )}
          </div>
        </div>
      </aside>

      {/* 4. 底部一体式控制台（移动端模式切换 + 高定流光色珠胶片轨） */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3.5 pt-2 md:px-6 md:pb-5 flex flex-col items-center gap-2 pointer-events-none bg-gradient-to-t from-black/85 via-black/45 to-transparent">
        {/* 小屏模式切换器 */}
        <nav
          aria-label="展示模式切换"
          className="lg:hidden inline-flex items-center p-1 rounded-full bg-[#090a0e]/85 border border-[#C9A86A]/25 backdrop-blur-xl pointer-events-auto max-w-full overflow-x-auto no-scrollbar"
        >
          {VIEW_MODES.map((m) => {
            const active = viewMode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => handleChangeViewMode(m.key)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  active
                    ? 'bg-[#C9A86A] text-[#090A0D] font-semibold'
                    : 'text-white/70 hover:text-white',
                )}
              >
                {lang === 'zh' ? m.shortLabel : m.labelEn}
              </button>
            );
          })}
        </nav>

        {/* 高定「流光色珠胶片轨」面板 */}
        <div className="w-full max-w-4xl rounded-2xl bg-[#090a0e]/82 border border-white/12 backdrop-blur-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-2xl pointer-events-auto">
          {/* 轨道顶排：工艺标签 + 操作指引 + 全系色谱典藏入口 */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {FINISH_FILTERS.map((f) => {
                const active = railFinish === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setRailFinish(f.key)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all',
                      active
                        ? 'bg-white/14 text-[#E5C992] border border-[#C9A86A]/45'
                        : 'text-white/55 hover:text-white border border-transparent',
                    )}
                  >
                    {lang === 'zh' ? f.label : f.labelEn}
                  </button>
                );
              })}
            </div>

            <p className="hidden lg:block text-[11px] text-white/40 truncate">
              {viewMode === 'swatch'
                ? lang === 'zh'
                  ? pickedUp
                    ? '拖动调节样板角度 · 双击放回廊道'
                    : '左右滑动切色 · 上下拖动看曲率折光 · 双击特写'
                  : 'Drag to inspect angle · Double-tap to dock'
                : lang === 'zh'
                  ? '拖动 360° 旋转 · 滚轮或双指缩放漆面细节'
                  : 'Drag to orbit 360° · Pinch or scroll to zoom'}
            </p>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C9A86A]/15 hover:bg-[#C9A86A]/25 border border-[#C9A86A]/40 text-[11px] font-medium text-[#E5C992] whitespace-nowrap transition-colors flex-shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'zh' ? '全系色谱典藏' : 'Archive'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* 轨道底排：横向立体流光色珠选择轨 */}
          <div className="mt-2.5 flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 no-scrollbar">
            {railSwatches.map((swatch) => {
              const selected = swatch.code === activeSwatch.code;
              const shiftTone = swatch.shiftHex || swatch.hex;
              return (
                <button
                  key={swatch.code}
                  type="button"
                  onClick={() => setActiveSwatch(swatch)}
                  className={cn(
                    'group flex flex-col items-center gap-1 px-1.5 py-1 rounded-xl transition-all flex-shrink-0 min-w-[54px] md:min-w-[60px]',
                    selected
                      ? 'bg-white/[0.08]'
                      : 'hover:bg-white/[0.04]',
                  )}
                >
                  <span
                    className={cn(
                      'w-8 h-8 md:w-9 md:h-9 rounded-full relative transition-transform duration-200',
                      selected
                        ? 'scale-110 ring-2 ring-[#C9A86A] ring-offset-2 ring-offset-[#090a0e]'
                        : 'group-hover:scale-105 ring-1 ring-white/20',
                    )}
                    style={{
                      background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5) 0%, ${shiftTone} 28%, ${swatch.hex} 72%, #050608 100%)`,
                      boxShadow: 'inset -3px -4px 8px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.5)',
                    }}
                  >
                    <span className="absolute top-1 left-1.5 w-2.5 h-1 rounded-full bg-white/60 -rotate-[25deg] pointer-events-none" />
                  </span>
                  <span
                    className={cn(
                      'text-[10px] leading-tight truncate max-w-[54px] md:max-w-[60px]',
                      selected ? 'text-[#E5C992] font-semibold' : 'text-white/60',
                    )}
                  >
                    {lang === 'zh' ? swatch.name : swatch.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* 5. 全系色谱典藏画廊弹窗 */}
      <ColorCatalogDrawer
        open={drawerOpen}
        activeSwatch={activeSwatch}
        lang={lang}
        onClose={() => setDrawerOpen(false)}
        onSelectSwatch={(swatch) => setActiveSwatch(swatch)}
      />

      {/* 6. 定制选色单与海报生成弹窗 */}
      <ColorCardModal
        open={cardModalOpen}
        swatch={activeSwatch}
        lang={lang}
        isEmbed={isEmbed}
        onClose={() => setCardModalOpen(false)}
      />
    </div>
  );
}
