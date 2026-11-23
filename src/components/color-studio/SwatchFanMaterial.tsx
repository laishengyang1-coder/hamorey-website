import { memo, type CSSProperties } from 'react';
import type { ColorFilmItem, StudioLightingPreset } from '../../config/colorStudio';
import './SwatchFanMaterial.css';

interface SwatchFanMaterialProps {
  swatch: ColorFilmItem;
  lightingPreset: StudioLightingPreset;
}

type PaintVariables = CSSProperties & Record<`--_${string}`, string | number>;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function shadePure(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex(
      r + (255 - r) * amount,
      g + (255 - g) * amount,
      b + (255 - b) * amount,
    );
  }
  const factor = 1 + amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export const SwatchFanMaterial = memo(function SwatchFanMaterial({
  swatch,
  lightingPreset,
}: SwatchFanMaterialProps) {
  const base = swatch.hex;
  const shiftHex = swatch.shiftHex || shadePure(base, 0.24);
  const code = swatch.code;
  const roughness = swatch.material.roughness;

  const carbon = code.endsWith('FP') || code === 'TPU-CF';
  const laser = code === 'TPU-001L' || code === 'TPU-002L';
  const bicolor =
    code === 'TPU-001B' ||
    code === 'TPU-002B' ||
    code === 'TPU-001C' ||
    code === 'TPU-001G' ||
    code === 'TPU-002G' ||
    code === 'TPU-003G';
  const chameleon =
    swatch.finish === 'chameleon' && !bicolor;
  const metal =
    swatch.finish === 'metallic' || code.endsWith('A');
  const pearl = swatch.finish === 'pearlescent';

  // 表面光学光泽分层：c=锻碳/碳纤, m=超哑/哑光, s=丝缎, g=高光清漆
  const coat: 'c' | 'm' | 's' | 'g' = carbon
    ? 'c'
    : roughness >= 0.44
      ? 'm'
      : roughness >= 0.24
        ? 's'
        : 'g';

  // 颜料光学效应分层：laser=七彩镭射, chameleon=极光变色龙, bicolor=双色/钻白幻彩, metal=液态金属, pearl=云母珠光, solid=水晶单色
  const effect: 'laser' | 'chameleon' | 'bicolor' | 'metal' | 'pearl' | 'solid' = laser
    ? 'laser'
    : chameleon
      ? 'chameleon'
      : bicolor
        ? 'bicolor'
        : metal
          ? 'metal'
          : pearl
            ? 'pearl'
            : 'solid';

  const isLightBase = relativeLuminance(base) > 0.68;
  const isDualToneMetal = code === 'TPU-001M' || code === 'TPU-002M';

  // 各工艺专属随角明暗曲线（金属强 flop 反差，超哑柔和丝绒低反差，水晶通透均衡）
  const lightLift =
    coat === 'm'
      ? 0.035
      : coat === 's'
        ? 0.095
        : metal
          ? 0.24
          : pearl || bicolor
            ? 0.14
            : 0.13;
  const midShade =
    coat === 'm'
      ? -0.03
      : coat === 's'
        ? -0.1
        : metal
          ? -0.22
          : -0.09;
  const darkShade =
    coat === 'm'
      ? -0.1
      : coat === 's'
        ? -0.24
        : metal
          ? -0.48
          : chameleon
            ? -0.36
            : -0.25;

  // 金属漆高光与主色做融合，防止高光发灰；黑曜金/黑金AMG山灰保留深邃黑灰底色，仅在受光脊线绽放金芒
  const c0 =
    metal && coat !== 'm'
      ? mixHex(shadePure(base, lightLift), shiftHex, isDualToneMetal ? 0.18 : 0.4)
      : shadePure(base, lightLift);
  const c2 =
    chameleon
      ? mixHex(shadePure(base, midShade), shiftHex, 0.35)
      : shadePure(base, midShade);
  const c3 = shadePure(base, darkShade);

  // 极光变色龙专属第三光学干涉色（青魔=海蓝紫，青岭苍岚=岚山青蓝，喀纳斯蓝=青蓝紫三色）
  const thirdHarmonic =
    code === 'TPU-002C'
      ? '#4B63F6'
      : code === 'TPU-003C'
        ? '#4D82A8'
        : code === 'TPU-005C' || code === 'TPU-006C'
          ? '#8A5CF6'
          : mixHex(shiftHex, '#7e6bff', 0.32);

  // 偏色光晕强度（金属、珠光、双色、变色龙、镭射各有独立物理响应）
  const shiftOpacity =
    laser
      ? isLightBase
        ? 0.56
        : 0.78
      : chameleon
        ? coat === 's'
          ? 0.64
          : 0.78
        : bicolor
          ? isLightBase
            ? code === 'TPU-002B'
              ? 0.44
              : 0.38
            : code === 'TPU-001B'
              ? 0.68
              : 0.8
          : pearl
            ? coat === 'm'
              ? 0.24
              : isLightBase
                ? 0.32
                : 0.56
            : metal
              ? isDualToneMetal
                ? code === 'TPU-002M'
                  ? 0.5
                  : 0.4
                : coat === 'm'
                  ? 0.12
                  : coat === 's'
                    ? 0.34
                    : 0.46
              : 0;

  // 清漆镜面反光强度（超哑绝不出现塑料亮条，丝缎呈柔宽绸缎光带，高光呈锐利玻璃镜面）
  const specOpacity =
    coat === 'm'
      ? 0.11
      : coat === 's'
        ? 0.56
        : carbon
          ? 0.36
          : metal
            ? 0.84
            : 0.88;

  const variables: PaintVariables = {
    '--_c0': c0,
    '--_c1': base,
    '--_c2': c2,
    '--_c3': c3,
    '--_c4': shiftHex,
    '--_c5': shiftOpacity,
    '--_c6': specOpacity,
    '--_c7': thirdHarmonic,
  };

  if (carbon) {
    variables['--_cp'] = `url("/color-studio/paint/${code.toLowerCase()}.webp")`;
  }

  return (
    <span
      aria-hidden="true"
      className="_hfm"
      data-k={coat}
      data-e={effect}
      data-b={isLightBase ? 'l' : 'd'}
      data-g={
        coat === 'm'
          ? 'm'
          : metal
            ? '1'
            : pearl || bicolor || chameleon || laser
              ? '2'
              : undefined
      }
      data-l={lightingPreset}
      style={variables}
    >
      <span className="_hfm_r" />
    </span>
  );
});
