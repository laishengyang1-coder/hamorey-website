// ============================================================
// 和膜 HAMOREY — 产品矩阵配置
// 五大分类 + 各产品系列
// ============================================================

import type { ProductCategory } from '../types/enums';

export interface ProductSeriesConfig {
  /** 系列代码 */
  code: string;
  /** 系列中文名 */
  nameCn: string;
  /** 系列英文名 */
  nameEn: string;
  /** 型号代码 */
  modelCode: string;
  /** 一句话描述 */
  tagline: string;
  /** 核心优势 */
  highlights: string[];
  /** 质保年限 */
  warrantyYears: number;
  /** 参数是否已确认 */
  paramsConfirmed: boolean;
  /** 性能参数（未确认则为空数组） */
  specs: ProductSpec[];
}

export interface ProductSpec {
  label: string;
  value: string;
  confirmed: boolean;
}

export interface ProductCategoryConfig {
  /** 分类 key */
  category: ProductCategory;
  /** 分类中文名 */
  nameCn: string;
  /** 分类英文名 */
  nameEn: string;
  /** 首页一句话描述 */
  oneLiner: string;
  /** 路由路径 */
  path: string;
  /** 图片资源导入路径 */
  image: string;
  /** 是否启用质保 */
  warrantyEnabled: boolean;
  /** 系列列表 */
  series: ProductSeriesConfig[];
}

// === 图片资源导入 ===
import windowFilmImg from '../assets/window-film.jpeg';
import ppfImg from '../assets/ppf.jpeg';
import colorPpfImg from '../assets/color-ppf.jpeg';
import sunroofFilmImg from '../assets/sunroof-film.jpeg';
import architecturalFilmImg from '../assets/architectural-film.jpeg';

// ============================================================
// 五大产品分类配置
// ============================================================

export const productCategories: ProductCategoryConfig[] = [
  // === 1. 窗膜 ===
  {
    category: 'window_film',
    nameCn: '窗膜',
    nameEn: 'Window Film',
    oneLiner: '隔热、清晰与舒适的长期平衡',
    path: '/products/window-film',
    image: windowFilmImg,
    warrantyEnabled: true,
    series: [],
  },

  // === 2. 隐形车衣 ===
  {
    category: 'ppf',
    nameCn: '隐形车衣',
    nameEn: 'Paint Protection Film',
    oneLiner: '守护原厂车漆与车辆残值',
    path: '/products/ppf',
    image: ppfImg,
    warrantyEnabled: true,
    series: [
      {
        code: 'hy8',
        nameCn: '和御',
        nameEn: 'HY8',
        modelCode: 'HY8',
        tagline: '旗舰高光系列',
        highlights: ['高光泽度', '自修复涂层', '超强抗污'],
        warrantyYears: 10,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 'hw',
        nameCn: '和旺',
        nameEn: 'HW8 / HW9',
        modelCode: 'HW8',
        tagline: '标准保护系列',
        highlights: ['均衡保护', '优异耐久', '高性价比'],
        warrantyYears: 10,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 'hx',
        nameCn: '和兴',
        nameEn: 'HX8 / HX9',
        modelCode: 'HX8',
        tagline: '增强防护系列',
        highlights: ['加厚基材', '抗石击升级', '长效保护'],
        warrantyYears: 7,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 'hym',
        nameCn: '和雅',
        nameEn: 'HYM Matte',
        modelCode: 'HYM-MAT',
        tagline: '哑光质感系列',
        highlights: ['哑光质感', '高级视觉', '保护不改色'],
        warrantyYears: 10,
        paramsConfirmed: false,
        specs: [],
      },
    ],
  },

  // === 3. TPU 改色车衣 ===
  {
    category: 'color_ppf',
    nameCn: 'TPU改色车衣',
    nameEn: 'Color PPF',
    oneLiner: '个性表达与车漆保护同步完成',
    path: '/products/color-ppf',
    image: colorPpfImg,
    warrantyEnabled: true,
    series: [],
  },

  // === 4. 天窗冰甲 ===
  {
    category: 'sunroof_film',
    nameCn: '天窗冰甲',
    nameEn: 'Sunroof Film',
    oneLiner: '面向全景天窗与新能源车型的顶部防护',
    path: '/products/sunroof-film',
    image: sunroofFilmImg,
    warrantyEnabled: true,
    series: [
      {
        code: 't1',
        nameCn: 'T1',
        nameEn: 'T1',
        modelCode: 'T1',
        tagline: '标准天窗防护',
        highlights: ['隔热降温', '紫外线阻隔', '防爆安全'],
        warrantyYears: 5,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 't2',
        nameCn: 'T2',
        nameEn: 'T2',
        modelCode: 'T2',
        tagline: '增强天窗防护',
        highlights: ['高隔热率', '全景天窗适配', '新能源车型优化'],
        warrantyYears: 5,
        paramsConfirmed: false,
        specs: [],
      },
    ],
  },

  // === 5. 建筑家居膜 ===
  {
    category: 'architectural_film',
    nameCn: '建筑家居膜',
    nameEn: 'Architectural Film',
    oneLiner: '将玻璃保护延伸到居住与商业空间',
    path: '/products/architectural-film',
    image: architecturalFilmImg,
    warrantyEnabled: false,
    series: [],
  },
];

