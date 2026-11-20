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
  const coat = carbon ? 'c' : roughness >= 0.4 ? 'm' : roughness >= 0.24 ? 's' : 'g';

  const lightLift = coat === 'm' ? 0.08 : metal ? 0.16 : 0.12;
  const midShade = coat === 'm' ? -0.06 : metal ? -0.14 : -0.08;
  const darkShade = coat === 'm' ? -0.18 : metal ? -0.34 : -0.24;

  const variables: PaintVariables = {
    '--_c0': shadePure(base, lightLift),
    '--_c1': base,
    '--_c2': shadePure(base, midShade),
    '--_c3': shadePure(base, darkShade),
    '--_c4': swatch.shiftHex || shadePure(base, 0.22),
    '--_c5': shift ? 0.42 : pearl ? 0.24 : 0,
    '--_c6':
      coat === 'm' ? 0.22 : coat === 's' ? 0.46 : carbon ? 0.4 : metal ? 0.72 : 0.85,
  };

  if (carbon) {
    variables['--_cp'] = `url("/color-studio/paint/${swatch.code.toLowerCase()}.webp")`;
  }

  return (
    <span
      aria-hidden="true"
      className="_hfm"
      data-k={coat}
      data-g={metal ? '1' : pearl || shift ? '2' : undefined}
      data-l={lightingPreset}
      style={variables}
    >
      <span className="_hfm_r" />
    </span>
  );
});
