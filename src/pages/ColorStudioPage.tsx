import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Car,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Moon,
  Hand,
  Pause,
  Play,
  Undo2,
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
  STUDIO_VEHICLES,
  findColorSwatchByCode,
  type ColorFilmItem,
  type FilmFinishType,
  type StudioLightingPreset,
  type StudioVehicleId,
  type StudioViewMode,
} from '../config/colorStudio';
import type { CarModelLoadStatus } from '../components/color-studio/ColorStudioCanvas';
import { SwatchFan } from '../components/color-studio/SwatchFan';
import './ColorStudioFanLayout.css';
import { ColorCatalogDrawer } from '../components/color-studio/ColorCatalogDrawer';
import { ColorCardModal } from '../components/color-studio/ColorCardModal';
import {
  useStudioProtectionShield,
  useWeChatMiniProgramEmbed,
} from '../components/color-studio/studioGuard';
import { cn } from '../lib/cn';

const loadColorStudioCanvas = () => import('../components/color-studio/ColorStudioCanvas');
const createLazyColorStudioCanvas = () =>
  lazy(() => loadColorStudioCanvas().then((module) => ({ default: module.ColorStudioCanvas })));
let LazyColorStudioCanvas = createLazyColorStudioCanvas();

class Studio3DErrorBoundary extends Component<
  {
    resetKey: string;
    lang: 'zh' | 'en';
    onRetry: () => void;
    onBackToSwatch: () => void;
    children: ReactNode;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const isZh = this.props.lang === 'zh';
    return (
      <div className="grid h-full place-items-center p-6 bg-[#08090c]">
        <div className="max-w-sm w-full rounded-2xl bg-[#090a0e]/95 border border-[#C9A86A]/30 p-5 text-center space-y-3 shadow-2xl">
          <p className="text-sm font-semibold text-[#F7F3EB]">
            {isZh ? '3D 展台网络加载未完成' : '3D Studio Failed to Load'}
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            {isZh
              ? '当前网络可能较弱，可重试加载 3D 展台，或先返回流光样板继续选色。'
              : 'Network interrupted while loading 3D assets. Retry or return to swatches.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                LazyColorStudioCanvas = createLazyColorStudioCanvas();
                this.setState({ hasError: false });
                this.props.onRetry();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#C9A86A] text-[#090A0D] text-xs font-semibold"
            >
              {isZh ? '重试加载' : 'Retry'}
            </button>
            <button
              type="button"
              onClick={this.props.onBackToSwatch}
              className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-[#F7F3EB] text-xs font-medium"
            >
              {isZh ? '返回流光样板' : 'Back to Swatches'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * 用户在扇形样板页浏览时，利用浏览器空闲时间预取 3D 引擎分包与当前车型模型，
 * 移动端仅在明确为 Wi-Fi 或以太网时预取，微信中无法识别网络类型时按需加载。
 */
function prefetchStudio3D(modelUrl: string, isEmbed: boolean): () => void {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string; type?: string };
  };
  const connection = nav.connection;
  const isMobile = isEmbed || window.matchMedia('(pointer: coarse)').matches;
  const isUnmetered = connection?.type === 'wifi' || connection?.type === 'ethernet';
  if (connection?.saveData || connection?.type === 'cellular' ||
      ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '') ||
      (isMobile && !isUnmetered)) {
    return () => {};
  }
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    loadColorStudioCanvas().catch(() => {});
    fetch(modelUrl, { credentials: 'same-origin' }).catch(() => {});
  };
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const timer = window.setTimeout(() => {
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 });
    else run();
  }, 2500);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}

const VIEW_MODES: Array<{
  key: StudioViewMode;
  label: string;
  shortLabel: string;
  labelEn: string;
}> = [
  { key: 'swatch', label: '流光样板', shortLabel: '样板', labelEn: 'Swatches' },
  { key: 'car', label: '实车整车', shortLabel: '整车', labelEn: 'Vehicle' },
  { key: 'closeup', label: '腰线近景', shortLabel: '近景', labelEn: 'Detail' },
  { key: 'macro', label: '微距肌理', shortLabel: '微距', labelEn: 'Macro' },
  { key: 'sphere', label: '光影球体', shortLabel: '球体', labelEn: 'Sphere' },
];

