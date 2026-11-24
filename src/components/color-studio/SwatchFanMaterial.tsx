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
  const volcanic = code === 'TPU-001B';
  const dawn = code === 'TPU-021P';
  const armor = code === 'TPU-001G';
  const diamond = code === 'TPU-002G' || code === 'TPU-003G';
  const bicolor =
    code === 'TPU-002B' ||
    code === 'TPU-001C' ||
    diamond;
  const chameleon =
    swatch.finish === 'chameleon' && !bicolor && !volcanic;
  const metal =
    swatch.finish === 'metallic' || code.endsWith('A');
  const pearl = swatch.finish === 'pearlescent' && !dawn;

  // 表面光学光泽分层：c=锻碳/碳纤, m=超哑/哑光, s=丝缎, g=高光清漆
  const coat: 'c' | 'm' | 's' | 'g' = carbon
    ? 'c'
    : roughness >= 0.44
      ? 'm'
      : roughness >= 0.24
        ? 's'
        : 'g';

  // 颜料光学效应分层
  const effect:
    | 'laser'
    | 'volcanic'
    | 'dawn'
    | 'armor'
    | 'chameleon'
    | 'bicolor'
    | 'metal'
    | 'pearl'
    | 'solid' = laser
    ? 'laser'
    : volcanic
      ? 'volcanic'
      : dawn
        ? 'dawn'
        : armor
          ? 'armor'
          : chameleon
            ? 'chameleon'
            : bicolor
              ? 'bicolor'
              : metal
                ? 'metal'
                : pearl
                  ? 'pearl'
                  : 'solid';

  const lum = relativeLuminance(base);
  const isLightBase = lum > 0.68;
  const isPureWhiteCrystal = lum > 0.84 && effect === 'solid' && coat === 'g';
  const isLightMetal = metal && lum > 0.44 && coat === 'g';
  const isDualToneMetal = code === 'TPU-001M' || code === 'TPU-002M';

  // 各工艺专属随角明暗曲线（高白水晶保持纯净瓷白不发灰，浅香槟金属温润通透，深金属强 flop 反差）
  const lightLift =
    coat === 'm'
      ? 0.035
      : coat === 's'
        ? 0.095
        : isPureWhiteCrystal
          ? 0.14
          : metal
            ? 0.24
            : pearl || bicolor || armor
              ? 0.14
              : 0.13;
  const midShade =
    coat === 'm'
      ? -0.03
      : coat === 's'
        ? -0.1
        : isPureWhiteCrystal
          ? -0.038
          : isLightMetal
            ? -0.13
            : metal
              ? -0.22
              : -0.09;
  const darkShade =
    coat === 'm'
      ? -0.09
      : coat === 's'
        ? -0.24
        : isPureWhiteCrystal
          ? -0.095
          : isLightMetal
            ? -0.32
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

  // 极光变色龙专属第三光学干涉色（青魔=海蓝紫，青岭苍岚=岚山青蓝，喀纳斯蓝=冰青→海蓝→电光紫）
  const thirdHarmonic =
    code === 'TPU-002C'
      ? '#4B63F6'
      : code === 'TPU-003C'
        ? '#4D82A8'
        : code === 'TPU-005C' || code === 'TPU-006C'
          ? '#1CC4F5'
          : mixHex(shiftHex, '#7e6bff', 0.32);

  // 偏色光晕强度（金属、珠光、双色、变色龙、镭射各有独立物理响应）
  const shiftOpacity =
    laser
      ? isLightBase
        ? 0.56
        : 0.78
      : volcanic
        ? 0.94
        : dawn
          ? 0.62
          : armor
            ? 0.72
            : chameleon
              ? coat === 's'
                ? 0.64
                : 0.78
              : bicolor
                ? isLightBase
                  ? code === 'TPU-002B'
                    ? 0.44
                    : 0.38
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

  // 清漆镜面反光强度（超哑绝不出现塑料亮条，丝缎呈柔宽绸缎光带，锻碳/碳纤呈高亮8.0mil湿润清漆，高光呈锐利玻璃镜面）
  const specOpacity =
    coat === 'm'
      ? 0.11
      : coat === 's'
        ? 0.56
        : carbon
          ? 0.72
          : volcanic || armor || isPureWhiteCrystal
            ? 0.94
            : metal
              ? 0.86
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
    variables['--_cp'] = `url("/color-studio/paint/${code.toLowerCase()}.webp?v=20261123")`;
    variables['--_cs'] =
      code === 'TPU-CF' ? '62px 62px' : code === 'TPU-002FP' ? '132px 132px' : '140px 140px';
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
          : metal || volcanic || armor || diamond
            ? '1'
            : pearl || bicolor || chameleon || laser
              ? '2'
              : undefined
      }
      data-sp={diamond ? '1' : undefined}
      data-l={lightingPreset}
      style={variables}
    >
      <span className="_hfm_r" />
    </span>
  );
});
