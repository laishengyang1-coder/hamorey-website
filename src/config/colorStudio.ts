// ============================================================
// 和膜 HAMOREY — 3D 高定选色工坊配置库 V2（首批 20 色）
// 工艺覆盖：水晶单色（8） / 微晶金属（6） / 幻彩珠光（6）
// ============================================================

export type FilmFinishType = 'crystal' | 'metallic' | 'pearlescent';

export type StudioViewMode = 'swatch' | 'car' | 'closeup' | 'macro' | 'sphere';

export type StudioLightingPreset = 'studio' | 'gallery' | 'sunset';

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
  /** 镜面清漆光泽度 (0-100) */
  gloss: number;
  /** 金属微晶密度感 (0-100) */
  metallic: number;
  /** 折光幻彩流动度 (0-100) */
  shift: number;
}

export interface ColorFilmItem {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  finish: FilmFinishType;
  finishLabel: '水晶单色' | '金属' | '珠光';
  finishLabelEn: 'Crystal Gloss' | 'Metallic' | 'Pearlescent';
  seriesName: '和彩·水晶系列' | '和彩·金属系列' | '和彩·珠光系列';
  seriesNameEn: 'Hecai Crystal' | 'Hecai Metallic' | 'Hecai Pearl';
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
    label: '暗夜光廊',
    shortLabel: '暗夜',
    labelEn: 'Dark Atelier',
    shortLabelEn: 'Atelier',
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
  { key: 'red', label: '绯红·胭脂', labelEn: 'Crimson', dotColor: '#8F1D2C' },
  { key: 'gold', label: '流金·竞速黄', labelEn: 'Gold & Yellow', dotColor: '#D4A84F' },
  { key: 'green', label: '翠绿·冰青', labelEn: 'Emerald & Mint', dotColor: '#257B63' },
  { key: 'blue', label: '深海·宝石蓝', labelEn: 'Sapphire', dotColor: '#155C96' },
  { key: 'purple', label: '魅紫·樱粉', labelEn: 'Violet & Rose', dotColor: '#7C4DFF' },
];

export const FINISH_FILTERS: Array<{
  key: 'all' | FilmFinishType;
  label: string;
  labelEn: string;
}> = [
  { key: 'all', label: '全部工艺', labelEn: 'All Finishes' },
  { key: 'crystal', label: '水晶单色', labelEn: 'Crystal Gloss' },
  { key: 'metallic', label: '微晶金属', labelEn: 'Metallic' },
  { key: 'pearlescent', label: '幻彩珠光', labelEn: 'Pearlescent' },
];

const CRYSTAL_MAT: FilmMaterialParams = {
  metalness: 0.05,
  roughness: 0.11,
  clearcoat: 1.0,
  clearcoatRoughness: 0.012,
  flakeIntensity: 0,
  iridescence: 0.02,
  iridescenceIOR: 1.3,
  sheenIntensity: 0,
};

const METALLIC_MAT: FilmMaterialParams = {
  metalness: 0.86,
  roughness: 0.22,
  clearcoat: 1.0,
  clearcoatRoughness: 0.015,
  flakeIntensity: 1.0,
  iridescence: 0.04,
  iridescenceIOR: 1.3,
  sheenIntensity: 0.14,
};

const PEARLESCENT_MAT: FilmMaterialParams = {
  metalness: 0.36,
  roughness: 0.15,
  clearcoat: 1.0,
  clearcoatRoughness: 0.012,
  flakeIntensity: 0.5,
  iridescence: 0.92,
  iridescenceIOR: 1.42,
  sheenIntensity: 0.85,
};

