// ============================================================
// 和膜 HAMOREY — 色珠 / 色谱圆穹 / 选色卡头图工艺材质共享工具
// 统一呈现：锻碳 / 幽冥黑波纹碳 / 编织碳纤维 / 七彩镭射 / 超哑 / 丝缎 / 高光
// ============================================================

import type { CSSProperties } from 'react';
import type { ColorFilmItem } from '../../config/colorStudio';

export function isCarbonSwatch(code: string): boolean {
  return code === 'TPU-001FP' || code === 'TPU-002FP' || code === 'TPU-CF';
}

export function isLaserSwatch(code: string): boolean {
  return code === 'TPU-001L' || code === 'TPU-002L';
}

// 2×2 斜纹编织碳纤维无损矢量底纹（在小尺寸色珠与画廊圆穹上也能清晰辨识编织网格）
const CARBON_TWILL_SVG =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23111317'/%3E%3Cg opacity='0.96'%3E%3Crect x='0' y='0' width='8' height='4' fill='%232e333c'/%3E%3Crect x='0' y='1' width='8' height='1.6' fill='%234b5260'/%3E%3Crect x='4' y='4' width='8' height='4' fill='%232e333c'/%3E%3Crect x='4' y='5' width='8' height='1.6' fill='%234b5260'/%3E%3Crect x='8' y='8' width='8' height='4' fill='%232e333c'/%3E%3Crect x='8' y='9' width='8' height='1.6' fill='%234b5260'/%3E%3Crect x='12' y='12' width='4' height='4' fill='%232e333c'/%3E%3Crect x='0' y='12' width='4' height='4' fill='%232e333c'/%3E%3Crect x='12' y='13' width='4' height='1.6' fill='%234b5260'/%3E%3Crect x='0' y='13' width='4' height='1.6' fill='%234b5260'/%3E%3Crect x='8' y='0' width='4' height='8' fill='%231b1e24'/%3E%3Crect x='9' y='0' width='1.4' height='8' fill='%232c313a'/%3E%3Crect x='12' y='4' width='4' height='8' fill='%231b1e24'/%3E%3Crect x='13' y='4' width='1.4' height='8' fill='%232c313a'/%3E%3Crect x='0' y='8' width='4' height='8' fill='%231b1e24'/%3E%3Crect x='1' y='8' width='1.4' height='8' fill='%232c313a'/%3E%3Crect x='4' y='12' width='4' height='4' fill='%231b1e24'/%3E%3Crect x='4' y='0' width='4' height='4' fill='%231b1e24'/%3E%3C/g%3E%3C/svg%3E")`;

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
      'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.03) 34%, rgba(0,0,0,0.26) 68%, rgba(0,0,0,0.82) 100%)';
    const boxShadow = isDrawer
      ? 'inset -6px -8px 16px rgba(0,0,0,0.72), inset 3px 4px 10px rgba(255,255,255,0.16), 0 10px 24px rgba(0,0,0,0.8)'
      : 'inset -3px -4px 8px rgba(0,0,0,0.72), 0 4px 10px rgba(0,0,0,0.55)';

    if (code === 'TPU-CF') {
      // 碳纤维(黑)：清晰斜纹编织碳纤维
      const tile = isDrawer ? '14px 14px' : '9px 9px';
      return {
        style: {
          backgroundColor: '#121418',
          backgroundImage: `${domeShade}, ${CARBON_TWILL_SVG}`,
          backgroundSize: `100% 100%, ${tile}`,
          backgroundRepeat: 'no-repeat, repeat',
          boxShadow,
        },
        specular: 'carbon',
      };
    }

    // 幽冥黑 (TPU-001FP 流纹大马士革锻碳) & 黑锻碳 (TPU-002FP 碎切锻造碳)
    const texUrl = `url("/color-studio/paint/${code.toLowerCase()}.webp")`;
    const isDamascus = code === 'TPU-001FP';
    return {
      style: {
        backgroundColor: '#121418',
        backgroundImage: `${domeShade}, ${texUrl}`,
        backgroundSize: isDrawer
          ? isDamascus
            ? '100% 100%, 175% auto'
            : '100% 100%, 190% auto'
          : isDamascus
            ? '100% 100%, 240% auto'
            : '100% 100%, 260% auto',
        backgroundPosition: isDamascus ? 'center, 58% 34%' : 'center, 44% 26%',
        backgroundRepeat: 'no-repeat, no-repeat',
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
    if (code === 'TPU-CF') {
      return {
        backgroundColor: '#121418',
        backgroundImage: `linear-gradient(155deg, rgba(255,255,255,0.12), rgba(0,0,0,0.5)), ${CARBON_TWILL_SVG}`,
        backgroundSize: '100% 100%, 20px 20px',
      };
    }
    return {
      backgroundColor: '#121418',
      backgroundImage: `linear-gradient(155deg, rgba(255,255,255,0.12), rgba(0,0,0,0.52)), url("/color-studio/paint/${code.toLowerCase()}.webp")`,
      backgroundSize: '100% 100%, cover',
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
