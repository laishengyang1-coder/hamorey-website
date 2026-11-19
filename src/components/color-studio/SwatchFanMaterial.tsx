import { memo, type CSSProperties } from 'react';
import type { ColorFilmItem, StudioLightingPreset } from '../../config/colorStudio';
import { fanFinishes } from './fanFinishes';
import './SwatchFanMaterial.css';

interface SwatchFanMaterialProps {
  swatch: ColorFilmItem;
  lightingPreset: StudioLightingPreset;
}

type PaintVariables = CSSProperties & Record<`--paint-${string}`, string | number>;

function mixHex(a: string, b: string, amount: number) {
  const channel = (offset: number) => {
    const first = parseInt(a.slice(offset, offset + 2), 16);
    const last = parseInt(b.slice(offset, offset + 2), 16);
    return Math.round(first + (last - first) * amount).toString(16).padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

export const SwatchFanMaterial = memo(function SwatchFanMaterial({
  swatch, lightingPreset,
}: SwatchFanMaterialProps) {
  const base = swatch.hex;
  const black = swatch.code === 'TPU-002S' || swatch.code === 'TPU-035S';
  const texture = fanFinishes[swatch.code];
  // Piano Black's printed tonal strip duplicates Swan White. The original film
  // photograph and the catalog pigment both show the black finish.
  const tones = black || !texture ? [base, base, base, base] : texture.stops;
  const carbon = swatch.code.endsWith('FP') || swatch.code === 'TPU-CF';
  const metal = swatch.finish === 'metallic' || swatch.code.endsWith('A');
  const pearl = swatch.finish === 'pearlescent';
  const shift = swatch.finish === 'chameleon' || (swatch.finish === 'special' && !metal && !carbon);
  const roughness = swatch.material.roughness;
  const coat = carbon ? 'carbon' : roughness >= .4 ? 'matte' : roughness >= .24 ? 'satin' : 'gloss';
  const deep = mixHex(base, tones[3], metal ? .46 : .67);
  const variables: PaintVariables = {
    '--paint-light': mixHex(base, tones[0], metal ? .37 : .49),
    '--paint-base': mixHex(base, tones[1], metal ? .12 : .20),
    '--paint-mid': mixHex(base, tones[2], metal ? .26 : .45),
    '--paint-dark': mixHex(deep, '#04070a', black ? .26 : .18),
    '--paint-shift': mixHex(swatch.shiftHex || base, tones[0], shift ? .56 : .30),
    '--paint-flop': shift ? .47 : pearl ? .27 : 0,
    '--paint-specular': black ? .67 : carbon ? .58 : metal ? .87 : .96,
  };
  if (carbon) variables['--paint-pattern'] = `url("/color-studio/paint/${swatch.code.toLowerCase()}.webp")`;

  return (
    <span aria-hidden="true" className="fan-paint" data-coat={coat}
      data-grain={metal ? 'metal' : pearl || shift ? 'pearl' : undefined}
      data-light={lightingPreset} style={variables}>
      <span className="fan-paint__pigment" />
      <span className="fan-paint__reflection" />
    </span>
  );
});