export const COLOR_STUDIO_SWATCHES: ColorFilmItem[] = [
  // === 1. 水晶单色（8 款）===
  {
    id: 'hc-01',
    code: 'HC-01',
    name: '钢琴魅黑',
    nameEn: 'Jet Crystal Black',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#090A0D',
    shiftHex: '#232730',
    hue: 220,
    hueGroup: 'neutral',
    isNeutral: true,
    tagline: '深邃镜面纯黑，极致光影倒映如原厂钢琴烤漆',
    taglineEn: 'Deep obsidian piano-black with crisp mirror reflections',
    optics: { gloss: 99, metallic: 10, shift: 14 },
    material: { ...CRYSTAL_MAT, metalness: 0.08, roughness: 0.07 },
  },
  {
    id: 'hc-02',
    code: 'HC-02',
    name: '冰川纯白',
    nameEn: 'Glacier Pure White',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#EAECEF',
    shiftHex: '#FFFFFF',
    hue: 210,
    hueGroup: 'neutral',
    isNeutral: true,
    tagline: '通透高纯度冷调瓷白，脂肪族 TPU 长久保持净白光泽',
    taglineEn: 'Crisp glacier ceramic white backed by anti-yellowing TPU',
    optics: { gloss: 96, metallic: 5, shift: 12 },
    material: { ...CRYSTAL_MAT, metalness: 0.02, roughness: 0.09 },
  },
  {
    id: 'hc-03',
    code: 'HC-03',
    name: '岩岚水泥灰',
    nameEn: 'Slate Storm Grey',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#596068',
    shiftHex: '#7B838E',
    hue: 212,
    hueGroup: 'neutral',
    isNeutral: true,
    isNew: true,
    tagline: '克制沉稳的赛道水泥灰，清漆高光勾勒凌厉车身腰线',
    taglineEn: 'Motorsport slate grey engineered to sharpen body creases',
    optics: { gloss: 95, metallic: 12, shift: 18 },
    material: { ...CRYSTAL_MAT, roughness: 0.1 },
  },
  {
    id: 'hc-04',
    code: 'HC-04',
    name: '瑚海蒂芙蓝',
    nameEn: 'Coral Reef Cyan',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#0096B4',
    shiftHex: '#2BC7E2',
    hue: 189,
    hueGroup: 'green',
    isNeutral: false,
    isNew: true,
    tagline: '高饱和浅海青蓝，阳光下通透清亮、质感饱满',
    taglineEn: 'Saturated lagoon cyan with liquid mirror clearcoat depth',
    optics: { gloss: 97, metallic: 8, shift: 24 },
    material: { ...CRYSTAL_MAT },
  },
  {
    id: 'hc-05',
    code: 'HC-05',
    name: '勃艮第胭脂红',
    nameEn: 'Burgundy Carmine',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#560E18',
    shiftHex: '#8F1D2C',
    hue: 352,
    hueGroup: 'red',
    isNeutral: false,
    isNew: true,
    tagline: '和膜品牌高定酒红，暗处醇厚深邃、强光泛出透亮绯光',
    taglineEn: 'Signature deep wine burgundy glowing with rich crimson',
    optics: { gloss: 98, metallic: 14, shift: 26 },
    material: { ...CRYSTAL_MAT, metalness: 0.1, roughness: 0.09 },
  },
  {
    id: 'hc-06',
    code: 'HC-06',
    name: '罗平竞速黄',
    nameEn: 'Racing Mimosa Yellow',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#DDA206',
    shiftHex: '#FFD043',
    hue: 45,
    hueGroup: 'gold',
    isNeutral: false,
    tagline: '超跑经典竞速明黄，高饱和零橘皮质感鲜明夺目',
    taglineEn: 'Track-inspired vivid yellow with zero-orange-peel gloss',
    optics: { gloss: 96, metallic: 8, shift: 20 },
    material: { ...CRYSTAL_MAT },
  },
  {
    id: 'hc-07',
    code: 'HC-07',
    name: '英伦墨绿',
    nameEn: 'British Racing Green',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#0D2E22',
    shiftHex: '#1D5E47',
    hue: 158,
    hueGroup: 'green',
    isNeutral: false,
    tagline: '复古深邃的绅士墨绿，光影暗部沉稳高级',
    taglineEn: 'Heritage deep forest green with timeless luxury presence',
    optics: { gloss: 98, metallic: 14, shift: 22 },
    material: { ...CRYSTAL_MAT, metalness: 0.1, roughness: 0.085 },
  },
  {
    id: 'hc-08',
    code: 'HC-08',
    name: '冷翠宝石蓝',
    nameEn: 'Cobalt Sapphire Blue',
    finish: 'crystal',
    finishLabel: '水晶单色',
    finishLabelEn: 'Crystal Gloss',
    seriesName: '和彩·水晶系列',
    seriesNameEn: 'Hecai Crystal',
    hex: '#0A3D6E',
    shiftHex: '#1B6BB3',
    hue: 207,
    hueGroup: 'blue',
    isNeutral: false,
    tagline: '纯粹浓郁的钴蓝宝石色，动静之间散发深海质感',
    taglineEn: 'Saturated cobalt sapphire with deep oceanic brilliance',
    optics: { gloss: 97, metallic: 12, shift: 22 },
    material: { ...CRYSTAL_MAT, metalness: 0.09 },
  },

  // === 2. 微晶金属系列（6 款）===
  {
    id: 'hm-01',
    code: 'HM-01',
    name: '液态金属银',
    nameEn: 'Liquid Titanium Silver',
    finish: 'metallic',
    finishLabel: '金属',
    finishLabelEn: 'Metallic',
    seriesName: '和彩·金属系列',
    seriesNameEn: 'Hecai Metallic',
    hex: '#AEB6C2',
    shiftHex: '#F4F7FB',
    hue: 212,
    hueGroup: 'neutral',
    isNeutral: true,
    isNew: true,
    tagline: '流动感极强的液态钛银，如整块雕琢的精工金属雕塑',
    taglineEn: 'Molten liquid titanium finish that sculpts bodywork lines',
    optics: { gloss: 94, metallic: 98, shift: 48 },
    material: { ...METALLIC_MAT, metalness: 0.92, roughness: 0.15 },
  },
  {
    id: 'hm-02',
    code: 'HM-02',
    name: '星际枪灰',
    nameEn: 'Gunmetal Graphite',
    finish: 'metallic',
    finishLabel: '金属',
    finishLabelEn: 'Metallic',
    seriesName: '和彩·金属系列',
    seriesNameEn: 'Hecai Metallic',
    hex: '#2F343D',
    shiftHex: '#687382',
    hue: 217,
    hueGroup: 'neutral',
    isNeutral: true,
    tagline: '冷峻细腻的枪灰金属漆面，兼具力量感与科技锋芒',
    taglineEn: 'Sharp graphite gunmetal packed with fine metallic flakes',
    optics: { gloss: 92, metallic: 92, shift: 42 },
    material: { ...METALLIC_MAT, metalness: 0.88, roughness: 0.19 },
  },
  {
    id: 'hm-03',
    code: 'HM-03',
    name: '香槟钛金',
    nameEn: 'Champagne Titanium Gold',
    finish: 'metallic',
    finishLabel: '金属',
    finishLabelEn: 'Metallic',
    seriesName: '和彩·金属系列',
    seriesNameEn: 'Hecai Metallic',
    hex: '#B3935E',
    shiftHex: '#F2DDA8',
    hue: 37,
    hueGroup: 'gold',
    isNeutral: false,
    tagline: '低饱和度香槟金属金，优雅克制的定制礼服质感',
    taglineEn: 'Understated warm titanium gold with tailored shimmer',
    optics: { gloss: 91, metallic: 90, shift: 45 },
    material: { ...METALLIC_MAT, metalness: 0.86, roughness: 0.2 },
  },
  {
    id: 'hm-04',
    code: 'HM-04',
    name: '林芝玫瑰粉',
    nameEn: 'Metallic Rose Quartz',
    finish: 'metallic',
    finishLabel: '金属',
    finishLabelEn: 'Metallic',
    seriesName: '和彩·金属系列',
    seriesNameEn: 'Hecai Metallic',
    hex: '#B57080',
    shiftHex: '#F5C2CE',
    hue: 347,
    hueGroup: 'purple',
    isNeutral: false,
    isNew: true,
    tagline: '微米级银粉融入莫兰迪玫瑰粉，柔美而不失金属张力',
    taglineEn: 'Dusty rose quartz infused with radiant micro-metallic sparkle',
    optics: { gloss: 90, metallic: 84, shift: 52 },
    material: { ...METALLIC_MAT, metalness: 0.8, roughness: 0.21 },
  },
  {
    id: 'hm-05',
    code: 'HM-05',
    name: '远峰金属冰蓝',
    nameEn: 'Sierra Metallic Ice Blue',
    finish: 'metallic',
    finishLabel: '金属',
    finishLabelEn: 'Metallic',
    seriesName: '和彩·金属系列',
    seriesNameEn: 'Hecai Metallic',
    hex: '#577DA1',
    shiftHex: '#B6D6F5',
    hue: 209,
    hueGroup: 'blue',
    isNeutral: false,
    tagline: '清冷高级的冰川金属蓝，光线流转间颗粒清透闪烁',
    taglineEn: 'Cool alpine blue elevated by crisp metallic silver pigment',
    optics: { gloss: 92, metallic: 86, shift: 46 },
    material: { ...METALLIC_MAT, metalness: 0.82, roughness: 0.19 },
  },
  {
    id: 'hm-06',
    code: 'HM-06',
    name: '旷野祖母绿',
    nameEn: 'Emerald Metallic Green',
    finish: 'metallic',
    finishLabel: '金属',
    finishLabelEn: 'Metallic',
    seriesName: '和彩·金属系列',
    seriesNameEn: 'Hecai Metallic',
    hex: '#114A39',
    shiftHex: '#35A382',
    hue: 162,
    hueGroup: 'green',
    isNeutral: false,
    tagline: '祖母绿宝石金属颗粒，强光下闪耀翡翠般深邃光泽',
    taglineEn: 'Rich emerald green with luminous jewel-like metallic depth',
    optics: { gloss: 93, metallic: 88, shift: 44 },
    material: { ...METALLIC_MAT, metalness: 0.82, roughness: 0.19 },
  },

  // === 3. 幻彩珠光系列（6 款）===
  {
    id: 'hp-01',
    code: 'HP-01',
    name: '极光白变金',
    nameEn: 'Aurora White Gold Pearl',
    finish: 'pearlescent',
    finishLabel: '珠光',
    finishLabelEn: 'Pearlescent',
    seriesName: '和彩·珠光系列',
    seriesNameEn: 'Hecai Pearl',
    hex: '#E6E2D8',
    shiftHex: '#F2C15A',
    hue: 46,
    hueGroup: 'gold',
    isNeutral: false,
    isNew: true,
    tagline: '正视温润象牙白，曲面折光泛出流动香槟金珠光',
    taglineEn: 'Warm pearl white shifting into molten champagne gold on curves',
    optics: { gloss: 96, metallic: 42, shift: 90 },
    material: { ...PEARLESCENT_MAT, metalness: 0.24, roughness: 0.14 },
  },
  {
    id: 'hp-02',
    code: 'HP-02',
    name: '冷光魅影紫',
    nameEn: 'Phantom Violet Pearl',
    finish: 'pearlescent',
    finishLabel: '珠光',
    finishLabelEn: 'Pearlescent',
    seriesName: '和彩·珠光系列',
    seriesNameEn: 'Hecai Pearl',
    hex: '#2B1448',
    shiftHex: '#A855F7',
    hue: 272,
    hueGroup: 'purple',
    isNeutral: false,
    isNew: true,
    tagline: '深邃幽暗的幻彩魅影紫，棱线转折处绽放高光紫霞',
    taglineEn: 'Deep stealth plum erupting into electric violet pearl highlights',
    optics: { gloss: 97, metallic: 54, shift: 94 },
    material: { ...PEARLESCENT_MAT, metalness: 0.42 },
  },
  {
    id: 'hp-03',
    code: 'HP-03',
    name: '苍穹青幻紫',
    nameEn: 'Celestial Cyan Violet',
    finish: 'pearlescent',
    finishLabel: '珠光',
    finishLabelEn: 'Pearlescent',
    seriesName: '和彩·珠光系列',
    seriesNameEn: 'Hecai Pearl',
    hex: '#0D4A5B',
    shiftHex: '#7C4DFF',
    hue: 191,
    hueGroup: 'blue',
    isNeutral: false,
    isNew: true,
    tagline: '天青底色交织星云幻紫珠光，随视角呈现双色渐变律动',
    taglineEn: 'Celestial teal base shifting across iridescent nebula violet',
    optics: { gloss: 97, metallic: 58, shift: 98 },
    material: { ...PEARLESCENT_MAT, iridescence: 0.96, metalness: 0.44 },
  },
  {
    id: 'hp-04',
    code: 'HP-04',
    name: '潋湾冰青珠光',
    nameEn: 'Lagoon Mint Pearl',
    finish: 'pearlescent',
    finishLabel: '珠光',
    finishLabelEn: 'Pearlescent',
    seriesName: '和彩·珠光系列',
    seriesNameEn: 'Hecai Pearl',
    hex: '#4CB39A',
    shiftHex: '#63B8F2',
    hue: 162,
    hueGroup: 'green',
    isNeutral: false,
    tagline: '清凉薄荷青融合晴空蓝珠光，清爽通透颇具辨识度',
    taglineEn: 'Fresh sea-mint infused with shimmering sky-blue pearl luster',
    optics: { gloss: 95, metallic: 46, shift: 86 },
    material: { ...PEARLESCENT_MAT, metalness: 0.32 },
  },
  {
    id: 'hp-05',
    code: 'HP-05',
    name: '贝母樱花粉',
    nameEn: 'Sakura Mother of Pearl',
    finish: 'pearlescent',
    finishLabel: '珠光',
    finishLabelEn: 'Pearlescent',
    seriesName: '和彩·珠光系列',
    seriesNameEn: 'Hecai Pearl',
    hex: '#DCB2BE',
    shiftHex: '#A6B4FF',
    hue: 345,
    hueGroup: 'purple',
    isNeutral: false,
    tagline: '天然珍珠贝母光泽叠加淡樱粉与冰蓝紫幻彩折射',
    taglineEn: 'Delicate sakura pink glowing with mother-of-pearl periwinkle',
    optics: { gloss: 95, metallic: 40, shift: 88 },
    material: { ...PEARLESCENT_MAT, metalness: 0.24 },
  },
  {
    id: 'hp-06',
    code: 'HP-06',
    name: '黑曜流金魅红',
    nameEn: 'Obsidian Ruby Pearl',
    finish: 'pearlescent',
    finishLabel: '珠光',
    finishLabelEn: 'Pearlescent',
    seriesName: '和彩·珠光系列',
    seriesNameEn: 'Hecai Pearl',
    hex: '#14090C',
    shiftHex: '#B81D35',
    hue: 351,
    hueGroup: 'red',
    isNeutral: false,
    isNew: true,
    tagline: '暗夜黑曜底漆潜藏绯红珠光，掠影处点燃冷艳红芒',
    taglineEn: 'Stealth obsidian base ignited by fiery ruby pearl reflections',
    optics: { gloss: 98, metallic: 56, shift: 92 },
    material: { ...PEARLESCENT_MAT, metalness: 0.45, roughness: 0.13 },
  },
];

export function findColorSwatchByCode(code?: string | null): ColorFilmItem {
  if (!code) return COLOR_STUDIO_SWATCHES[2];
  const normalized = code.trim().toUpperCase();
  return (
    COLOR_STUDIO_SWATCHES.find((item) => item.code.toUpperCase() === normalized) ||
    COLOR_STUDIO_SWATCHES[2]
  );
}

export function matchesHueGroup(
  item: ColorFilmItem,
  hueGroup: ColorHueGroup,
): boolean {
  if (hueGroup === 'all') return true;
  return item.hueGroup === hueGroup;
}
