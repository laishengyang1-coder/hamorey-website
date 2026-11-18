// ============================================================
// 和膜 HAMOREY — 产品矩阵配置
// 五大分类 + 各产品系列 + 实测规格参数
// ============================================================

import type { ProductCategory } from '../types/enums';
import windowFilmImg from '../assets/hamorey/product-window.jpg';
import ppfImg from '../assets/hamorey/product-ppf.jpg';
import colorPpfImg from '../assets/hamorey/product-color.jpg';
import sunroofFilmImg from '../assets/hamorey/product-sunroof.jpg';
import architecturalFilmImg from '../assets/hamorey/product-architectural.jpg';

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
  /** 性能参数 */
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
  /** 一句话价值主张 */
  oneLiner: string;
  /** 路由路径 */
  path: string;
  /** 分类主图 */
  image: string;
  /** 是否支持电子质保 */
  warrantyEnabled: boolean;
  /** 子系列列表 */
  series: ProductSeriesConfig[];
}

// ============================================================
// 五大产品分类配置
// 注意：series[].code 与 warrantyYears 由 scripts/check-warranty-years.mjs 强校验
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
        tagline: '旗舰高光系列 · 顶级抗穿刺与热修复',
        highlights: ['旗舰级脂肪族 TPU', '划痕热修复涂层', '强效抗污耐黄变'],
        warrantyYears: 10,
        paramsConfirmed: true,
        specs: [
          { label: '基材工艺', value: '旗舰级 TPU', confirmed: true },
          { label: '膜层厚度', value: '7.5 mil', confirmed: true },
          { label: '整车参考价', value: '¥16,800', confirmed: true },
        ],
      },
      {
        code: 'hw',
        nameCn: '和旺',
        nameEn: 'HW8 / HW9',
        modelCode: 'HW8',
        tagline: '全能主力系列 · 高密度增亮防护',
        highlights: ['高密度 / 高亮 TPU', '抗穿刺与疏水自洁', '持久增亮原厂漆'],
        warrantyYears: 10,
        paramsConfirmed: true,
        specs: [
          { label: '基材工艺', value: '高密度 / 高亮 TPU', confirmed: true },
          { label: '膜层厚度', value: '7.5 / 8.5 mil', confirmed: true },
          { label: '整车参考价', value: '¥14,800 – ¥15,800', confirmed: true },
        ],
      },
      {
        code: 'hx',
        nameCn: '和兴',
        nameEn: 'HX8 / HX9',
        modelCode: 'HX8',
        tagline: '实用进阶系列 · 高性价比长效守护',
        highlights: ['优质 TPU 基材', '增强抗刮自修复涂层', '耐黄变抗石击'],
        warrantyYears: 7,
        paramsConfirmed: true,
        specs: [
          { label: '基材工艺', value: '增强涂层 TPU', confirmed: true },
          { label: '膜层厚度', value: '7.5 / 8.5 mil', confirmed: true },
          { label: '整车参考价', value: '¥9,800 – ¥12,800', confirmed: true },
        ],
      },
      {
        code: 'hym',
        nameCn: '和雅',
        nameEn: 'HYM Matte',
        modelCode: 'HYM-MAT',
        tagline: '缎面哑光系列 · 低调奢华磨砂质感',
        highlights: ['细腻磨砂哑光视觉', '指纹与水渍不留痕', '保护原漆无需备案'],
        warrantyYears: 10,
        paramsConfirmed: true,
        specs: [
          { label: '基材工艺', value: '哑光缎面 TPU', confirmed: true },
          { label: '膜层厚度', value: '7.5 mil', confirmed: true },
          { label: '整车参考价', value: '¥12,800', confirmed: true },
        ],
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
        nameCn: '天窗冰甲 T1',
        nameEn: 'ROOF T1',
        modelCode: 'T1',
        tagline: '高清隔热基础版 · 兼顾透光与防爆降温',
        highlights: ['高清透光不压抑', '隔热率约 85%', '防高空坠物爆裂'],
        warrantyYears: 5,
        paramsConfirmed: true,
        specs: [
          { label: '膜层厚度', value: '2.0 mil', confirmed: true },
          { label: '综合隔热率', value: '85%', confirmed: true },
          { label: '天窗参考价', value: '¥5,000', confirmed: true },
        ],
      },
      {
        code: 't2',
        nameCn: '天窗冰甲 T2',
        nameEn: 'ROOF T2',
        modelCode: 'T2',
        tagline: '增强防护旗舰版 · 新能源超大天幕优选',
        highlights: ['加厚抗冲击基材', '隔热率高达 92%', '新能源全景天幕优化'],
        warrantyYears: 5,
        paramsConfirmed: true,
        specs: [
          { label: '膜层厚度', value: '3.0 mil', confirmed: true },
          { label: '综合隔热率', value: '92%', confirmed: true },
          { label: '天窗参考价', value: '¥5,000', confirmed: true },
        ],
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

// === 隐形车衣全系 8 款型号对比矩阵（与数据库及小程序产品表一致） ===
export interface PPFModelMatrixRow {
  name: string;
  modelCode: string;
  finish: '高光亮面' | '缎面哑光';
  substrate: string;
  thickness: string;
  feature: string;
  warrantyYears: number;
  retailPrice: string;
  badge?: string;
}

export const ppfModelMatrix: PPFModelMatrixRow[] = [
  {
    name: '和鼎 HD',
    modelCode: 'HD',
    finish: '高光亮面',
    substrate: '双聚碳酸酯旗舰基材',
    thickness: '7.5 mil',
    feature: '超耐水解抗黄变 · 典藏级镜面光泽',
    warrantyYears: 15,
    retailPrice: '¥21,800',
    badge: '15年殿堂旗舰',
  },
  {
    name: '和尊 HZ',
    modelCode: 'HZ',
    finish: '高光亮面',
    substrate: '聚碳酸酯增强涂层 TPU',
    thickness: '7.5 mil',
    feature: '超长耐候自修复 · 高清增亮',
    warrantyYears: 15,
    retailPrice: '¥16,800',
    badge: '15年超长质保',
  },
  {
    name: '和御 HY8',
    modelCode: 'HY8',
    finish: '高光亮面',
    substrate: '旗舰级脂肪族 TPU',
    thickness: '7.5 mil',
    feature: '顶级抗穿刺 · 秒级热修复涂层',
    warrantyYears: 10,
    retailPrice: '¥16,800',
    badge: '主推旗舰',
  },
  {
    name: '和旺 HW9',
    modelCode: 'HW9',
    finish: '高光亮面',
    substrate: '加厚高亮 TPU',
    thickness: '8.5 mil',
    feature: '加厚抗石击 · 持久镜面增亮',
    warrantyYears: 10,
    retailPrice: '¥15,800',
  },
  {
    name: '和旺 HW8',
    modelCode: 'HW8',
    finish: '高光亮面',
    substrate: '高密度脂肪族 TPU',
    thickness: '7.5 mil',
    feature: '荷叶疏水自洁 · 均衡全能防护',
    warrantyYears: 8,
    retailPrice: '¥14,800',
  },
  {
    name: '和雅 HYM',
    modelCode: 'YM-8',
    finish: '缎面哑光',
    substrate: '缎面磨砂 TPU',
    thickness: '7.5 mil',
    feature: '原厂级哑光质感 · 防指纹易打理',
    warrantyYears: 10,
    retailPrice: '¥12,800',
    badge: '哑光专享',
  },
  {
    name: '和兴 HX9',
    modelCode: 'HX9',
    finish: '高光亮面',
    substrate: '加厚增强涂层 TPU',
    thickness: '8.5 mil',
    feature: '8.5mil 加厚防刮 · 进阶耐黄变',
    warrantyYears: 7,
    retailPrice: '¥12,800',
  },
  {
    name: '和兴 HX8',
    modelCode: 'HX8',
    finish: '高光亮面',
    substrate: '光学级 TPU',
    thickness: '7.5 mil',
    feature: '日常防剐蹭 · 高性价比入门优选',
    warrantyYears: 6,
    retailPrice: '¥9,800',
  },
];

// === TPU 改色色板配置（与 3D 选色工坊首批 20 色同步） ===
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