// === TPU 改色色板配置 ===
export interface ColorSwatch {
  code?: string;
  name: string;
  hex: string;
  shiftHex?: string;
  category: '水晶单色' | '金属' | '珠光' | '哑光' | '亮面' | '缎面';
}

export const colorPpfSwatches: ColorSwatch[] = [
  { code: 'HC-01', name: '钢琴魅黑', hex: '#090A0D', category: '水晶单色' },
  { code: 'HC-02', name: '冰川纯白', hex: '#EAECEF', category: '水晶单色' },
  { code: 'HC-03', name: '岩岚水泥灰', hex: '#596068', category: '水晶单色' },
  { code: 'HC-04', name: '瑚海蒂芙蓝', hex: '#0096B4', category: '水晶单色' },
  { code: 'HC-05', name: '勃艮第胭脂红', hex: '#560E18', category: '水晶单色' },
  { code: 'HC-06', name: '罗平竞速黄', hex: '#DDA206', category: '水晶单色' },
  { code: 'HC-07', name: '英伦墨绿', hex: '#0D2E22', category: '水晶单色' },
  { code: 'HC-08', name: '冷翠宝石蓝', hex: '#0A3D6E', category: '水晶单色' },
  { code: 'HM-01', name: '液态金属银', hex: '#AEB6C2', shiftHex: '#F4F7FB', category: '金属' },
  { code: 'HM-02', name: '星际枪灰', hex: '#2F343D', shiftHex: '#687382', category: '金属' },
  { code: 'HM-03', name: '香槟钛金', hex: '#B3935E', shiftHex: '#F2DDA8', category: '金属' },
  { code: 'HM-04', name: '林芝玫瑰粉', hex: '#B57080', shiftHex: '#F5C2CE', category: '金属' },
  { code: 'HM-05', name: '远峰金属冰蓝', hex: '#577DA1', shiftHex: '#B6D6F5', category: '金属' },
  { code: 'HM-06', name: '旷野祖母绿', hex: '#114A39', shiftHex: '#35A382', category: '金属' },
  { code: 'HP-01', name: '极光白变金', hex: '#E6E2D8', shiftHex: '#F2C15A', category: '珠光' },
  { code: 'HP-02', name: '冷光魅影紫', hex: '#2B1448', shiftHex: '#A855F7', category: '珠光' },
  { code: 'HP-03', name: '苍穹青幻紫', hex: '#0D4A5B', shiftHex: '#7C4DFF', category: '珠光' },
  { code: 'HP-04', name: '潋湾冰青珠光', hex: '#4CB39A', shiftHex: '#63B8F2', category: '珠光' },
  { code: 'HP-05', name: '贝母樱花粉', hex: '#DCB2BE', shiftHex: '#A6B4FF', category: '珠光' },
  { code: 'HP-06', name: '黑曜流金魅红', hex: '#14090C', shiftHex: '#B81D35', category: '珠光' },
];

// === 车衣13个理赔部位 ===
export const ppfClaimParts = [
  '前保险杠',
  '后保险杠',
  '前机盖',
  '左前翼子板',
  '右前翼子板',
  '左前门',
  '右前门',
  '左后门',
  '右后门',
  '左后翼子板',
  '右后翼子板',
  '车顶',
  '后备箱盖',
];

/** 根据分类 key 获取配置 */
export function getCategoryConfig(category: ProductCategory): ProductCategoryConfig | undefined {
  return productCategories.find((c) => c.category === category);
}

/** 根据路由路径获取配置 */
export function getCategoryByPath(path: string): ProductCategoryConfig | undefined {
  return productCategories.find((c) => c.path === path);
}
