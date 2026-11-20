// ============================================================
// 和膜 HAMOREY — 定制选色单与参数详情弹窗 V2（曜石黑 × 香槟金）
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, MapPin, ShieldCheck, Sparkles, X } from 'lucide-react';
import { HECAI_SPEC, type ColorFilmItem } from '../../config/colorStudio';

export interface ColorCardModalProps {
  open: boolean;
  swatch: ColorFilmItem;
  lang: 'zh' | 'en';
  isEmbed?: boolean;
  onClose: () => void;
}

function generateSwatchPosterPng(swatch: ColorFilmItem): string | null {
  const w = 900;
  const h = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#090a0e');
  bgGrad.addColorStop(0.55, '#0e1016');
  bgGrad.addColorStop(1, '#1a0a0d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const barGrad = ctx.createLinearGradient(0, 0, w, 0);
  barGrad.addColorStop(0, '#5C1A1A');
  barGrad.addColorStop(0.5, '#C9A86A');
  barGrad.addColorStop(1, '#5C1A1A');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, w, 8);

  ctx.fillStyle = '#F7F3EB';
  ctx.font = 'bold 38px "HarmonyOS Sans SC", "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('和膜 HAMOREY', 64, 86);

  ctx.fillStyle = '#C9A86A';
  ctx.font = '600 18px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('ATELIER COLOR STUDIO · 定制电子选色卡', 64, 124);

  ctx.strokeStyle = 'rgba(201, 168, 106, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(w - 224, 56, 160, 50, 25);
  ctx.stroke();
  ctx.fillStyle = '#E5C992';
  ctx.font = 'bold 24px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(swatch.code, w - 144, 89);

  // 主流光质感展示块
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(64, 176, w - 128, 490, 28);
  ctx.clip();

  const filmGrad = ctx.createRadialGradient(
    w * 0.35,
    310,
    40,
    w * 0.5,
    430,
    460,
  );
  filmGrad.addColorStop(0, swatch.shiftHex || swatch.hex);
  filmGrad.addColorStop(0.55, swatch.hex);
  filmGrad.addColorStop(1, '#08090c');
  ctx.fillStyle = filmGrad;
  ctx.fillRect(64, 176, w - 128, 490);

  const sheen = ctx.createLinearGradient(120, 176, 680, 620);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0.26)');
  sheen.addColorStop(0.52, 'rgba(255,255,255,0.06)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = sheen;
  ctx.fillRect(64, 176, w - 128, 490);

  ctx.fillStyle = 'rgba(9, 10, 14, 0.72)';
  ctx.fillRect(64, 594, w - 128, 72);
  ctx.fillStyle = '#F7F3EB';
  ctx.textAlign = 'left';
  ctx.font = '600 24px "HarmonyOS Sans SC", sans-serif';
  ctx.fillText(`${swatch.seriesName} · ${swatch.finishLabel}`, 96, 639);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#C9A86A';
  ctx.font = '500 22px ui-monospace, monospace';
  ctx.fillText(swatch.hex.toUpperCase(), w - 96, 639);
  ctx.restore();

  ctx.strokeStyle = 'rgba(201, 168, 106, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(64, 176, w - 128, 490, 28);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#F7F3EB';
  ctx.font = 'bold 58px "HarmonyOS Sans SC", "PingFang SC", sans-serif';
  ctx.fillText(swatch.name, 64, 756);

  ctx.fillStyle = 'rgba(247, 243, 235, 0.55)';
  ctx.font = '500 26px system-ui, sans-serif';
  ctx.fillText(swatch.nameEn, 64, 804);

  ctx.fillStyle = 'rgba(247, 243, 235, 0.78)';
  ctx.font = '400 24px "HarmonyOS Sans SC", sans-serif';
  ctx.fillText(swatch.tagline, 64, 862, w - 128);

  const specs = [
    { k: '产品型号', v: HECAI_SPEC.modelName },
    { k: '基材膜厚', v: `${HECAI_SPEC.thickness} TPU` },
    { k: '表面工艺', v: swatch.finishLabel },
    { k: '官方电子质保', v: `${HECAI_SPEC.warrantyYears} 年质保` },
  ];

  const cardW = (w - 128 - 24) / 2;
  specs.forEach((s, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 64 + col * (cardW + 24);
    const y = 906 + row * 94;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, 78, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(201, 168, 106, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(247, 243, 235, 0.48)';
    ctx.font = '400 20px "HarmonyOS Sans SC", sans-serif';
    ctx.fillText(s.k, x + 22, y + 30);

    ctx.fillStyle = '#F7F3EB';
    ctx.font = 'bold 24px "HarmonyOS Sans SC", sans-serif';
    ctx.fillText(s.v, x + 22, y + 62);
  });

  ctx.fillStyle = 'rgba(247, 243, 235, 0.45)';
  ctx.font = '400 20px "HarmonyOS Sans SC", sans-serif';
  ctx.fillText('屏幕显示仅供参考，欢迎前往和膜授权门店对比实物色板施工', 64, 1126);

  ctx.fillStyle = '#C9A86A';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('hemoppf.cn/color-studio', 64, 1162);

  return canvas.toDataURL('image/png');
}

export function ColorCardModal({
  open,
  swatch,
  lang,
  isEmbed = false,
  onClose,
}: ColorCardModalProps) {
  const [saved, setSaved] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  if (!open) return null;

  const handleCloseAll = () => {
    setPosterUrl(null);
    onClose();
  };

  const handleSavePoster = () => {
    const dataUrl = generateSwatchPosterPng(swatch);
    if (!dataUrl) return;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobileOrWeChat =
      isEmbed ||
      /MicroMessenger|miniProgram|iPhone|iPad|iPod|Android/i.test(ua) ||
      (typeof window !== 'undefined' && window.innerWidth < 768);

    // 微信 <web-view> 与移动端浏览器普遍拦截 dataURL <a download>，直接弹出可长按保存的高清大图
    if (isMobileOrWeChat) {
      setPosterUrl(dataUrl);
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `HAMOREY-${swatch.code}-${swatch.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleConfirmInMiniProgram = () => {
    const w = window as Window & {
      wx?: {
        miniProgram?: {
          postMessage?: (msg: { data: Record<string, string> }) => void;
          navigateTo?: (opts: { url: string }) => void;
        };
      };
    };
    w.wx?.miniProgram?.postMessage?.({
      data: {
        type: 'HAMOREY_COLOR_SELECTED',
        code: swatch.code,
        name: swatch.name,
        hex: swatch.hex,
      },
    });
    handleCloseAll();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/88 p-0 md:p-4 animate-fade-in"
      onClick={handleCloseAll}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'zh' ? '定制选色单' : 'Bespoke Color Specification'}
        className="w-full max-w-lg max-h-[88dvh] flex flex-col rounded-t-3xl md:rounded-2xl bg-[#0c0d12] border border-[#C9A86A]/30 text-[#F7F3EB] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {posterUrl ? (
          <div className="flex flex-col flex-1 min-h-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#E5C992]">
                {lang === 'zh' ? '长按下方选色卡保存至手机相册或转发好友' : 'Long-press image to save or share'}
              </span>
              <button
                type="button"
                onClick={() => setPosterUrl(null)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs text-[#F7F3EB]"
              >
                {lang === 'zh' ? '返回详情' : 'Back'}
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-black/40 rounded-2xl p-2 border border-white/10">
              <img
                src={posterUrl}
                alt={`${swatch.code} ${swatch.name}`}
                data-allow-save="true"
                className="max-h-[64dvh] w-auto rounded-xl shadow-2xl select-auto pointer-events-auto"
              />
            </div>
          </div>
        ) : (
          <>
            {/* 顶部流光质感头图 */}
            <div
              className="relative h-32 sm:h-36 p-4 sm:p-5 flex flex-col justify-between overflow-hidden flex-shrink-0"
              style={{
                background: swatch.shiftHex
                  ? `radial-gradient(circle at 28% 25%, ${swatch.shiftHex} 0%, ${swatch.hex} 65%, #07080b 100%)`
                  : `radial-gradient(circle at 28% 25%, ${swatch.hex} 0%, #07080b 100%)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-black/25 to-transparent" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/75 border border-[#C9A86A]/40 text-[11px] font-mono text-[#E5C992]">
                  {swatch.code} · {lang === 'zh' ? swatch.finishLabel : swatch.finishLabelEn}
                </span>
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 border border-white/15 text-white flex items-center justify-center transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F7F3EB] drop-shadow">
                  {lang === 'zh' ? swatch.name : swatch.nameEn}
                </h3>
                <p className="text-xs text-white/65 mt-0.5 font-mono truncate">
                  {lang === 'zh' ? swatch.nameEn : swatch.name}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3.5 overflow-y-auto">
              <p className="text-sm text-white/75 leading-relaxed">
                {lang === 'zh' ? swatch.tagline : swatch.taglineEn}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="text-[11px] text-white/45">
                    {lang === 'zh' ? '所属产品型号' : 'Product Model'}
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {lang === 'zh' ? HECAI_SPEC.modelName : HECAI_SPEC.modelNameEn}
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="text-[11px] text-white/45">
                    {lang === 'zh' ? '基材与膜厚' : 'Substrate & Thickness'}
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {HECAI_SPEC.thickness} · {lang === 'zh' ? '脂肪族 TPU' : 'Aliphatic TPU'}
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="text-[11px] text-white/45">
                    {lang === 'zh' ? '表面工艺' : 'Surface Finish'}
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {lang === 'zh' ? swatch.finishLabel : swatch.finishLabelEn}
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-[#C9A86A]/25 p-3">
                  <div className="text-[11px] text-white/45">
                    {lang === 'zh' ? '官方电子质保' : 'E-Warranty'}
                  </div>
                  <div className="text-sm font-semibold mt-0.5 flex items-center gap-1 text-[#E5C992]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {lang === 'zh' ? `${HECAI_SPEC.warrantyYears} 年质保` : `${HECAI_SPEC.warrantyYears} Years`}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(lang === 'zh' ? HECAI_SPEC.features : HECAI_SPEC.featuresEn).map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/80"
                  >
                    <Sparkles className="w-3 h-3 text-[#C9A86A]" />
                    {feat}
                  </span>
                ))}
              </div>

              <p className="text-xs text-white/45 leading-relaxed">
                {lang === 'zh'
                  ? '注：屏幕显示仅供参考，建议前往附近和膜授权门店在自然光下对比实物样板后施工。'
                  : 'Note: Screen calibration varies. Inspect physical swatches in daylight at an authorized HAMOREY studio.'}
              </p>

              <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSavePoster}
                  className="flex-1 h-11 rounded-xl bg-[#C9A86A] text-[#090A0D] hover:bg-[#d8b87a] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {saved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  {saved
                    ? lang === 'zh'
                      ? '已下载高清选色单'
                      : 'Color Card Saved'
                    : lang === 'zh'
                      ? '生成选色卡图片'
                      : 'Save Color Card'}
                </button>

                {isEmbed ? (
                  <button
                    type="button"
                    onClick={handleConfirmInMiniProgram}
                    className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    {lang === 'zh' ? '选定此色号' : 'Select This Shade'}
                  </button>
                ) : (
                  <Link
                    to="/stores"
                    className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    {lang === 'zh' ? '查找授权门店看实膜' : 'Find Authorized Stores'}
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
