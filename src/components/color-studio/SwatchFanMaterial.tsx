import { memo, type CSSProperties } from 'react';
import type { ColorFilmItem, StudioLightingPreset } from '../../config/colorStudio';
import './SwatchFanMaterial.css';

interface SwatchFanMaterialProps {
  swatch: ColorFilmItem;
  lightingPreset: StudioLightingPreset;
}

type PaintVariables = CSSProperties & Record<`--paint-${string}`, string | number>;

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

/**
 * 纯净亮度调整：严格保持原色相与饱和度，不混入任何外部杂色。
 * amount > 0 柔和提亮（高光面），amount < 0 柔和压暗（暗部曲面）。
 */
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

export const SwatchFanMaterial = memo(function SwatchFanMaterial({
  swatch,
  lightingPreset,
}: SwatchFanMaterialProps) {
  const base = swatch.hex;
  const carbon = swatch.code.endsWith('FP') || swatch.code === 'TPU-CF';
  const metal = swatch.finish === 'metallic' || swatch.code.endsWith('A');
  const pearl = swatch.finish === 'pearlescent';
  const shift = swatch.finish === 'chameleon' || (swatch.finish === 'special' && !metal && !carbon);
  const roughness = swatch.material.roughness;
  const coat = carbon ? 'carbon' : roughness >= 0.4 ? 'matte' : roughness >= 0.24 ? 'satin' : 'gloss';

  // 纯净单色色阶：水晶最纯净，金属暗部随角压深（flop），哑光反差更柔和
  const lightLift = coat === 'matte' ? 0.08 : metal ? 0.16 : 0.12;
  const midShade = coat === 'matte' ? -0.06 : metal ? -0.14 : -0.08;
  const darkShade = coat === 'matte' ? -0.18 : metal ? -0.34 : -0.24;

  const variables: PaintVariables = {
    '--paint-light': shadePure(base, lightLift),
    '--paint-base': base,
    '--paint-mid': shadePure(base, midShade),
    '--paint-dark': shadePure(base, darkShade),
    '--paint-shift': swatch.shiftHex || shadePure(base, 0.22),
    '--paint-flop': shift ? 0.42 : pearl ? 0.24 : 0,
    '--paint-specular':
      coat === 'matte' ? 0.22 : coat === 'satin' ? 0.46 : carbon ? 0.4 : metal ? 0.72 : 0.85,
  };

  if (carbon) {
    variables['--paint-pattern'] = `url("/color-studio/paint/${swatch.code.toLowerCase()}.webp")`;
  }

  return (
    <span
      aria-hidden="true"
      className="fan-paint"
      data-coat={coat}
      data-grain={metal ? 'metal' : pearl || shift ? 'pearl' : undefined}
      data-light={lightingPreset}
      style={variables}
    >
      <span className="fan-paint__reflection" />
    </span>
  );
});
