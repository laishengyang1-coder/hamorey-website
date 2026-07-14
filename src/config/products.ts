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
    series: [
      {
        code: 'auris',
        nameCn: '和光',
        nameEn: 'AURIS Dual-Silver',
        modelCode: 'AURIS-DS',
        tagline: '高端双银隔热系列',
        highlights: ['双银磁控溅射工艺', '高隔热低反光', '信号零阻隔'],
        warrantyYears: 5,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 'fortex',
        nameCn: '和盾',
        nameEn: 'FORTEX Armor',
        modelCode: 'FORTEX-AR',
        tagline: '安全防护系列',
        highlights: ['防爆防碎', '高厚度基材', '安全防护升级'],
        warrantyYears: 5,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 'lumis',
        nameCn: '和护',
        nameEn: 'LUMIS UV400+',
        modelCode: 'LUMIS-UV',
        tagline: 'UV400+ 紫外线阻隔系列',
        highlights: ['UV400+紫外线阻隔', '保护皮肤与内饰', '高透光率'],
        warrantyYears: 5,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 'nex5',
        nameCn: '和真',
        nameEn: 'NEX5 Classic',
        modelCode: 'NEX5-CL',
        tagline: '经典高清晰系列',
        highlights: ['超高清晰度', '低雾度基材', '驾驶视野保真'],
        warrantyYears: 5,
        paramsConfirmed: false,
        specs: [],
      },
      {
        code: 'purex',
        nameCn: '和原',
        nameEn: 'PUREX Origin',
        modelCode: 'PUREX-OG',
        tagline: '原厂级隔热系列',
        highlights: ['原厂色温匹配', '自然透光', '均衡性能'],
        warrantyYears: 5,
        paramsConfirmed: false,
        specs: [],
      },
    ],
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
        warrantyYears: 10,
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
        warrantyYears: 7,
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
  name: string;
  hex: string;
  category: '哑光' | '亮面' | '缎面' | '金属';
}

export const colorPpfSwatches: ColorSwatch[] = [
  { name: '魅影黑', hex: '#1A1A1A', category: '亮面' },
  { name: '极光白', hex: '#F0F0F0', category: '亮面' },
  { name: '勃艮第红', hex: '#5C1A1A', category: '亮面' },
  { name: '深海蓝', hex: '#1B2838', category: '亮面' },
  { name: '英国绿', hex: '#2A4A3A', category: '亮面' },
  { name: '金属灰', hex: '#6A6A6A', category: '金属' },
  { name: '香槟金', hex: '#C8A858', category: '金属' },
  { name: '磨砂黑', hex: '#2A2A2A', category: '哑光' },
  { name: '哑光白', hex: '#E8E8E8', category: '哑光' },
  { name: '缎面银', hex: '#A8A8A8', category: '缎面' },
  { name: '电光紫', hex: '#3A2A4A', category: '缎面' },
  { name: '水泥灰', hex: '#8A8A8A', category: '哑光' },
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
