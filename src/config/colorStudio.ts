// ============================================================
// 和膜 HAMOREY — 2026 官方电子色卡 3D 高定选色工坊配置库（全系 103 色）
// 色表本体经流式混淆存储于 colorStudioVault.ts，运行期按授权域名还原
// ============================================================

import { STUDIO_VAULT_CHUNKS } from './colorStudioVault';
import { decodeSwatchVault } from '../components/color-studio/studioGuard';

export type FilmFinishType =
  | 'crystal'
  | 'metallic'
  | 'pearlescent'
  | 'chameleon'
  | 'special';

export type StudioViewMode = 'swatch' | 'car' | 'closeup' | 'macro' | 'sphere';

export type StudioLightingPreset = 'studio' | 'gallery' | 'sunset';

export type StudioVehicleId = 'model3' | 'modely';

export interface StudioVehicleOption {
  id: StudioVehicleId;
  name: string;
  shortName: string;
  nameEn: string;
  subtitle: string;
  subtitleEn: string;
  modelUrl: string;
  targetLength: number;
  rotationY: number;
}

export const STUDIO_VEHICLES: StudioVehicleOption[] = [
  {
    id: 'model3',
    name: 'Model 3 焕新版',
    shortName: 'Model 3',
    nameEn: 'Model 3 Highland',
    subtitle: '轿跑流线车身',
    subtitleEn: 'Sport Sedan',
    modelUrl: '/models/m3-atelier.hmy?v=20261120',
    targetLength: 4.15,
    rotationY: 0,
  },
  {
    id: 'modely',
    name: 'Model Y 焕新版',
    shortName: 'Model Y',
    nameEn: 'Model Y Juniper',
    subtitle: 'SUV 宽体曲面',
    subtitleEn: 'SUV Fastback',
    modelUrl: '/models/my-atelier.hmy?v=20261120',
    targetLength: 4.25,
    rotationY: Math.PI,
  },
];

export type ColorHueGroup =
  | 'all'
  | 'neutral'
  | 'red'
  | 'gold'
  | 'green'
  | 'blue'
  | 'purple';

export interface FilmMaterialParams {
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  flakeIntensity: number;
  iridescence: number;
  iridescenceIOR: number;
  sheenIntensity: number;
}

export interface FilmOpticsMetrics {
  gloss: number;
  metallic: number;
  shift: number;
}

export interface ColorFilmItem {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  finish: FilmFinishType;
  finishLabel: string;
  finishLabelEn: string;
  seriesName: string;
  seriesNameEn: string;
  hex: string;
  shiftHex?: string;
  hue: number;
  hueGroup: Exclude<ColorHueGroup, 'all'>;
  isNeutral: boolean;
  isNew?: boolean;
  tagline: string;
  taglineEn: string;
  optics: FilmOpticsMetrics;
  material: FilmMaterialParams;
}

export const HECAI_SPEC = {
  modelName: '和彩 QCCY',
  modelNameEn: 'HAMOREY HECAI QCCY',
  substrate: '脂肪族光学级 TPU',
  substrateEn: 'Aliphatic Optical-Grade TPU',
  thickness: '8.0 mil',
  warrantyYears: 6,
  features: ['划痕热修复', '抗石击防刮蹭', '高耐黄变抗UV', '镜面零橘皮涂层'],
  featuresEn: [
    'Self-Healing Topcoat',
    'Rock Chip Protection',
    'Anti-Yellowing UV Shield',
    'Mirror Zero-Orange-Peel',
  ],
} as const;

export const LIGHTING_PRESETS: Array<{
  key: StudioLightingPreset;
  label: string;
  shortLabel: string;
  labelEn: string;
  shortLabelEn: string;
}> = [
  {
    key: 'studio',
    label: '暗夜柔光',
    shortLabel: '柔光',
    labelEn: 'Soft Atelier',
    shortLabelEn: 'Soft',
  },
  {
    key: 'gallery',
    label: '极昼展厅',
    shortLabel: '展厅',
    labelEn: 'Daylight Gallery',
    shortLabelEn: 'Gallery',
  },
  {
    key: 'sunset',
    label: '落日金辉',
    shortLabel: '落日',
    labelEn: 'Golden Sunset',
    shortLabelEn: 'Sunset',
  },
];

export const HUE_GROUPS: Array<{
  key: ColorHueGroup;
  label: string;
  labelEn: string;
  dotColor: string;
}> = [
  { key: 'all', label: '全部色系', labelEn: 'All Hues', dotColor: '#C9A86A' },
  { key: 'neutral', label: '曜石黑白灰', labelEn: 'Neutrals', dotColor: '#8D95A0' },
  { key: 'red', label: '绯红·胭脂', labelEn: 'Crimson', dotColor: '#B8333A' },
  { key: 'gold', label: '流金·竞速黄', labelEn: 'Gold & Yellow', dotColor: '#D4A84F' },
  { key: 'green', label: '翠绿·松石', labelEn: 'Emerald & Mint', dotColor: '#257B63' },
  { key: 'blue', label: '深海·蒂芙尼蓝', labelEn: 'Sapphire & Cyan', dotColor: '#199CAD' },
  { key: 'purple', label: '魅紫·樱粉', labelEn: 'Violet & Rose', dotColor: '#8A5AB8' },
];

export const FINISH_FILTERS: Array<{
  key: 'all' | FilmFinishType;
  label: string;
  labelEn: string;
}> = [
  { key: 'all', label: '全部工艺', labelEn: 'All' },
  { key: 'crystal', label: '水晶系列', labelEn: 'Crystal' },
  { key: 'metallic', label: '金属系列', labelEn: 'Metallic' },
  { key: 'pearlescent', label: '珠光系列', labelEn: 'Pearly' },
  { key: 'chameleon', label: '双色·变色龙', labelEn: 'Chameleon' },
  { key: 'special', label: '镭射·炫彩·锻碳', labelEn: 'Special' },
];

export const COLOR_STUDIO_SWATCHES: ColorFilmItem[] = decodeSwatchVault(STUDIO_VAULT_CHUNKS);

export function findColorSwatchByCode(code?: string | null): ColorFilmItem {
  if (!code) return COLOR_STUDIO_SWATCHES[2] ?? COLOR_STUDIO_SWATCHES[0];
  const normalized = code.trim().toUpperCase();
  return (
    COLOR_STUDIO_SWATCHES.find((item) => item.code.toUpperCase() === normalized) ||
    COLOR_STUDIO_SWATCHES[2] ||
    COLOR_STUDIO_SWATCHES[0]
  );
}

export function matchesHueGroup(
  item: ColorFilmItem,
  hueGroup: ColorHueGroup,
): boolean {
  if (hueGroup === 'all') return true;
  return item.hueGroup === hueGroup;
}
