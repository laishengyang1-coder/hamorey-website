// ============================================================
// 和膜 HAMOREY — 2026 官方电子色卡 3D 高定选色工坊配置库（全系 103 色）
// 来源：《2026 电子色卡》全系 TPU 改色车衣官方色号
// 工艺覆盖：水晶 Sole (37) / 金属 Metal (23) / 珠光 Pearly (27) / 双色·变色龙 (7) / 镭射·合金·炫彩·锻碳 (9)
// ============================================================

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
    modelUrl: '/models/tesla-model-3.glb?v=20261119',
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
    modelUrl: '/models/tesla-model-y.glb?v=20261119',
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

export const COLOR_STUDIO_SWATCHES: ColorFilmItem[] = [
  {
    "id": "tpu-001s",
    "code": "TPU-001S",
    "name": "天鹅白",
    "nameEn": "High Glossy Swan White",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#F4F5F7",
    "shiftHex": "#FFFFFF",
    "hue": 220,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "天鹅白属于水晶系列颜色，是冷调的纯白，也是纯洁、忠诚和高贵的象征，是新娘身上…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-002s",
    "code": "TPU-002S",
    "name": "钢琴黑",
    "nameEn": "High Glossy Piano Black",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#0A0B0D",
    "shiftHex": "#22252B",
    "hue": 220,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "钢琴黑属于水晶系列颜色，它是最有气质的颜色，，庄严，肃穆，孤独又深情，钢琴黑…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-003s",
    "code": "TPU-003S",
    "name": "纳多灰",
    "nameEn": "Nardo Grey",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#7E8386",
    "shiftHex": "#9DA2A6",
    "hue": 203,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "纳多灰属于水晶系列颜色，出自奥迪RS系列的原厂漆颜色，是一款低饱和度的灰色，…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-004s",
    "code": "TPU-004S",
    "name": "松石绿",
    "nameEn": "Turquoise Green",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#6B9B8A",
    "shiftHex": "#8BB8A8",
    "hue": 159,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "松石绿属于水晶系列颜色，这是一款淡雅的颜色，偏暖色调，绿中带黄，整个色泽沉静…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-005s",
    "code": "TPU-005S",
    "name": "卡其米兰",
    "nameEn": "Crystal Khaki Milan",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#D5C9A8",
    "shiftHex": "#E6DEC6",
    "hue": 44,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "和卡資品優苦登畢產裂期色沁息帶纂味自带复古慵懒的氛围，融合米色的干净是当下热…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-006s",
    "code": "TPU-006S",
    "name": "瓷器蓝",
    "nameEn": "Crystal Ceramic Blue",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#7EA1B6",
    "shiftHex": "#A1BFD0",
    "hue": 202,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "瓷器蓝属于水晶系列颜色，来源于奔驰AMG GTR车型的限量原厂色，是低保和清…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-007s",
    "code": "TPU-007S",
    "name": "洛丽塔粉",
    "nameEn": "Lolita Pink",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#F2C2CE",
    "shiftHex": "#FADCE4",
    "hue": 345,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "属于温柔高级的粉色系粉色中带有橘色，橘色中带有淡淡白色，色调桑和淡雅",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-008s",
    "code": "TPU-008S",
    "name": "爱马仕橙",
    "nameEn": "Hermes Orange",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#F37021",
    "shiftHex": "#FF9857",
    "hue": 23,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "爱马仕橙属于水晶系列颜色，是高饱和度的暖调轻奢橙色，兼具活力和高级感，它没有…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-009s",
    "code": "TPU-009S",
    "name": "紫罗兰",
    "nameEn": "Crystal Violet",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#5B3A94",
    "shiftHex": "#8162B8",
    "hue": 262,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": false,
    "tagline": "紫罗兰属于水晶系列颜色，这是款深紫色紫罗兰，由红，蓝，和黑色组成，色调浓郁温…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-010s",
    "code": "TPU-010S",
    "name": "云山蓝",
    "nameEn": "Crystal Sky Blue",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#6EC8E8",
    "shiftHex": "#9FDEF4",
    "hue": 196,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "云山蓝属于水晶系列颜色，清爽的浅调冰蓝，干净通透，自带治愈，松弛的自然氛围感…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-011s",
    "code": "TPU-011S",
    "name": "法拉利红",
    "nameEn": "Ferrari Rosso Corsa",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#D40000",
    "shiftHex": "#F03A3A",
    "hue": 0,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "法拉利红属于水晶系列颜色，是经典的纯正运动正红，是意大利车队的象征，它是荣耀…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-012s",
    "code": "TPU-012S",
    "name": "冰川蓝",
    "nameEn": "Glacier Blue",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#B5DCE6",
    "shiftHex": "#D4EEF5",
    "hue": 192,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "冰川蓝属于水晶系列颜色，色调柔和淡雅，息带冰雪质感，清新自愈，它是大自然中最…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-013s",
    "code": "TPU-013S",
    "name": "纳多灰(浅)",
    "nameEn": "Light Nardo Grey",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#A4A8AB",
    "shiftHex": "#C0C4C7",
    "hue": 206,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "纳多灰（浅）属于水晶系列颜色，和纳多灰相比，这款颜色更浅，色相偏黄，色泽柔和…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-014s",
    "code": "TPU-014S",
    "name": "甜菜根紫",
    "nameEn": "Beetroot Purple",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#8C2252",
    "shiftHex": "#B54578",
    "hue": 333,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "甜菜根紫属于水晶系列颜色，色调复古，深粉色与紫红色的结合形成了独特的色调，它…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-015s",
    "code": "TPU-015S",
    "name": "湖泊蓝",
    "nameEn": "Lake Blue",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#2EB5C4",
    "shiftHex": "#64D2DE",
    "hue": 186,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "湖泊蓝属于水晶系列颜色，是清新通透的湖调青蓝色，是一点点偏绿的蓝，如湖水一般…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-016s",
    "code": "TPU-016S",
    "name": "迈阿密蓝",
    "nameEn": "Porsche Miami Blue",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#00A8C8",
    "shiftHex": "#4CCCE3",
    "hue": 190,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "迈阿密蓝属于水晶系列颜色，是保时捷的官方配色，其颜色是比深海蓝浅，比天空看深…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-017s",
    "code": "TPU-017S",
    "name": "林地军绿",
    "nameEn": "Forestland Army Green",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#465438",
    "shiftHex": "#657556",
    "hue": 90,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "林地军绿属于水晶系列颜色，军绿色根据地形不同，其实军绿分为3种色系：林地军绿…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-025s",
    "code": "TPU-025S",
    "name": "凯莫拉灰",
    "nameEn": "Audi Kemora Grey",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#758690",
    "shiftHex": "#96A6B0",
    "hue": 202,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "凯莫拉灰属于水晶系列颜色，来自奥迪R8 的原厂配色，奥迪品牌高性能旗舰的专用…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-026s",
    "code": "TPU-026S",
    "name": "布鲁克林灰",
    "nameEn": "BMW Brooklyn Grey",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#8E969B",
    "shiftHex": "#AEB5BA",
    "hue": 203,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "布鲁克林灰属于水晶系列颜色，来自于宝马的经典配色，是宝马灰色系的天花板，布鲁…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-028s",
    "code": "TPU-028S",
    "name": "迈凯伦橙",
    "nameEn": "McLaren Papaya Orange",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#FF7A00",
    "shiftHex": "#FFA34D",
    "hue": 29,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "迈凯伦橙属于水晶系列颜色，这款鲜亮的橙色是迈凯伦车队的经典配色，辨识度极高，…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-029s",
    "code": "TPU-029S",
    "name": "能量黄",
    "nameEn": "Energy Yellow",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#F5B800",
    "shiftHex": "#FFD44D",
    "hue": 45,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "能量黄属于水晶系列颜色，这是款高饱和度的明亮黄色，如同朝阳与暖日，自带活力氛…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-031s",
    "code": "TPU-031S",
    "name": "赛博灰绿",
    "nameEn": "Cyber Gray Green",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#6E7A69",
    "shiftHex": "#8E9A89",
    "hue": 102,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "赛博灰绿属于水晶系列颜色，低饱和的中性灰绿色调，融合工业冷感和自兼具未来科技…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-032s",
    "code": "TPU-032S",
    "name": "战斗绿",
    "nameEn": "Combat Green",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#4A5328",
    "shiftHex": "#6B7545",
    "hue": 73,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "战斗绿属于水晶系列颜色，是经典的深调军系绿色，硬核力量感",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-033s",
    "code": "TPU-033S",
    "name": "胡椒白",
    "nameEn": "MINI Pepper White",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#EBE5D3",
    "shiftHex": "#F7F3E8",
    "hue": 45,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "泪椒白属于水晶系列颜色，这是款低饱和暖调米白，带有淡淡的浅灰绿基底",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-034s",
    "code": "TPU-034S",
    "name": "沙漠黄",
    "nameEn": "Desert Sand Yellow",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#B69B6A",
    "shiftHex": "#CFB88C",
    "hue": 39,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "沙漠黄属于水晶系列颜色，灵感源自戈壁沙漠原生沙士色彩，早期广泛运用于拉力赛车…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-035s",
    "code": "TPU-035S",
    "name": "总裁黑",
    "nameEn": "Executive Gloss Black",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#08090C",
    "shiftHex": "#1F2228",
    "hue": 225,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": true,
    "tagline": "总裁黑属于水晶系列颜色，色调为极致深邃的纯黑，漆面镜面通透，沉浸如墨，凝练厚…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-037s",
    "code": "TPU-037S",
    "name": "乌龙奶茶粉",
    "nameEn": "Oolong Milk Tea Pink",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#C2A2A4",
    "shiftHex": "#D9BFC1",
    "hue": 356,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "乌龙奶茶粉属于水晶系列颜色，低饱和灰调奶茶粉，融合乌龙茶棕调与柔雾粉色",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-038s",
    "code": "TPU-038S",
    "name": "普罗旺斯紫",
    "nameEn": "Provence Lavender Purple",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#8673A1",
    "shiftHex": "#A896C2",
    "hue": 265,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": false,
    "tagline": "普罗旺斯紫属于水晶系列颜色，灵感源自法国普罗旺斯薰衣草原野色调，提取了薰衣草…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-039s",
    "code": "TPU-039S",
    "name": "镜空粉",
    "nameEn": "Mirror Sky Pink",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#DFC2C8",
    "shiftHex": "#F0DCE0",
    "hue": 348,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "镜空粉属于水晶系列颜色，属于低饱和裸调浅粉，弱化了粉色的甜腻感，融入灰调质感…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-040s",
    "code": "TPU-040S",
    "name": "贝壳粉",
    "nameEn": "Shell Pink",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#F5D2D4",
    "shiftHex": "#FCE7E8",
    "hue": 357,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "贝壳粉属于水晶系列颜色，是柔和暖调浅裸粉，自带珍珠贝壳般温润光泽，降低了普通…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-041s",
    "code": "TPU-041S",
    "name": "水晶熔岩橙",
    "nameEn": "Porsche Lava Orange",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#F2541B",
    "shiftHex": "#FF8152",
    "hue": 16,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "查曇遼煮絲壓杏淼庸奢型蛺色省桑鬆聖級森票雙•畫胡農殿酒杂力十足却不艳俗，兼具…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-042s",
    "code": "TPU-042S",
    "name": "迷雾灰紫",
    "nameEn": "Misty Grey Purple",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#B8A8BE",
    "shiftHex": "#D2C6D8",
    "hue": 284,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": false,
    "tagline": "迷雾灰紫属于水晶系列颜色，是低饱和莫兰迪调，水晶亮面柔和通透，主打低调温柔、…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-044s",
    "code": "TPU-044S",
    "name": "蒂芙尼蓝",
    "nameEn": "Tiffany Blue",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#81D8D0",
    "shiftHex": "#ACEAE4",
    "hue": 174,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "蒂芙尼蓝属于水晶系列颜色，源自经典珠宝品牌标志性配色，象征浪漫、美好与轻奢",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-045s",
    "code": "TPU-045S",
    "name": "圣保罗黄",
    "nameEn": "BMW Sao Paulo Yellow",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#DCE32D",
    "shiftHex": "#ECF16B",
    "hue": 62,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "圣保罗黄属于水晶系列颜色，源自赛车赛事经典配色，名称取自巴西圣保罗赛道，是深…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-046s",
    "code": "TPU-046S",
    "name": "阿什利绿",
    "nameEn": "Ashley Green",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#5D8B62",
    "shiftHex": "#7FA984",
    "hue": 127,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "经典车漆通透质感",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-048s",
    "code": "TPU-048S",
    "name": "保时捷亚灰",
    "nameEn": "Porsche Chalk Grey",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#D2CFC8",
    "shiftHex": "#E5E3DD",
    "hue": 42,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "保时捷亚灰属于水晶系列颜色，来自保时捷911的经典配色，这是款低饱和暖调的浅…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 98,
      "metallic": 10,
      "shift": 16
    },
    "material": {
      "metalness": 0.06,
      "roughness": 0.06,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.02,
      "iridescence": 0.08,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.16
    }
  },
  {
    "id": "tpu-049s",
    "code": "TPU-049S",
    "name": "超哑碳黑",
    "nameEn": "Ultra Matte Carbon Black",
    "finish": "crystal",
    "finishLabel": "水晶",
    "finishLabelEn": "Crystal",
    "seriesName": "水晶 Sole",
    "seriesNameEn": "Sole Crystal",
    "hex": "#1A1B1E",
    "shiftHex": "#32353B",
    "hue": 225,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "超哑碳黑属于水晶系列颜色，是钢琴黑的超哑版本，源自热门黑武士改装风格，以碳系…",
    "taglineEn": "2026 Official Sole Crystal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 28,
      "metallic": 22,
      "shift": 12
    },
    "material": {
      "metalness": 0.14,
      "roughness": 0.44,
      "clearcoat": 0.25,
      "clearcoatRoughness": 0.42,
      "flakeIntensity": 0.08,
      "iridescence": 0.04,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.22
    }
  },
  {
    "id": "tpu-001m",
    "code": "TPU-001M",
    "name": "黑金AMG山灰",
    "nameEn": "Black Gold AMG Mountain Grey",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#4F5356",
    "shiftHex": "#8C8470",
    "hue": 206,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "黑金AMG山灰取材奔驰AMG原厂高性能车漆色系，是性能圈经典深灰色，典，又有…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-002m",
    "code": "TPU-002M",
    "name": "黑曜金",
    "nameEn": "Metallic Obsidian Gold",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#2B261B",
    "shiftHex": "#A88B4A",
    "hue": 41,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "黑曜金属于金属系列颜色，其暗调基底融合细腻金属金闪，暗光环境趋近深邃黑，光线…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-003m",
    "code": "TPU-003M",
    "name": "GT银",
    "nameEn": "Porsche GT Silver Metallic",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#B6BAC0",
    "shiftHex": "#DCE0E6",
    "hue": 216,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "GT银属于金属系列颜色，其源自勒芒24H拉力赛史上，保时捷工程师为减轻车重，…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-004m",
    "code": "TPU-004M",
    "name": "骑士银",
    "nameEn": "Metallic Knight Silver",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#9BA1A8",
    "shiftHex": "#C2C7CE",
    "hue": 212,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "骑士银属于金属系列颜色，低饱和柔和金属银，细腻柔和金属粉体，色调温润中性，没…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-005m",
    "code": "TPU-005M",
    "name": "金属枪灰",
    "nameEn": "Metallic Gunmetal Gray",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#4A4F56",
    "shiftHex": "#787E87",
    "hue": 215,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "感，色调冷峻克制",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-006m",
    "code": "TPU-006M",
    "name": "冰莓粉",
    "nameEn": "Porsche Frozen Berry Metallic",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#B98B95",
    "shiftHex": "#D6B0B9",
    "hue": 347,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "冰莓粉属于金属系列颜色，来自于保时捷Taycan的网红配色，冰莓粉属于暗色调…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-007m",
    "code": "TPU-007M",
    "name": "天青蓝",
    "nameEn": "Metallic Azure Blue",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#5D89A8",
    "shiftHex": "#8AB2CE",
    "hue": 205,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "天青蓝属于金属系列颜色，是中国传统颜色，这是一种淡淡的银蓝色，蓝中透着一点灰…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-008m",
    "code": "TPU-008M",
    "name": "阳光橙",
    "nameEn": "Metallic Sunny Orange",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#E8741C",
    "shiftHex": "#FFA052",
    "hue": 26,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "阳光橙属于金属系列颜色，这是一款高亮度高饱和度的橙色，流动的金属质感充满着活…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-009m",
    "code": "TPU-009M",
    "name": "熔岩橙",
    "nameEn": "Metallic Lava Orange",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#E84C1E",
    "shiftHex": "#FF7D54",
    "hue": 14,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "熔岩橙属于金属系列颜色，这是一种高饱和度的橙红色调，主体基调为橙红",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-010m",
    "code": "TPU-010M",
    "name": "天鹅绒紫",
    "nameEn": "Metallic Velvet Purple",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#5C3468",
    "shiftHex": "#8A5D96",
    "hue": 286,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": false,
    "tagline": "天鹅绒紫属于金属系列颜色，色调灵感来源于美国育种专家选育的新型紫薇品种，花色…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-011m",
    "code": "TPU-011M",
    "name": "古铜金",
    "nameEn": "Metallic Bronze Gold",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#8C6239",
    "shiftHex": "#BA9064",
    "hue": 30,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "古铜金属于金属系列颜色，是中国传统色彩之一，是古人用褐石，胭脂及墨此款颜色以…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-012m",
    "code": "TPU-012M",
    "name": "超音速钛灰",
    "nameEn": "Sonic Titanium Grey",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#8A8D8F",
    "shiftHex": "#B5B8BA",
    "hue": 204,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "超音速钛灰属于金属系列颜色，这是一款类似香槟金的颜色，配合超合金的雅从容，悄…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-013m",
    "code": "TPU-013M",
    "name": "AMG 超哑山灰",
    "nameEn": "AMG Selenite Grey Magno",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#5A5E62",
    "shiftHex": "#7C8186",
    "hue": 210,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "超哑山灰属于金属系列颜色，是AMG山灰的哑光版本，其光泽接近全哑，色调介于黑…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 28,
      "metallic": 64,
      "shift": 12
    },
    "material": {
      "metalness": 0.58,
      "roughness": 0.44,
      "clearcoat": 0.25,
      "clearcoatRoughness": 0.42,
      "flakeIntensity": 0.34,
      "iridescence": 0.04,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.22
    }
  },
  {
    "id": "tpu-014m",
    "code": "TPU-014M",
    "name": "超哑黑矿石",
    "nameEn": "Super Matte Obsidian Black",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#1C1E21",
    "shiftHex": "#383B42",
    "hue": 216,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "属于金属哑光系列颜色，光泽接近全哑，在色泽方面类似于黑色带一些灰色和棕色的色…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 28,
      "metallic": 64,
      "shift": 12
    },
    "material": {
      "metalness": 0.58,
      "roughness": 0.44,
      "clearcoat": 0.25,
      "clearcoatRoughness": 0.42,
      "flakeIntensity": 0.34,
      "iridescence": 0.04,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.22
    }
  },
  {
    "id": "tpu-015m",
    "code": "TPU-015M",
    "name": "哑光铝水银",
    "nameEn": "Matte Aluminum Mercury",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#AEB3B8",
    "shiftHex": "#D0D4D8",
    "hue": 210,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "消光铝水银属于金属系列颜色，是液态铝水银的哑光版本，这款是纯正的金属色，哑光…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 28,
      "metallic": 64,
      "shift": 12
    },
    "material": {
      "metalness": 0.58,
      "roughness": 0.44,
      "clearcoat": 0.25,
      "clearcoatRoughness": 0.42,
      "flakeIntensity": 0.34,
      "iridescence": 0.04,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.22
    }
  },
  {
    "id": "tpu-016m",
    "code": "TPU-016M",
    "name": "液态银",
    "nameEn": "Liquid Silver Metallic",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#C2C6CC",
    "shiftHex": "#E5E8ED",
    "hue": 216,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "液态银属于金属系列颜色，这是一款高细腻的金属液态银，呈现如同流动液态金属的镜面肌理",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-019m",
    "code": "TPU-019M",
    "name": "丝缎AMG山灰",
    "nameEn": "Satin AMG Mountain Grey",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#565A5E",
    "shiftHex": "#7A7F85",
    "hue": 210,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "丝缎AMG山灰属于金属序列颜色，是AMG山灰的丝缎版本，是半光的金属质感，这…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 62,
      "metallic": 76,
      "shift": 28
    },
    "material": {
      "metalness": 0.68,
      "roughness": 0.26,
      "clearcoat": 0.62,
      "clearcoatRoughness": 0.22,
      "flakeIntensity": 0.42,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.35
    }
  },
  {
    "id": "tpu-020m",
    "code": "TPU-020M",
    "name": "丝缎哑黑矿石",
    "nameEn": "Satin Matte Black",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#222428",
    "shiftHex": "#3F434A",
    "hue": 220,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "丝缎哑黑矿石属于金属系列颜色，是哑黑矿石的丝缎版本，是半光的金属质感，是纯正…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 62,
      "metallic": 76,
      "shift": 28
    },
    "material": {
      "metalness": 0.68,
      "roughness": 0.26,
      "clearcoat": 0.62,
      "clearcoatRoughness": 0.22,
      "flakeIntensity": 0.42,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.35
    }
  },
  {
    "id": "tpu-021m",
    "code": "TPU-021M",
    "name": "索马托蓝",
    "nameEn": "Somato Metallic Blue",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#587A96",
    "shiftHex": "#83A5C0",
    "hue": 207,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "是一款细腻金属冷调浅青蓝，颜色灵感源自通透，自带冰川质感",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-022m",
    "code": "TPU-022M",
    "name": "曙光金",
    "nameEn": "Dawning Gold Metallic",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#C9B082",
    "shiftHex": "#E2CFA8",
    "hue": 39,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "曙光金属于金属系列颜色，灵感源自清晨破晓时分柔和的金色晨光，萃取日出时分温润…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-026m",
    "code": "TPU-026M",
    "name": "金属香槟金",
    "nameEn": "Metallic Champagne Gold",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#C2AD84",
    "shiftHex": "#DECBA6",
    "hue": 40,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": true,
    "tagline": "以浅色调的香槟色作为基地，搭配细腻的金属颜料，使色调柔和雅致，呈现温润的金属…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-027m",
    "code": "TPU-027M",
    "name": "丝缎金属香槟金",
    "nameEn": "Satin Champagne Gold",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#CBB892",
    "shiftHex": "#E3D4B4",
    "hue": 40,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": true,
    "tagline": "丝缎金属香槟金 属于金属系列颜色，是金属香槟金的哑光版本，以浅色调的香槟色作…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 62,
      "metallic": 76,
      "shift": 28
    },
    "material": {
      "metalness": 0.68,
      "roughness": 0.26,
      "clearcoat": 0.62,
      "clearcoatRoughness": 0.22,
      "flakeIntensity": 0.42,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.35
    }
  },
  {
    "id": "tpu-029m",
    "code": "TPU-029M",
    "name": "流光金",
    "nameEn": "Flowing Gold Metallic",
    "finish": "metallic",
    "finishLabel": "金属",
    "finishLabelEn": "Metallic",
    "seriesName": "金属 Metal",
    "seriesNameEn": "Metal Series",
    "hex": "#B8965A",
    "shiftHex": "#D6B87E",
    "hue": 38,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": true,
    "tagline": "流光金 属于金属系列颜色，这是一款非常常见且经典的配色，传统，务实，不张扬，…",
    "taglineEn": "2026 Official Metal Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 92,
      "metallic": 92,
      "shift": 34
    },
    "material": {
      "metalness": 0.8,
      "roughness": 0.16,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.04,
      "flakeIntensity": 0.62,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.34
    }
  },
  {
    "id": "tpu-001p",
    "code": "TPU-001P",
    "name": "朱雀红",
    "nameEn": "Pearlescent Rosefinch Red",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#A3444B",
    "shiftHex": "#A04148",
    "hue": 356,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "朱雀红属于珠光系列颜色，朱雀红取自中国传统神兽朱雀意象，朱雀象征祥瑞、热忱与生命力",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-002p",
    "code": "TPU-002P",
    "name": "珍珠白",
    "nameEn": "Pearl White",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#DEE3DC",
    "shiftHex": "#E2E6E2",
    "hue": 103,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "珍珠白属于珠光系列颜色，属于万能百搭经典色，优势是视觉显大、安全性高、受众广…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-003p",
    "code": "TPU-003P",
    "name": "祖母绿",
    "nameEn": "Pearlescent Emerald Green",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#264C40",
    "shiftHex": "#437163",
    "hue": 161,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "祖母绿属于珠光系列颜色，这款颜色奔驰的原厂色，其色泽深沉低调，于小众高级复古…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-004p",
    "code": "TPU-004P",
    "name": "珠光黑",
    "nameEn": "Pearlescent Black",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#37383A",
    "shiftHex": "#333739",
    "hue": 220,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "合，它没有钻石的璀璨光亮，也没有彩宝的炫目艳丽，更多的是珍珠般的温润细腻，自…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-005p",
    "code": "TPU-005P",
    "name": "火焰绿",
    "nameEn": "Pearlescent Flame Green",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#138E5F",
    "shiftHex": "#0E9B58",
    "hue": 157,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "火焰绿属于珠光系列颜色，它就像绿色的火焰，灵感来源于铜原子在被激发后，释放出…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-006p",
    "code": "TPU-006P",
    "name": "千山翠",
    "nameEn": "Pearlescent Mountains Green",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#21534D",
    "shiftHex": "#1C605B",
    "hue": 173,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "千山翠属于珠光系列颜色，是前几年的网红配色，清新、翠绿，透露出高贵冷艳的色彩…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-007p",
    "code": "TPU-007P",
    "name": "激情黄",
    "nameEn": "Pearlescent Passion Yellow",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#F6E107",
    "shiftHex": "#F5DE0F",
    "hue": 55,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "激情黄属于珠光系列颜色，属于活力运动个性色系，自带阳光、热血的标签",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-008p",
    "code": "TPU-008P",
    "name": "葡萄紫",
    "nameEn": "Pearlescent Grape Purple",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#743F6E",
    "shiftHex": "#AF71A0",
    "hue": 307,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": false,
    "tagline": "这是一款深色珠光紫，色彩上具有较高的饱和度和纯度，给人以清新、明亮、深邃的感觉",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-009p",
    "code": "TPU-009P",
    "name": "激情蓝",
    "nameEn": "Pearlescent Passion Blue",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#2A3B81",
    "shiftHex": "#668BD8",
    "hue": 228,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "激情蓝属于珠光系列颜色，来自与玛莎拉蒂 总裁的经典配色 QUATTROPOR…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-011p",
    "code": "TPU-011P",
    "name": "哑光象牙瓷白",
    "nameEn": "Satin Ivory White",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#DDDFD9",
    "shiftHex": "#DEDED9",
    "hue": 80,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "哑光象牙瓷白属于珠光系列颜色，是象牙白的哑光版本，温润暖调奶白色，摒弃亮面的…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 28,
      "metallic": 22,
      "shift": 24
    },
    "material": {
      "metalness": 0.28,
      "roughness": 0.44,
      "clearcoat": 0.25,
      "clearcoatRoughness": 0.42,
      "flakeIntensity": 0.34,
      "iridescence": 0.16,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.22
    }
  },
  {
    "id": "tpu-012p",
    "code": "TPU-012P",
    "name": "象牙白",
    "nameEn": "Gloss Ivory White",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#E2E4E3",
    "shiftHex": "#EEEFEC",
    "hue": 150,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "是金属核珠光的结合，使颜色凌厉中又带着象牙自屋于珠光系列辆色商药磁想复古色系",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-021p",
    "code": "TPU-021P",
    "name": "哑光曙光白",
    "nameEn": "Matte Dawn White",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#E0E4E1",
    "shiftHex": "#DCE9DD",
    "hue": 135,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "哑光曙光白属于珠光系列颜色，是一直轻幻彩轻奢浅色系",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 28,
      "metallic": 22,
      "shift": 24
    },
    "material": {
      "metalness": 0.28,
      "roughness": 0.44,
      "clearcoat": 0.25,
      "clearcoatRoughness": 0.42,
      "flakeIntensity": 0.34,
      "iridescence": 0.16,
      "iridescenceIOR": 1.32,
      "sheenIntensity": 0.22
    }
  },
  {
    "id": "tpu-025p",
    "code": "TPU-025P",
    "name": "安哥拉灰",
    "nameEn": "Angora Gray",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#E2E4DA",
    "shiftHex": "#EAEBE3",
    "hue": 72,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "安哥拉灰属于珠光系列颜色，属于低饱和浅奶灰，带有柔和暖调基底，搭配细腻珠光质…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-026p",
    "code": "TPU-026P",
    "name": "暗影蓝",
    "nameEn": "Shadow Blue",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#296277",
    "shiftHex": "#3B8C9F",
    "hue": 196,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "暗影蓝属于珠光系列颜色，是深邃暗调轻奢色系",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-027p",
    "code": "TPU-027P",
    "name": "齐紫",
    "nameEn": "Shadow Purple",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#594E5C",
    "shiftHex": "#938895",
    "hue": 287,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": false,
    "tagline": "齐紫属于珠光系列颜色，是一款隐奢暗调珠光色系",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-028p",
    "code": "TPU-028P",
    "name": "龙血红",
    "nameEn": "Dragon Blood Red",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#843D43",
    "shiftHex": "#D55763",
    "hue": 355,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "龙血红属于珠光系列颜色，灵感源自龙血树脂（龙血竭）色的天然树脂，切开之后内部…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-029p",
    "code": "TPU-029P",
    "name": "黑玫瑰",
    "nameEn": "Pearlescent Black Rose",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#51373A",
    "shiftHex": "#815E62",
    "hue": 353,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "黑玫瑰需要珠光系列颜色，是一款暗里藏红的宝藏低调色，日常远看近似黑色，近距离…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-031p",
    "code": "TPU-031P",
    "name": "赛博灰",
    "nameEn": "Cyber Gray",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#4B4D4A",
    "shiftHex": "#5E6160",
    "hue": 100,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "赛博灰属于珠光系列颜色，是低调的机能科技色，远看接近深灰，近看布满细腻冷珠光…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-033p",
    "code": "TPU-033P",
    "name": "皇家绿",
    "nameEn": "Royal Green",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#224A3B",
    "shiftHex": "#226749",
    "hue": 158,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "皇家绿属于珠光系列颜色，皇家绿是经典复古贵族珠光绿，暗光沉稳如墨玉，强光通透…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-034p",
    "code": "TPU-034P",
    "name": "奥格黄",
    "nameEn": "August Yellow",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#EDC512",
    "shiftHex": "#F9DF5F",
    "hue": 49,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "奥格黄属于珠光系列颜色，以金黄色作为底色，搭配细腻柔和的珠光粉体",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-035p",
    "code": "TPU-035P",
    "name": "竞速橙",
    "nameEn": "Racing Orange",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#E39327",
    "shiftHex": "#EDA84F",
    "hue": 34,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "它是赛道感十足的珠光活力橙，饱和度饱能够最大化强化竞速运动风格",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-039p",
    "code": "TPU-039P",
    "name": "琉璃蓝",
    "nameEn": "Glazed Blue",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#184FBB",
    "shiftHex": "#2E4DB1",
    "hue": 220,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "琉璃蓝属于珠光系列颜色，以深邃宝石蓝作为基底，融入细腻通透的彩澄澈华贵，既有…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-040p",
    "code": "TPU-040P",
    "name": "金属锰石黑",
    "nameEn": "Metallic Manganese Black",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#2C2E2C",
    "shiftHex": "#3E4140",
    "hue": 120,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "把稳重底色和细腻珠光金属感结合，适合不爱炫技、但追求内在质感的成熟车主；大车…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-041p",
    "code": "TPU-041P",
    "name": "玛瑙绿",
    "nameEn": "Agate green",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#126245",
    "shiftHex": "#3D8769",
    "hue": 158,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "玛瑙绿属于珠光系列颜色，是浓郁复古的深调祖母绿色调，带有细腻柔和的珠光颗粒",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-043p",
    "code": "TPU-043P",
    "name": "威尼斯紫",
    "nameEn": "Venetian Purple",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#522673",
    "shiftHex": "#8654A6",
    "hue": 274,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": false,
    "tagline": "蹙唇蕾龔霾掱咪胔酸刴鹽色油暴優環鍋束組蔭*是低调复古的珠光暗紫，神秘而华贵；…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-044p",
    "code": "TPU-044P",
    "name": "金属灰绿",
    "nameEn": "Metal Gray-Green",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#6D7466",
    "shiftHex": "#A4A99A",
    "hue": 90,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "属颗粒，带有复古荒野的低调氛围感；自然光线下，细密珠光缓缓显现，灰与绿柔和交…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-048p",
    "code": "TPU-048P",
    "name": "星云紫",
    "nameEn": "Nebula Purple",
    "finish": "pearlescent",
    "finishLabel": "珠光",
    "finishLabelEn": "Pearlescent",
    "seriesName": "珠光 Pearly",
    "seriesNameEn": "Pearly Series",
    "hex": "#7857A9",
    "shiftHex": "#AB78D5",
    "hue": 264,
    "hueGroup": "purple",
    "isNeutral": false,
    "isNew": true,
    "tagline": "星云紫 属于珠光系列颜色，其色调灵感来源自浩瀚夜空的银河星云，内嵌超亮的彩色…",
    "taglineEn": "2026 Official Pearly Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 46,
      "shift": 82
    },
    "material": {
      "metalness": 0.32,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.36,
      "iridescence": 0.62,
      "iridescenceIOR": 1.46,
      "sheenIntensity": 0.72
    }
  },
  {
    "id": "tpu-001b",
    "code": "TPU-001B",
    "name": "梦幻火山灰",
    "nameEn": "Fantasy Volcanic Ash",
    "finish": "chameleon",
    "finishLabel": "双色",
    "finishLabelEn": "Bicolor",
    "seriesName": "双色 Bicolor",
    "seriesNameEn": "Bicolor Series",
    "hex": "#C9AEAD",
    "shiftHex": "#C3ACAE",
    "hue": 2,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "梦幻火山灰属于双色系列颜色，是网红经典幻彩珠光色，最经典的双色珠光色系，以柔…",
    "taglineEn": "2026 Official Bicolor Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 56,
      "shift": 95
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.1,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.022,
      "flakeIntensity": 0.48,
      "iridescence": 0.88,
      "iridescenceIOR": 1.56,
      "sheenIntensity": 0.88
    }
  },
  {
    "id": "tpu-002b",
    "code": "TPU-002B",
    "name": "妃子笑",
    "nameEn": "Red In White",
    "finish": "chameleon",
    "finishLabel": "双色",
    "finishLabelEn": "Bicolor",
    "seriesName": "双色 Bicolor",
    "seriesNameEn": "Bicolor Series",
    "hex": "#E0D8D3",
    "shiftHex": "#E8DFDC",
    "hue": 23,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "𡟚爾綣㕓菂粱鲁矞卲脛掌双盡㛃兜繁贔体礧龛顜螅渠叠蛲準浠麜鸙晶温润通透的浅白调…",
    "taglineEn": "2026 Official Bicolor Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 56,
      "shift": 95
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.1,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.022,
      "flakeIntensity": 0.48,
      "iridescence": 0.88,
      "iridescenceIOR": 1.56,
      "sheenIntensity": 0.88
    }
  },
  {
    "id": "tpu-001l",
    "code": "TPU-001L",
    "name": "高光镭射白",
    "nameEn": "High Gloss Laser White",
    "finish": "special",
    "finishLabel": "镭射",
    "finishLabelEn": "Laser",
    "seriesName": "镭射 Laser",
    "seriesNameEn": "Laser Series",
    "hex": "#D3D6CF",
    "shiftHex": "#DEE2DE",
    "hue": 86,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "高光镭射白属于镭射系列颜色，这是款多变的颜色，在暗处时，略显现一些光泽，但在…",
    "taglineEn": "2026 Official Laser Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 68,
      "shift": 90
    },
    "material": {
      "metalness": 0.52,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.58,
      "iridescence": 0.82,
      "iridescenceIOR": 1.52,
      "sheenIntensity": 0.82
    }
  },
  {
    "id": "tpu-002l",
    "code": "TPU-002L",
    "name": "镭射黑",
    "nameEn": "Laser Black",
    "finish": "special",
    "finishLabel": "镭射",
    "finishLabelEn": "Laser",
    "seriesName": "镭射 Laser",
    "seriesNameEn": "Laser Series",
    "hex": "#242724",
    "shiftHex": "#5F6160",
    "hue": 120,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "个膜面犹如彩虹般的七彩光芒，晚上在灯光下则会更炫酷，阴天的时候，镭射黑收起光…",
    "taglineEn": "2026 Official Laser Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 68,
      "shift": 90
    },
    "material": {
      "metalness": 0.52,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.58,
      "iridescence": 0.82,
      "iridescenceIOR": 1.52,
      "sheenIntensity": 0.82
    }
  },
  {
    "id": "tpu-001c",
    "code": "TPU-001C",
    "name": "黑魅红",
    "nameEn": "Aurora Black Charm Red",
    "finish": "chameleon",
    "finishLabel": "变色龙",
    "finishLabelEn": "Chameleon",
    "seriesName": "变色龙 Chameleon",
    "seriesNameEn": "Chameleon Series",
    "hex": "#683232",
    "shiftHex": "#795E5F",
    "hue": 0,
    "hueGroup": "red",
    "isNeutral": false,
    "isNew": false,
    "tagline": "红的张扬刺眼，暗部沉稳如黑，亮面释放魅惑红调，颗粒细腻高级，属于暗处黑，见光…",
    "taglineEn": "2026 Official Chameleon Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 56,
      "shift": 95
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.1,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.022,
      "flakeIntensity": 0.48,
      "iridescence": 0.88,
      "iridescenceIOR": 1.56,
      "sheenIntensity": 0.88
    }
  },
  {
    "id": "tpu-002c",
    "code": "TPU-002C",
    "name": "青魔",
    "nameEn": "Aurora Green Chromis",
    "finish": "chameleon",
    "finishLabel": "变色龙",
    "finishLabelEn": "Chameleon",
    "seriesName": "变色龙 Chameleon",
    "seriesNameEn": "Chameleon Series",
    "hex": "#0DBEA4",
    "shiftHex": "#4ED29C",
    "hue": 171,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "青魔属于变色龙系列，颜色灵感来源于一种热带海水鱼类，青魔鱼颜色通体为漂亮的蓝…",
    "taglineEn": "2026 Official Chameleon Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 56,
      "shift": 95
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.1,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.022,
      "flakeIntensity": 0.48,
      "iridescence": 0.88,
      "iridescenceIOR": 1.56,
      "sheenIntensity": 0.88
    }
  },
  {
    "id": "tpu-003c",
    "code": "TPU-003C",
    "name": "青岭苍岚",
    "nameEn": "Aurora Bluish-Green",
    "finish": "chameleon",
    "finishLabel": "变色龙",
    "finishLabelEn": "Chameleon",
    "seriesName": "变色龙 Chameleon",
    "seriesNameEn": "Chameleon Series",
    "hex": "#199CAD",
    "shiftHex": "#50A6A1",
    "hue": 187,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "青岭苍岚属于变色龙系列颜色，颜色领域来源于清晨青蓝色的山脉，墨岭青绿，光现湖…",
    "taglineEn": "2026 Official Chameleon Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 56,
      "shift": 95
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.1,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.022,
      "flakeIntensity": 0.48,
      "iridescence": 0.88,
      "iridescenceIOR": 1.56,
      "sheenIntensity": 0.88
    }
  },
  {
    "id": "tpu-005c",
    "code": "TPU-005C",
    "name": "高亮喀纳斯蓝",
    "nameEn": "TPU-005C",
    "finish": "chameleon",
    "finishLabel": "变色龙",
    "finishLabelEn": "Chameleon",
    "seriesName": "变色龙 Chameleon",
    "seriesNameEn": "Chameleon Series",
    "hex": "#35479B",
    "shiftHex": "#3A8DE1",
    "hue": 229,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": true,
    "tagline": "高亮喀纳斯蓝属于变色龙系列颜色，以青蓝紫三种颜色作为基础色调，其灵感取自于北…",
    "taglineEn": "2026 Official Chameleon Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 56,
      "shift": 95
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.1,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.022,
      "flakeIntensity": 0.48,
      "iridescence": 0.88,
      "iridescenceIOR": 1.56,
      "sheenIntensity": 0.88
    }
  },
  {
    "id": "tpu-006c",
    "code": "TPU-006C",
    "name": "丝缎喀纳斯蓝",
    "nameEn": "TPU-006C",
    "finish": "chameleon",
    "finishLabel": "变色龙",
    "finishLabelEn": "Chameleon",
    "seriesName": "变色龙 Chameleon",
    "seriesNameEn": "Chameleon Series",
    "hex": "#45629C",
    "shiftHex": "#3D6DC6",
    "hue": 220,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": true,
    "tagline": "丝缎喀纳斯蓝属于变色龙系列颜色，是高光喀纳斯蓝的哑光版本，以青蓝紫三种颜色作…",
    "taglineEn": "2026 Official Chameleon Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 62,
      "metallic": 42,
      "shift": 48
    },
    "material": {
      "metalness": 0.36,
      "roughness": 0.26,
      "clearcoat": 0.62,
      "clearcoatRoughness": 0.22,
      "flakeIntensity": 0.42,
      "iridescence": 0.32,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.35
    }
  },
  {
    "id": "tpu-002a",
    "code": "TPU-002A",
    "name": "丝缎旭日金",
    "nameEn": "TPU-002A",
    "finish": "special",
    "finishLabel": "合金",
    "finishLabelEn": "Alloyed",
    "seriesName": "合金 Alloyed",
    "seriesNameEn": "Alloyed Metal",
    "hex": "#DFCE63",
    "shiftHex": "#EBD86B",
    "hue": 52,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": true,
    "tagline": "丝缎旭日金 属于合金系列颜色，其色调来源于清晨初升的柔光金，是缎面金属质感的…",
    "taglineEn": "2026 Official Alloyed Metal shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 62,
      "metallic": 76,
      "shift": 28
    },
    "material": {
      "metalness": 0.68,
      "roughness": 0.26,
      "clearcoat": 0.62,
      "clearcoatRoughness": 0.22,
      "flakeIntensity": 0.42,
      "iridescence": 0.16,
      "iridescenceIOR": 1.38,
      "sheenIntensity": 0.35
    }
  },
  {
    "id": "tpu-001g",
    "code": "TPU-001G",
    "name": "炫彩时光金",
    "nameEn": "Golden Armor TPU/",
    "finish": "special",
    "finishLabel": "炫彩",
    "finishLabelEn": "Gorgeous",
    "seriesName": "炫彩 Gorgeous",
    "seriesNameEn": "Gorgeous Series",
    "hex": "#8E8B59",
    "shiftHex": "#A09E78",
    "hue": 57,
    "hueGroup": "gold",
    "isNeutral": false,
    "isNew": false,
    "tagline": "通透，依靠细闪珠光金属粉体呈现色彩，不具备高遮盖力，在不同底色载体下表现截然不同",
    "taglineEn": "2026 Official Gorgeous Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 68,
      "shift": 90
    },
    "material": {
      "metalness": 0.52,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.58,
      "iridescence": 0.82,
      "iridescenceIOR": 1.52,
      "sheenIntensity": 0.82
    }
  },
  {
    "id": "tpu-002g",
    "code": "TPU-002G",
    "name": "炫彩金钻白",
    "nameEn": "Iridescent Gold Diamond White",
    "finish": "special",
    "finishLabel": "炫彩",
    "finishLabelEn": "Gorgeous",
    "seriesName": "炫彩 Gorgeous",
    "seriesNameEn": "Gorgeous Series",
    "hex": "#E7ECEB",
    "shiftHex": "#E8EDEB",
    "hue": 168,
    "hueGroup": "blue",
    "isNeutral": false,
    "isNew": false,
    "tagline": "整体干净通透，自带轻奢贵气，避开普通纯白的单调平淡，华丽却不艳俗",
    "taglineEn": "2026 Official Gorgeous Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 68,
      "shift": 90
    },
    "material": {
      "metalness": 0.52,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.58,
      "iridescence": 0.82,
      "iridescenceIOR": 1.52,
      "sheenIntensity": 0.82
    }
  },
  {
    "id": "tpu-003g",
    "code": "TPU-003G",
    "name": "炫彩蓝钻白",
    "nameEn": "Iridescent Blue Diamond White",
    "finish": "special",
    "finishLabel": "炫彩",
    "finishLabelEn": "Gorgeous",
    "seriesName": "炫彩 Gorgeous",
    "seriesNameEn": "Gorgeous Series",
    "hex": "#DDE3DE",
    "shiftHex": "#DBE0DE",
    "hue": 130,
    "hueGroup": "green",
    "isNeutral": false,
    "isNew": false,
    "tagline": "载细腻冰蓝钻闪，视觉简约干净；在阳光强光照射下，膜面浮现蓝调闪粉含蓄弥散，华…",
    "taglineEn": "2026 Official Gorgeous Series shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 96,
      "metallic": 68,
      "shift": 90
    },
    "material": {
      "metalness": 0.52,
      "roughness": 0.11,
      "clearcoat": 1.0,
      "clearcoatRoughness": 0.025,
      "flakeIntensity": 0.58,
      "iridescence": 0.82,
      "iridescenceIOR": 1.52,
      "sheenIntensity": 0.82
    }
  },
  {
    "id": "tpu-001fp",
    "code": "TPU-001FP",
    "name": "幽冥黑",
    "nameEn": "Nether Black",
    "finish": "special",
    "finishLabel": "锻碳",
    "finishLabelEn": "Forged Carbon",
    "seriesName": "锻碳 Forged",
    "seriesNameEn": "Forged Carbon",
    "hex": "#1B1C20",
    "shiftHex": "#484B52",
    "hue": 100,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "锻造碳（Forged Carbon）锻纹纹理，区别于传统斜纹编织碳纤维，没有…",
    "taglineEn": "2026 Official Forged Carbon shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 58,
      "metallic": 72,
      "shift": 28
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.28,
      "clearcoat": 0.55,
      "clearcoatRoughness": 0.24,
      "flakeIntensity": 0.45,
      "iridescence": 0.12,
      "iridescenceIOR": 1.35,
      "sheenIntensity": 0.18
    }
  },
  {
    "id": "tpu-002fp",
    "code": "TPU-002FP",
    "name": "黑锻碳",
    "nameEn": "Forged Carbon Black",
    "finish": "special",
    "finishLabel": "锻碳",
    "finishLabelEn": "Forged Carbon",
    "seriesName": "锻碳 Forged",
    "seriesNameEn": "Forged Carbon",
    "hex": "#191A1E",
    "shiftHex": "#50535A",
    "hue": 0,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "锻造碳（Forged Carbon）锻纹纹理，区别于传统斜纹编织碳纤维，没有…",
    "taglineEn": "2026 Official Forged Carbon shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 58,
      "metallic": 72,
      "shift": 28
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.28,
      "clearcoat": 0.55,
      "clearcoatRoughness": 0.24,
      "flakeIntensity": 0.45,
      "iridescence": 0.12,
      "iridescenceIOR": 1.35,
      "sheenIntensity": 0.18
    }
  },
  {
    "id": "tpu-cf",
    "code": "TPU-CF",
    "name": "碳纤维(黑)",
    "nameEn": "Carbon Fiber Black",
    "finish": "special",
    "finishLabel": "碳纤维",
    "finishLabelEn": "Carbon Fiber",
    "seriesName": "碳纤维 Carbon",
    "seriesNameEn": "Carbon Fiber",
    "hex": "#212327",
    "shiftHex": "#565A62",
    "hue": 0,
    "hueGroup": "neutral",
    "isNeutral": true,
    "isNew": false,
    "tagline": "2026 和彩 碳纤维 Carbon官方色号，8.0 mil 光学级真 TPU 改色车衣",
    "taglineEn": "2026 Official Carbon Fiber shade in 8.0 mil aliphatic TPU color PPF.",
    "optics": {
      "gloss": 58,
      "metallic": 72,
      "shift": 28
    },
    "material": {
      "metalness": 0.42,
      "roughness": 0.28,
      "clearcoat": 0.55,
      "clearcoatRoughness": 0.24,
      "flakeIntensity": 0.45,
      "iridescence": 0.12,
      "iridescenceIOR": 1.35,
      "sheenIntensity": 0.18
    }
  }
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
