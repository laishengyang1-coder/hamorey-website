// ============================================================
// 和膜 HAMOREY — 全系色谱典藏画廊弹窗 V2（曜石黑 × 香槟金高定 UI）
// 色系家族筛选 + 工艺过滤 + 搜索 + 立体双曲流光漆面圆穹预览卡
// ============================================================

import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check, Search, Sparkles, X } from 'lucide-react';
import {
  COLOR_STUDIO_SWATCHES,
  FINISH_FILTERS,
  HUE_GROUPS,
  matchesHueGroup,
  type ColorFilmItem,
  type ColorHueGroup,
  type FilmFinishType,
} from '../../config/colorStudio';
import { cn } from '../../lib/cn';
import { getSwatchOrbVisual } from './swatchVisuals';

export interface ColorCatalogDrawerProps {
  open: boolean;
  activeSwatch: ColorFilmItem;
  lang: 'zh' | 'en';
  onClose: () => void;
  onSelectSwatch: (swatch: ColorFilmItem) => void;
}

export function ColorCatalogDrawer({
  open,
  activeSwatch,
  lang,
  onClose,
  onSelectSwatch,
}: ColorCatalogDrawerProps) {
  const [query, setQuery] = useState('');
  const [finishFilter, setFinishFilter] = useState<'all' | FilmFinishType>('all');
  const [hueGroup, setHueGroup] = useState<ColorHueGroup>('all');
  // 连续彩虹色谱筛选：null = 全部；'neutral' = 黑白灰；0..360 = 指定色相角（±26°）
  const [spectrumPick, setSpectrumPick] = useState<null | 'neutral' | number>(null);
  const [spectrumPos, setSpectrumPos] = useState<number>(0);
  const spectrumBarRef = useRef<HTMLDivElement | null>(null);

  const updateSpectrumFromClientX = (clientX: number) => {
    const bar = spectrumBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    setSpectrumPos(ratio);
    setHueGroup('all');
    if (ratio <= 0.13) {
      setSpectrumPick('neutral');
    } else {
      const hueDeg = Math.round(((ratio - 0.13) / 0.87) * 360) % 360;
      setSpectrumPick(hueDeg);
    }
  };

  const handleSpectrumPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSpectrumFromClientX(e.clientX);
  };

  const handleSpectrumPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0 && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateSpectrumFromClientX(e.clientX);
  };

  const countsByFinish = useMemo(
    () => ({
      all: COLOR_STUDIO_SWATCHES.length,
      crystal: COLOR_STUDIO_SWATCHES.filter((s) => s.finish === 'crystal').length,
      metallic: COLOR_STUDIO_SWATCHES.filter((s) => s.finish === 'metallic').length,
      pearlescent: COLOR_STUDIO_SWATCHES.filter((s) => s.finish === 'pearlescent').length,
      chameleon: COLOR_STUDIO_SWATCHES.filter((s) => s.finish === 'chameleon').length,
      special: COLOR_STUDIO_SWATCHES.filter((s) => s.finish === 'special').length,
    }),
    [],
  );

  const filteredSwatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COLOR_STUDIO_SWATCHES.filter((item) => {
      if (finishFilter !== 'all' && item.finish !== finishFilter) return false;
      if (spectrumPick === 'neutral') {
        if (!item.isNeutral) return false;
      } else if (typeof spectrumPick === 'number') {
        if (item.isNeutral) return false;
        const diff = Math.abs(item.hue - spectrumPick);
        const dist = Math.min(diff, 360 - diff);
        if (dist > 26) return false;
      } else if (!matchesHueGroup(item, hueGroup)) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.finishLabel.toLowerCase().includes(q) ||
        item.finishLabelEn.toLowerCase().includes(q)
      );
    });
  }, [query, finishFilter, hueGroup, spectrumPick]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/88 animate-fade-in p-0 md:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'zh' ? '和彩全系色谱典藏' : 'HAMOREY Color Archive'}
        className="w-full max-w-4xl h-[88dvh] md:h-[84dvh] rounded-t-3xl md:rounded-2xl bg-[#0a0b0f] border border-[#C9A86A]/25 shadow-[0_32px_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[#F7F3EB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部高定标题栏 */}
        <div className="pt-3.5 pb-4 px-5 md:px-7 border-b border-white/10 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 md:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A86A]">
                HAMOREY ATELIER ARCHIVE · {COLOR_STUDIO_SWATCHES.length} BESPOKE SHADES
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold tracking-wide mt-1">
                {lang === 'zh' ? '和彩全系色谱典藏' : 'Hecai Color Archive'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-xs font-medium text-[#F7F3EB] transition-colors whitespace-nowrap"
            >
              {lang === 'zh' ? '收起' : 'Close'}
            </button>
          </div>

          {/* 搜索框 + 工艺过滤 */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#C9A86A]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === 'zh'
                    ? `搜索 ${COLOR_STUDIO_SWATCHES.length} 款 2026 官方色号（色名 / TPU-003S / 工艺）`
                    : `Search ${COLOR_STUDIO_SWATCHES.length} shades by name, code, or finish...`
                }
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-white/[0.04] border border-white/12 text-base md:text-sm text-[#F7F3EB] placeholder:text-white/35 focus:outline-none focus:border-[#C9A86A]/65"
                style={{ color: '#F7F3EB' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                  aria-label="清空搜索"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {FINISH_FILTERS.map((f) => {
                const active = finishFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFinishFilter(f.key)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border',
                      active
                        ? 'bg-[#C9A86A] text-[#090A0D] border-[#C9A86A] font-semibold'
                        : 'bg-white/[0.04] text-white/70 border-white/10 hover:border-white/25 hover:text-white',
                    )}
                  >
                    {lang === 'zh' ? f.label : f.labelEn}{' '}
                    <span className={active ? 'opacity-75' : 'opacity-45'}>
                      {countsByFinish[f.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 连续彩虹光谱条：按颜色浏览 */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-white/60">
                {lang === 'zh' ? '按颜色浏览（拖动或点击色谱精准筛选）' : 'Browse by Color Spectrum'}
              </span>
              {spectrumPick !== null && (
                <button
                  type="button"
                  onClick={() => setSpectrumPick(null)}
                  className="text-[#C9A86A] hover:text-[#f0d8a8] font-medium transition-colors"
                >
                  {lang === 'zh' ? '清除色谱筛选' : 'Clear spectrum'}
                </button>
              )}
            </div>
            <div
              ref={spectrumBarRef}
              role="slider"
              aria-label={lang === 'zh' ? '按颜色浏览彩虹色谱条' : 'Color spectrum slider'}
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={typeof spectrumPick === 'number' ? spectrumPick : 0}
              tabIndex={0}
              onPointerDown={handleSpectrumPointerDown}
              onPointerMove={handleSpectrumPointerMove}
              className="relative h-8 md:h-9 w-full rounded-xl overflow-hidden cursor-ew-resize touch-none border border-white/15 shadow-inner select-none"
              style={{
                background:
                  'linear-gradient(90deg, #111216 0%, #7d828a 6.5%, #eef0f3 12.6%, #ff2a2a 13%, #ff8c00 26%, #ffe600 39%, #22dd44 52%, #00d4ff 65%, #2b55ff 78%, #9b30ff 90%, #ff2a9d 100%)',
              }}
            >
              {/* 黑白灰与彩色分界微线 */}
              <div className="absolute top-0 bottom-0 left-[13%] w-px bg-black/50 pointer-events-none" />
              {spectrumPick !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.65),0_4px_12px_rgba(0,0,0,0.6)] pointer-events-none"
                  style={{
                    left: `${(spectrumPos * 100).toFixed(1)}%`,
                    backgroundColor:
                      spectrumPick === 'neutral'
                        ? '#8d95a0'
                        : `hsl(${spectrumPick} 90% 55%)`,
                  }}
                />
              )}
            </div>
          </div>

          {/* 七大高定色系家族快捷胶囊 */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {HUE_GROUPS.map((group) => {
              const active = spectrumPick === null && hueGroup === group.key;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => {
                    setSpectrumPick(null);
                    setHueGroup(group.key);
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all',
                    active
                      ? 'bg-white/12 border-[#C9A86A] text-[#F7F3EB]'
                      : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white/90 hover:border-white/25',
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/30 flex-shrink-0"
                    style={{ backgroundColor: group.dotColor }}
                  />
                  <span>{lang === 'zh' ? group.label : group.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 暗金高定材质卡画廊 */}
        <div className="flex-1 overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6">
          {filteredSwatches.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-white/50 text-sm">
              <Sparkles className="w-6 h-6 mb-2 text-[#C9A86A]/70" />
              <p>{lang === 'zh' ? '当前筛选下暂无匹配色号' : 'No matching colors found'}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFinishFilter('all');
                  setHueGroup('all');
                  setSpectrumPick(null);
                }}
                className="mt-3 px-4 py-1.5 rounded-full border border-[#C9A86A]/40 text-xs text-[#C9A86A] hover:bg-[#C9A86A]/10"
              >
                {lang === 'zh' ? '重置筛选条件' : 'Reset filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredSwatches.map((swatch) => {
                const selected = swatch.code === activeSwatch.code;
                const shiftTone = swatch.shiftHex || swatch.hex;
                const orb = getSwatchOrbVisual(swatch, 'drawer');
                return (
                  <button
                    key={swatch.code}
                    type="button"
                    onClick={() => {
                      onSelectSwatch(swatch);
                      onClose();
                    }}
                    className={cn(
                      'group text-left rounded-2xl p-2.5 transition-all border bg-[#111319] hover:bg-[#161922]',
                      selected
                        ? 'border-[#C9A86A] ring-1 ring-[#C9A86A]/50 shadow-[0_0_24px_rgba(201,168,106,0.16)]'
                        : 'border-white/10 hover:border-[#C9A86A]/45',
                    )}
                  >
                    {/* 暗黑影棚壁龛 + 立体流光漆面圆穹 */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-[#07080b] via-[#0e1016] to-[#141720] border border-white/[0.06] flex items-center justify-center">
                      {/* 顶部微弱环境光晕 */}
                      <div
                        className="absolute inset-0 opacity-20 blur-xl pointer-events-none transition-opacity group-hover:opacity-35"
                        style={{
                          background: `radial-gradient(circle at 50% 45%, ${shiftTone}, transparent 72%)`,
                        }}
                      />

                      {/* 立体双曲流光漆面圆穹 */}
                      <div
                        className="relative w-16 h-16 md:w-[74px] md:h-[74px] rounded-full overflow-hidden shadow-[0_10px_24px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                        style={orb.style}
                      >
                        {/* 按工艺呈现对应高光：超哑无亮斑、丝缎柔光、碳纤半光、高光锐利灯带 */}
                        {orb.specular !== 'none' && (
                          <div
                            className={cn(
                              'absolute rounded-full -rotate-[25deg] pointer-events-none',
                              orb.specular === 'satin'
                                ? 'top-2 left-2.5 w-9 h-4 bg-white/24 blur-[4px]'
                                : orb.specular === 'carbon'
                                  ? 'top-2 left-3 w-7 h-2.5 bg-white/32 blur-[1.5px]'
                                  : 'top-2 left-3 w-7 h-2.5 bg-white/55 blur-[1px]',
                            )}
                          />
                        )}
                        <div className="absolute inset-0 rounded-full border border-white/15 pointer-events-none" />
                      </div>

                      {/* 编号角标 */}
                      <span className="absolute top-2 left-2.5 text-[10px] font-mono tracking-wider text-[#C9A86A]">
                        {swatch.code}
                      </span>

                      {swatch.isNew && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#C9A86A]/20 border border-[#C9A86A]/45 text-[9px] font-semibold text-[#E5C992]">
                          NEW
                        </span>
                      )}

                      {selected && (
                        <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-[#C9A86A] text-[#090A0D] flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[2.6]" />
                        </span>
                      )}
                    </div>

                    {/* 底部铭牌文字区 */}
                    <div className="pt-2.5 px-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#F7F3EB] truncate">
                          {lang === 'zh' ? swatch.name : swatch.nameEn}
                        </span>
                        <span className="text-[10px] text-white/45 whitespace-nowrap">
                          {lang === 'zh' ? swatch.finishLabel : swatch.finishLabelEn}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/40 truncate mt-0.5 font-mono">
                        {lang === 'zh' ? swatch.nameEn : swatch.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
