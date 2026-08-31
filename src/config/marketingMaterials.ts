// ============================================================
// 和膜 HAMOREY — 营销物料中心配置
// 静态配置：分类 + 物料条目，供官网 /marketing 页面渲染
// 当前仅收录已上传实体文件的物料，其余待素材齐全后逐步开放。
// ============================================================

/** 物料文件类型 */
export type MaterialFormat = 'png' | 'jpg' | 'pdf' | 'zip' | 'ai' | 'psd' | 'mp4' | 'docx' | 'xlsx' | 'pptx' | 'svg' | 'webp';

/** 物料条目 */
export interface MaterialItem {
  /** 唯一 ID */
  id: string;
  /** 物料名称 */
  name: string;
  /** 文件格式 */
  format: MaterialFormat;
  /** 文件大小（描述，如 "2.4 MB"） */
  size?: string;
  /** 更新时间（YYYY-MM-DD） */
  updatedAt: string;
  /** 下载地址 */
  downloadUrl: string;
  /** 预览地址（可为空） */
  previewUrl?: string;
  /** 仅供内部使用（不显示下载，仅展示标记） */
  internalOnly?: boolean;
  /** 物料说明 */
  description?: string;
  /** 标签 */
  tags?: string[];
}

/** 物料分类 */
export interface MaterialCategory {
  /** 分类 ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** 分类英文名 */
  nameEn: string;
  /** 分类说明 */
  description: string;
  /** 分类图标（lucide 图标名） */
  icon: string;
  /** 分类下物料 */
  materials: MaterialItem[];
}

/** 全部营销物料分类 */
export const marketingCategories: MaterialCategory[] = [
  {
    id: 'brand-visual',
    name: '品牌视觉',
    nameEn: 'Brand Visual',
    description: '品牌 VI 基础元素：Logo 源文件与公司介绍，供门店、经销与渠道伙伴规范使用。',
    icon: 'Palette',
    materials: [
      {
        id: 'vi-logo-primary',
        name: '和膜 Logo（主标识）',
        format: 'png',
        size: '583 KB',
        updatedAt: '2026-08-31',
        downloadUrl: '/marketing/brand-visual/logo-primary.png',
        previewUrl: '/marketing/brand-visual/logo-primary.png',
        description: '品牌主 Logo（黑色版），适用于白色 / 浅色背景。',
        tags: ['Logo', 'VI'],
      },
      {
        id: 'vi-logo-negative',
        name: '和膜 Logo（反白版）',
        format: 'png',
        size: '120 KB',
        updatedAt: '2026-08-31',
        downloadUrl: '/marketing/brand-visual/logo-negative.png',
        previewUrl: '/marketing/brand-visual/logo-negative.png',
        description: '品牌主 Logo 反白版（白色），适用于深色背景。',
        tags: ['Logo', 'VI'],
      },
      {
        id: 'vi-company-intro',
        name: '和膜公司介绍',
        format: 'pdf',
        size: '9.5 MB',
        updatedAt: '2026-08-28',
        downloadUrl: '/marketing/brand-visual/vi-manual.pdf',
        description: '和膜 / 安徽和和新材料公司介绍，含品牌背景、产地、产品线与品控体系。',
        tags: ['公司介绍', '品牌'],
      },
    ],
  },
  {
    id: 'product-materials',
    name: '产品物料',
    nameEn: 'Product Materials',
    description: '各产品系列价目表，用于客户介绍与门店销售报价参考。',
    icon: 'Film',
    materials: [
      {
        id: 'prod-window-price',
        name: '窗膜价目表',
        format: 'png',
        size: '958 KB',
        updatedAt: '2026-08-31',
        downloadUrl: '/marketing/product/window-film-price.png',
        previewUrl: '/marketing/product/window-film-price.png',
        description: '窗膜全系列价目表，含各系列型号、规格与指导价。',
        tags: ['窗膜', '价目表'],
      },
      {
        id: 'prod-ppf-price',
        name: '隐形车衣价目表',
        format: 'jpg',
        size: '222 KB',
        updatedAt: '2026-08-31',
        downloadUrl: '/marketing/product/ppf-price.jpg',
        previewUrl: '/marketing/product/ppf-price.jpg',
        description: '隐形车衣全系列价目表，含各系列型号、规格与指导价。',
        tags: ['车衣', '价目表'],
      },
    ],
  },
];

/** 全部物料总数 */
export const marketingTotalCount = marketingCategories.reduce(
  (sum, cat) => sum + cat.materials.length,
  0,
);

/** 按 ID 查找分类 */
export function getMarketingCategory(id: string): MaterialCategory | undefined {
  return marketingCategories.find((cat) => cat.id === id);
}