export default function ColorStudioPage() {
  useSEO('color-studio');

  const [searchParams] = useSearchParams();
  const isEmbed = useWeChatMiniProgramEmbed(searchParams.get('embed') === 'miniprogram');
  const isAuthorizedHost = useStudioProtectionShield();

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

  const initialVehicle = useMemo<StudioVehicleId>(() => {
    const raw = searchParams.get('car');
    return raw === 'modely' ? 'modely' : 'model3';
  }, []);

  const [activeSwatch, setActiveSwatch] = useState<ColorFilmItem>(initialSwatch);
  const [viewMode, setViewMode] = useState<StudioViewMode>(initialMode);
  const [lightingPreset, setLightingPreset] =
    useState<StudioLightingPreset>('studio');
  const [railFinish, setRailFinish] = useState<'all' | FilmFinishType>('all');
  const [vehicleId, setVehicleId] = useState<StudioVehicleId>(initialVehicle);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [pickedUp, setPickedUp] = useState<boolean>(false);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const railRef = useRef<HTMLDivElement>(null);
  const railDragRef = useRef<{ active: boolean; startX: number; startScroll: number; moved: boolean }>({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const [railScrollable, setRailScrollable] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: true,
  });
  const [railDragging, setRailDragging] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [cardModalOpen, setCardModalOpen] = useState<boolean>(false);
  const [modelStatus, setModelStatus] = useState<CarModelLoadStatus>('idle');
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [retryToken, setRetryToken] = useState<number>(0);

  useEffect(() => {
    if (!isEmbed) return;
    document.title = lang === 'zh' ? '和膜在线选色' : 'HAMOREY Color Studio';
  }, [isEmbed, lang]);

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
    params.set('car', vehicleId);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [activeSwatch.code, viewMode, vehicleId]);

  useEffect(() => {
    if (viewMode !== 'swatch') return;
    const vehicle = STUDIO_VEHICLES.find((v) => v.id === vehicleId) ?? STUDIO_VEHICLES[0];
    return prefetchStudio3D(vehicle.modelUrl, isEmbed);
  }, [viewMode, vehicleId, isEmbed]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => { if (preference.matches) setPlaying(false); };
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  const updateRailScrollButtons = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const left = rail.scrollLeft > 4;
    const right = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4;
    setRailScrollable((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onWheel = (e: WheelEvent) => {
      if (rail.scrollWidth <= rail.clientWidth) return;
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      e.preventDefault();
      rail.scrollLeft += delta;
    };
    const onScroll = () => updateRailScrollButtons();
    rail.addEventListener('wheel', onWheel, { passive: false });
    rail.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateRailScrollButtons) : null;
    ro?.observe(rail);
    updateRailScrollButtons();
    return () => {
      rail.removeEventListener('wheel', onWheel);
      rail.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  }, [railSwatches.length, updateRailScrollButtons]);

  useEffect(() => {
    const rail = railRef.current;
    const chip = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!rail || !chip) return;
    const parent = rail.getBoundingClientRect(), item = chip.getBoundingClientRect();
    if (item.left < parent.left || item.right > parent.right) {
      rail.scrollLeft += item.left - parent.left - (parent.width - item.width) / 2;
    }
    updateRailScrollButtons();
  }, [activeSwatch.code, railFinish, viewMode, updateRailScrollButtons]);

  const scrollRailBy = (dir: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const distance = Math.max(220, Math.round(rail.clientWidth * 0.72));
    rail.scrollBy({ left: dir * distance, behavior: 'smooth' });
  };

  function selectFromControls(swatch: ColorFilmItem) {
    if (viewMode === 'swatch') {
      setPlaying(false);
      setPickedUp(false);
      if (railFinish !== 'all' && swatch.finish !== railFinish) setRailFinish('all');
    }
    setActiveSwatch(swatch);
  }

  function selectFinish(finish: 'all' | FilmFinishType) {
    setRailFinish(finish);
    if (viewMode !== 'swatch') return;
    setPlaying(false);
    setPickedUp(false);
    if (finish !== 'all' && finish !== activeSwatch.finish) {
      const first = COLOR_STUDIO_SWATCHES.find(swatch => swatch.finish === finish);
      if (first) setActiveSwatch(first);
    }
  }

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

  const handleModelStatusChange = useCallback(
    (status: CarModelLoadStatus, progress: number) => {
      setModelStatus(status);
      setModelProgress(progress);
    },
    [],
  );

  const handleChangeViewMode = (mode: StudioViewMode) => {
    setPickedUp(false);
    if (mode === 'swatch' && railFinish !== 'all' && activeSwatch.finish !== railFinish) {
      setRailFinish('all');
    }
    setViewMode(mode);
  };

  const renderLightIcon = (key: StudioLightingPreset) => {
    if (key === 'studio') return <Moon className="w-3 h-3" />;
    if (key === 'gallery') return <Sun className="w-3 h-3" />;
    return <Sunset className="w-3 h-3" />;
  };

  return (
    <div
      className={cn(
        'relative w-full h-[100dvh] overflow-hidden overscroll-none bg-[#08090c] text-[#F7F3EB] select-none',
        viewMode === 'swatch' && '_hsl_p',
      )}
    >
      {!isAuthorizedHost && (
        <div className="fixed inset-0 z-[999] pointer-events-auto flex items-center justify-center bg-black/92 p-6 text-center">
          <div className="max-w-md space-y-2 border border-[#C9A86A]/40 rounded-2xl p-6 bg-[#0b0c10]">
            <p className="text-xs font-mono tracking-[0.2em] text-[#C9A86A]">HAMOREY PROPRIETARY</p>
            <h2 className="text-lg font-bold text-[#F7F3EB]">未授权域名访问受限</h2>
            <p className="text-xs text-white/65 leading-relaxed">
              本 3D 高定选色系统及加密色库归和膜 HAMOREY 专有，请通过官方渠道访问。
            </p>
          </div>
        </div>
      )}

      {/* 2. 顶部高定建筑感导航栏（适配刘海屏与小程序安全区） */}
      <header className="absolute top-0 left-0 right-0 z-20 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 md:px-6 md:py-4 flex items-center justify-between gap-1.5 md:gap-2 pointer-events-none">
        {/* 左侧：返回 + 品牌标识 */}
        <div className="flex items-center gap-1.5 md:gap-3 pointer-events-auto whitespace-nowrap min-w-0">
          {!isEmbed && (
            <Link
              to="/products/color-ppf"
              aria-label={lang === 'zh' ? '返回官网' : 'Back'}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-[#0a0b0f]/92 hover:bg-[#14161e] border border-white/12 text-xs text-white/80 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'zh' ? '返回' : 'Back'}</span>
            </Link>
          )}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#0a0b0f]/92 border border-white/10">
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
          className="hidden lg:inline-flex items-center p-1 rounded-full bg-[#090a0e]/92 border border-[#C9A86A]/25 shadow-2xl pointer-events-auto"
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
            className="inline-flex items-center p-0.5 rounded-full bg-[#090a0e]/92 border border-white/12"
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
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#090a0e]/92 hover:bg-[#14161e] border border-white/15 text-[11px] font-mono font-semibold flex items-center justify-center transition-colors"
            aria-label="切换中英文"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>

          <button
            type="button"
            onClick={() => setCardModalOpen(true)}
            className="h-8 w-8 sm:w-auto sm:px-3 md:h-9 md:px-3.5 rounded-full bg-[#090a0e]/92 hover:bg-[#171922] border border-[#C9A86A]/55 text-[#E5C992] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
            aria-label={lang === 'zh' ? '定制选色单' : 'Spec Card'}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {lang === 'zh' ? '定制选色单' : 'Spec Card'}
            </span>
          </button>
        </div>
      </header>

      {viewMode === 'swatch' ? (
        <>
          <section className="_hsl_tb" aria-label={lang === 'zh' ? '当前色卡' : 'Current swatch'}>
            <div className="_hsl_id">
              <div className="_hsl_mt"><span>{activeSwatch.code}</span><span>{lang === 'zh' ? activeSwatch.seriesName.split(' ')[0] : activeSwatch.finishLabelEn}</span></div>
              <div className="_hsl_tt">
                <h1>{lang === 'zh' ? activeSwatch.name : activeSwatch.nameEn}</h1>
                <span lang={lang === 'zh' ? 'en' : 'zh'}>{lang === 'zh' ? activeSwatch.nameEn : activeSwatch.name}</span>
              </div>
            </div>
            {pickedUp && (
              <div className="_hsl_op">
                <span>{lang === 'zh' ? '镜面清漆' : 'Gloss'} <b>{activeSwatch.optics.gloss}</b></span>
                <span>{lang === 'zh' ? '金属微粒' : 'Flake'} <b>{activeSwatch.optics.metallic}</b></span>
                <span>{lang === 'zh' ? '折光幻彩' : 'Shift'} <b>{activeSwatch.optics.shift}</b></span>
              </div>
            )}
            <div className="_hsl_ac">
              <button type="button" className="_b_pl" disabled={pickedUp} aria-label={lang === 'zh' ? (playing ? '暂停轮播' : '开始轮播') : (playing ? 'Pause playback' : 'Start playback')} title={lang === 'zh' ? (playing ? '暂停轮播' : '开始轮播') : (playing ? 'Pause' : 'Play')} onClick={() => setPlaying(on => !on)}>
                {playing && !pickedUp ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button type="button" className="_b_hd" aria-pressed={pickedUp} onClick={() => setPickedUp(on => !on)}>
                {pickedUp ? <Undo2 size={15} /> : <Hand size={15} />}
                {lang === 'zh' ? (pickedUp ? '放回色卡' : '拿起色卡') : (pickedUp ? 'Return' : 'Pick up')}
              </button>
              <button type="button" className="_b_vh" onClick={() => handleChangeViewMode('car')}>
                <Car size={15} />{lang === 'zh' ? '装车预览' : 'On car'}
              </button>
            </div>
          </section>
          <main className="_hsl_st" aria-label={lang === 'zh' ? '流光样板' : 'Swatch gallery'}>
            <SwatchFan swatches={railSwatches} activeSwatch={activeSwatch} lightingPreset={lightingPreset}
              lang={lang} pickedUp={pickedUp} paused={!playing || drawerOpen || cardModalOpen}
              onSelect={setActiveSwatch} onPickedUpChange={setPickedUp} />
          </main>
        </>
      ) : (
        <div className="absolute inset-0">
          <Studio3DErrorBoundary
            resetKey={`${viewMode}-${retryToken}`}
            lang={lang}
            onRetry={() => setRetryToken((n) => n + 1)}
            onBackToSwatch={() => handleChangeViewMode('swatch')}
          >
            <Suspense fallback={<div className="grid h-full place-items-center"><Loader2 aria-label={lang === 'zh' ? '载入 3D 展台' : 'Loading 3D studio'} className="text-[#C9A86A] animate-spin" /></div>}>
              <LazyColorStudioCanvas
                activeSwatch={activeSwatch}
                viewMode={viewMode}
                lightingPreset={lightingPreset}
                vehicleId={vehicleId}
                paused={drawerOpen || cardModalOpen}
                retryToken={retryToken}
                onStepSwatch={handleStepSwatch}
                onModelStatusChange={handleModelStatusChange}
              />
            </Suspense>
          </Studio3DErrorBoundary>
        </div>
      )}

      {/* 3A. 手机与小程序端紧凑通栏信息胶囊（释放竖屏 3D 视口，不挡车模与球体） */}
      {viewMode !== 'swatch' && (
        <div className="md:hidden absolute left-3 right-3 top-[calc(3.15rem+env(safe-area-inset-top))] z-20 pointer-events-none flex flex-col gap-1.5">
          <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl bg-[#090a0e]/92 border border-[#C9A86A]/25 px-3 py-2 shadow-xl">
            <button
              type="button"
              onClick={() => setCardModalOpen(true)}
              className="flex items-center gap-2 min-w-0 text-left"
            >
              <span
                className="w-6 h-6 rounded-full border border-white/25 flex-shrink-0"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${activeSwatch.shiftHex || activeSwatch.hex}, ${activeSwatch.hex} 75%)`,
                }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#F7F3EB] truncate leading-tight">
                  {lang === 'zh' ? activeSwatch.name : activeSwatch.nameEn}
                </span>
                <span className="block text-[10px] font-mono text-[#C9A86A] truncate leading-tight mt-0.5">
                  {activeSwatch.code} · {lang === 'zh' ? activeSwatch.finishLabel : activeSwatch.finishLabelEn}
                </span>
              </span>
            </button>

            {viewMode === 'car' || viewMode === 'closeup' ? (
              <div
                role="group"
                aria-label={lang === 'zh' ? '展车车型切换' : 'Vehicle Selector'}
                className="inline-flex items-center p-0.5 rounded-xl bg-black/65 border border-white/12 flex-shrink-0"
              >
                {STUDIO_VEHICLES.map((vehicle) => {
                  const active = vehicleId === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setVehicleId(vehicle.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap',
                        active
                          ? 'bg-[#C9A86A] text-[#090A0D] font-semibold'
                          : 'text-white/65',
                      )}
                    >
                      {vehicle.shortName}
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleChangeViewMode('car')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 active:bg-[#C9A86A] active:text-[#090A0D] border border-white/15 text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
              >
                <Car className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '装车' : 'Car'}</span>
              </button>
            )}
          </div>

          {(viewMode === 'car' || viewMode === 'closeup') && modelStatus === 'loading' && (
            <div className="self-center px-3 py-1 rounded-full bg-[#090a0e]/90 border border-[#C9A86A]/30 flex items-center gap-1.5 text-[11px] text-[#E5C992]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>
                {lang === 'zh'
                  ? `加载 ${vehicleId === 'modely' ? 'Model Y' : 'Model 3'} ${modelProgress}%`
                  : `Loading ${vehicleId === 'modely' ? 'Model Y' : 'Model 3'} ${modelProgress}%`}
              </span>
            </div>
          )}

          {(viewMode === 'car' || viewMode === 'closeup') && modelStatus === 'error' && (
            <div className="pointer-events-auto self-center px-3 py-1.5 rounded-full bg-red-950/92 border border-red-500/40 flex items-center gap-2 text-[11px] text-red-200 shadow-lg">
              <span>{lang === 'zh' ? '车模加载未完成' : 'Model load failed'}</span>
              <button
                type="button"
                onClick={() => setRetryToken((n) => n + 1)}
                className="px-2 py-0.5 rounded-full bg-[#C9A86A] text-[#090A0D] font-semibold"
              >
                {lang === 'zh' ? '重试' : 'Retry'}
              </button>
              <button
                type="button"
                onClick={() => handleChangeViewMode('swatch')}
                className="px-2 py-0.5 rounded-full bg-white/12 text-white font-medium"
              >
                {lang === 'zh' ? '返回样板' : 'Swatches'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3B. 桌面端左侧高定色号铭牌卡 */}
      {viewMode !== 'swatch' && <aside className="hidden md:block absolute md:top-20 md:left-6 z-20 pointer-events-auto md:w-72">
        <div className="rounded-2xl bg-[#090a0e]/92 border border-[#C9A86A]/25 p-3 md:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
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

          {/* 快捷动作：装车实看 / 双车型切换（Model 3 焕新版 / Model Y 焕新版） */}
          <div className="mt-2.5 md:mt-3.5 pt-2.5 md:pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
            {viewMode !== 'car' && viewMode !== 'closeup' ? (
              <button
                type="button"
                onClick={() => handleChangeViewMode('car')}
                className="w-full h-8 md:h-9 rounded-xl bg-white/10 hover:bg-[#C9A86A] hover:text-[#090A0D] border border-white/15 hover:border-[#C9A86A] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Car className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '装车实看 3D 效果' : 'Preview on 3D Car'}</span>
              </button>
            ) : (
              <div
                role="group"
                aria-label={lang === 'zh' ? '展车车型切换' : 'Vehicle Selector'}
                className="w-full grid grid-cols-2 p-0.5 rounded-xl bg-black/50 border border-white/12"
              >
                {STUDIO_VEHICLES.map((vehicle) => {
                  const active = vehicleId === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setVehicleId(vehicle.id)}
                      className={cn(
                        'py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap',
                        active
                          ? 'bg-[#C9A86A] text-[#090A0D] font-semibold shadow'
                          : 'text-white/65 hover:text-white',
                      )}
                    >
                      {lang === 'zh' ? vehicle.name : vehicle.shortName}
                    </button>
                  );
                })}
              </div>
            )}

            {(viewMode === 'car' || viewMode === 'closeup') &&
              modelStatus === 'loading' && (
                <div className="w-full flex items-center justify-center gap-1.5 text-[11px] text-[#E5C992] py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>
                    {lang === 'zh'
                      ? `加载${vehicleId === 'modely' ? ' Model Y ' : ' Model 3 '}模型 ${modelProgress}%`
                      : `Loading ${vehicleId === 'modely' ? 'Model Y' : 'Model 3'} ${modelProgress}%`}
                  </span>
                </div>
              )}

            {(viewMode === 'car' || viewMode === 'closeup') &&
              modelStatus === 'error' && (
                <div className="w-full flex items-center justify-between gap-2 pt-1 text-[11px] text-red-200">
                  <span>{lang === 'zh' ? '车模加载未完成' : 'Load failed'}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRetryToken((n) => n + 1)}
                      className="px-2 py-0.5 rounded-md bg-[#C9A86A] text-[#090A0D] font-semibold"
                    >
                      {lang === 'zh' ? '重试' : 'Retry'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeViewMode('swatch')}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white"
                    >
                      {lang === 'zh' ? '回样板' : 'Swatches'}
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </aside>}

      {/* 4. 底部一体式控制台（移动端与小程序底部安全区适配 + 高定流光色珠胶片轨） */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1.5 md:px-6 md:pb-5 flex flex-col items-center gap-1.5 md:gap-2 pointer-events-none bg-gradient-to-t from-black/85 via-black/45 to-transparent">
        {viewMode === 'swatch' && (
          <p className="_hsl_ht">
            {lang === 'zh'
              ? pickedUp ? '拖动色卡看折光 · 双击放回' : '滑动切色 · 双击拿起色卡'
              : pickedUp ? 'Drag to tilt · Double-tap to return' : 'Swipe to browse · Double-tap to pick up'}
          </p>
        )}
        {/* 小屏模式切换器 */}
        <nav
          aria-label="展示模式切换"
          className="lg:hidden inline-flex items-center p-1 rounded-full bg-[#090a0e]/92 border border-[#C9A86A]/25 pointer-events-auto max-w-full overflow-x-auto no-scrollbar"
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
        <div className="w-full max-w-4xl rounded-2xl bg-[#090a0e]/92 border border-white/12 px-2.5 py-2 md:px-4 md:py-3 shadow-2xl pointer-events-auto">
          {/* 轨道顶排：工艺标签 + 操作指引 + 全系色谱典藏入口 */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {FINISH_FILTERS.map((f) => {
                const active = railFinish === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => selectFinish(f.key)}
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

            {viewMode !== 'swatch' && <p className="hidden lg:block text-[11px] text-white/40 truncate">
              {lang === 'zh' ? '拖动 360° 旋转 · 滚轮或双指缩放漆面细节' : 'Drag to orbit 360° · Pinch or scroll to zoom'}
            </p>}

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

          {/* 轨道底排：横向立体流光色珠选择轨（支持滚轮、鼠标拖拽、触屏滑动与左右翻页箭头） */}
          <div className="relative mt-2 md:mt-2.5">
            {railScrollable.left && (
              <button
                type="button"
                aria-label={lang === 'zh' ? '向左滑动色珠' : 'Scroll swatches left'}
                onClick={() => scrollRailBy(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0b0d12]/95 hover:bg-[#C9A86A] text-[#E5C992] hover:text-[#090A0D] border border-[#C9A86A]/40 shadow-[0_4px_14px_rgba(0,0,0,0.75)] flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {railScrollable.right && (
              <button
                type="button"
                aria-label={lang === 'zh' ? '向右滑动色珠' : 'Scroll swatches right'}
                onClick={() => scrollRailBy(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0b0d12]/95 hover:bg-[#C9A86A] text-[#E5C992] hover:text-[#090A0D] border border-[#C9A86A]/40 shadow-[0_4px_14px_rgba(0,0,0,0.75)] flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div
              ref={railRef}
              onPointerDown={(e) => {
                if (e.pointerType !== 'mouse' || e.button !== 0) return;
                const rail = railRef.current;
                if (!rail) return;
                railDragRef.current = {
                  active: true,
                  startX: e.clientX,
                  startScroll: rail.scrollLeft,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                const drag = railDragRef.current;
                if (!drag.active || e.pointerType !== 'mouse') return;
                const rail = railRef.current;
                if (!rail) return;
                const dx = e.clientX - drag.startX;
                if (!drag.moved && Math.abs(dx) > 5) {
                  drag.moved = true;
                  setRailDragging(true);
                }
                if (drag.moved) {
                  rail.scrollLeft = drag.startScroll - dx;
                }
              }}
              onPointerUp={() => {
                const drag = railDragRef.current;
                drag.active = false;
                if (drag.moved) {
                  setRailDragging(false);
                  window.setTimeout(() => {
                    railDragRef.current.moved = false;
                  }, 0);
                }
              }}
              onPointerCancel={() => {
                railDragRef.current.active = false;
                railDragRef.current.moved = false;
                setRailDragging(false);
              }}
              onPointerLeave={() => {
                if (railDragRef.current.active) {
                  railDragRef.current.active = false;
                  setRailDragging(false);
                  window.setTimeout(() => {
                    railDragRef.current.moved = false;
                  }, 0);
                }
              }}
              className={cn(
                'flex items-center gap-1.5 md:gap-3 overflow-x-auto pb-0.5 px-1 no-scrollbar touch-pan-x select-none',
                railDragging ? 'cursor-grabbing' : 'md:cursor-grab',
              )}
            >
              {railSwatches.map((swatch) => {
                const selected = swatch.code === activeSwatch.code;
                const shiftTone = swatch.shiftHex || swatch.hex;
                return (
                  <button
                    key={swatch.code}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      if (railDragRef.current.moved) return;
                      selectFromControls(swatch);
                    }}
                    className={cn(
                      'group flex flex-col items-center gap-1 px-1 sm:px-1.5 py-1 rounded-xl transition-all flex-shrink-0 min-w-[50px] md:min-w-[60px]',
                      selected
                        ? 'bg-white/[0.08]'
                        : 'hover:bg-white/[0.04]',
                    )}
                  >
                    <span
                      className={cn(
                        'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full relative transition-transform duration-200',
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
        </div>
      </footer>

      {/* 5. 全系色谱典藏画廊弹窗 */}
      <ColorCatalogDrawer
        open={drawerOpen}
        activeSwatch={activeSwatch}
        lang={lang}
        onClose={() => setDrawerOpen(false)}
        onSelectSwatch={selectFromControls}
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
