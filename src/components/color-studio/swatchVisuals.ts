// ============================================================
// 和膜 HAMOREY — 色珠 / 色谱圆穹 / 选色卡头图工艺材质共享工具
// 统一呈现：锻碳 / 幽冥黑波纹碳 / 编织碳纤维 / 七彩镭射 / 超哑 / 丝缎 / 高光
// ============================================================

import type { CSSProperties } from 'react';
import type { ColorFilmItem } from '../../config/colorStudio';

export const CARBON_TEX_VERSION = '20261123';

export function isCarbonSwatch(code: string): boolean {
  return code === 'TPU-001FP' || code === 'TPU-002FP' || code === 'TPU-CF';
}

export function isLaserSwatch(code: string): boolean {
  return code === 'TPU-001L' || code === 'TPU-002L';
}

export function getCarbonTextureUrl(code: string): string {
  return `/color-studio/paint/${code.toLowerCase()}.webp?v=${CARBON_TEX_VERSION}`;
}

export interface SwatchOrbVisual {
  style: CSSProperties;
  specular: 'none' | 'satin' | 'gloss' | 'carbon';
}

export function getSwatchOrbVisual(
  swatch: ColorFilmItem,
  variant: 'bead' | 'drawer',
): SwatchOrbVisual {
  const { code, hex, shiftHex, material } = swatch;
  const shiftTone = shiftHex || hex;
  const isCarbon = isCarbonSwatch(code);
  const isLaser = isLaserSwatch(code);
  const isMatte = !isCarbon && material.roughness >= 0.44;
  const isSatin = !isCarbon && !isMatte && material.roughness >= 0.24;
  const isDrawer = variant === 'drawer';

  if (isCarbon) {
    const domeShade =
      'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.04) 32%, rgba(0,0,0,0.22) 66%, rgba(0,0,0,0.82) 100%)';
    const boxShadow = isDrawer
      ? 'inset -6px -8px 16px rgba(0,0,0,0.72), inset 3px 4px 10px rgba(255,255,255,0.18), 0 10px 24px rgba(0,0,0,0.8)'
      : 'inset -3px -4px 8px rgba(0,0,0,0.72), 0 4px 10px rgba(0,0,0,0.55)';
    const texUrl = `url("${getCarbonTextureUrl(code)}")`;
    const tile =
      code === 'TPU-CF'
        ? isDrawer
          ? '36px 36px'
          : '20px 20px'
        : code === 'TPU-002FP'
          ? isDrawer
            ? '56px 56px'
            : '34px 34px'
          : isDrawer
            ? '60px 60px'
            : '36px 36px';

    return {
      style: {
        backgroundColor: '#101215',
        backgroundImage: `${domeShade}, ${texUrl}`,
        backgroundSize: `100% 100%, ${tile}`,
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, repeat',
        boxShadow,
      },
      specular: 'carbon',
    };
  }

  if (isLaser) {
    return {
      style: {
        background: `linear-gradient(130deg, ${hex} 12%, rgba(92,232,255,0.76) 36%, rgba(255,116,198,0.76) 56%, rgba(255,218,88,0.76) 74%, ${hex} 92%)`,
        boxShadow: isDrawer
          ? 'inset -6px -8px 16px rgba(0,0,0,0.65), inset 4px 5px 12px rgba(255,255,255,0.22), 0 10px 24px rgba(0,0,0,0.8)'
          : 'inset -3px -4px 8px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.5)',
      },
      specular: 'gloss',
    };
  }

  if (isMatte) {
    return {
      style: {
        background: `radial-gradient(circle at 34% 30%, ${shiftTone} 0%, ${hex} 58%, #090a0d 100%)`,
        boxShadow: isDrawer
          ? 'inset -5px -7px 14px rgba(0,0,0,0.55), 0 10px 22px rgba(0,0,0,0.75)'
          : 'inset -2px -3px 6px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.45)',
      },
      specular: 'none',
    };
  }

  if (isSatin) {
    return {
      style: {
        background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22) 0%, ${shiftTone} 30%, ${hex} 72%, #060709 100%)`,
        boxShadow: isDrawer
          ? 'inset -6px -8px 16px rgba(0,0,0,0.6), inset 3px 4px 10px rgba(255,255,255,0.14), 0 10px 24px rgba(0,0,0,0.78)'
          : 'inset -3px -4px 8px rgba(0,0,0,0.58), 0 4px 10px rgba(0,0,0,0.5)',
      },
      specular: 'satin',
    };
  }

  return {
    style: {
      background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5) 0%, ${shiftTone} 28%, ${hex} 72%, #050608 100%)`,
      boxShadow: isDrawer
        ? 'inset -6px -8px 16px rgba(0,0,0,0.65), inset 4px 5px 12px rgba(255,255,255,0.22), 0 10px 24px rgba(0,0,0,0.8)'
        : 'inset -3px -4px 8px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.5)',
    },
    specular: 'gloss',
  };
}

export function getSwatchBannerStyle(swatch: ColorFilmItem): CSSProperties {
  const { code, hex, shiftHex } = swatch;
  if (isCarbonSwatch(code)) {
    const tile = code === 'TPU-CF' ? '58px 58px' : code === 'TPU-002FP' ? '124px 124px' : '130px 130px';
    return {
      backgroundColor: '#101215',
      backgroundImage: `linear-gradient(155deg, rgba(255,255,255,0.14), rgba(0,0,0,0.5)), url("${getCarbonTextureUrl(code)}")`,
      backgroundSize: `100% 100%, ${tile}`,
      backgroundRepeat: 'no-repeat, repeat',
      backgroundPosition: 'center, center',
    };
  }
  if (isLaserSwatch(code)) {
    return {
      background: `linear-gradient(125deg, ${hex} 8%, rgba(92,232,255,0.65) 34%, rgba(255,116,198,0.65) 54%, rgba(255,218,88,0.65) 72%, ${hex} 94%)`,
    };
  }
  return {
    background: shiftHex
      ? `radial-gradient(circle at 28% 25%, ${shiftHex} 0%, ${hex} 65%, #07080b 100%)`
      : `radial-gradient(circle at 28% 25%, ${hex} 0%, #07080b 100%)`,
  };
}
