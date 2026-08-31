// ============================================================
// 和膜 HAMOREY — 营销物料中心配置
// 静态配置：分类 + 物料条目，供官网 /marketing 页面渲染
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
    description: '品牌 VI 基础元素：Logo、色板、字体、VI 手册，供门店与渠道规范使用。',
    icon: 'Palette',
    materials: [
      {
        id: 'vi-logo-primary',
        name: '和膜 Logo（主标识）',
        format: 'png',
        size: '512 KB',
        updatedAt: '2026-07-20',
        downloadUrl: '/marketing/brand-visual/logo-primary.png',
        previewUrl: '/marketing/brand-visual/logo-primary.png',
        description: '品牌主 Logo，透明底，适用于白色背景。',
        tags: ['Logo', 'VI'],
      },
      {
        id: 'vi-logo-negative',
        name: '和膜 Logo（反白版）',
        format: 'png',
        size: '512 KB',
        updatedAt: '2026-07-20',
        downloadUrl: '/marketing/brand-visual/logo-negative.png',
        previewUrl: '/marketing/brand-visual/logo-negative.png',
        description: '品牌主 Logo 反白版，适用于深色背景。',
        tags: ['Logo', 'VI'],
      },
      {
        id: 'vi-logo-ai',
        name: '和膜 Logo（矢量源文件）',
        format: 'ai',
        size: '1.2 MB',
        updatedAt: '2026-07-20',
        downloadUrl: '/marketing/brand-visual/logo-primary.ai',
        description: 'Logo 矢量源文件（AI），用于印刷与高精度制作。',
        tags: ['Logo', '矢量源文件'],
      },
      {
        id: 'vi-color-palette',
        name: '品牌色板',
        format: 'png',
        size: '180 KB',
        updatedAt: '2026-07-20',
        downloadUrl: '/marketing/brand-visual/color-palette.png',
        previewUrl: '/marketing/brand-visual/color-palette.png',
        description: '和膜品牌色板，含主色、辅色与使用比例。',
        tags: ['色彩', 'VI'],
      },
      {
        id: 'vi-font-guide',
        name: '品牌字体规范',
        format: 'pdf',
        size: '890 KB',
        updatedAt: '2026-07-20',
        downloadUrl: '/marketing/brand-visual/font-guide.pdf',
        description: '品牌字体使用规范，包含中英文字体与行距规则。',
        tags: ['字体', 'VI'],
      },
      {
        id: 'vi-manual',
        name: '品牌 VI 手册（完整版）',
        format: 'pdf',
        size: '18 MB',
        updatedAt: '2026-07-20',
        downloadUrl: '/marketing/brand-visual/vi-manual.pdf',
        description: '完整品牌 VI 手册，涵盖 Logo、色彩、字体、应用规范。',
        tags: ['VI', '手册'],
      },
    ],
  },
  {
    id: 'poster',
    name: '海报',
    nameEn: 'Poster',
    description: '品牌海报与新品上市海报，用于门店展示与线上传播。',
    icon: 'Image',
    materials: [
      {
        id: 'poster-new-ppf',
        name: '新品上市海报 - 隐形车衣',
        format: 'jpg',
        size: '3.2 MB',
        updatedAt: '2026-07-22',
        downloadUrl: '/marketing/poster/new-ppf.jpg',
        previewUrl: '/marketing/poster/new-ppf.jpg',
        description: '和盟明星产品隐形车衣上市海报，竖版，适合门店贴展示。',
        tags: ['新品', '车衣'],
      },
      {
        id: 'poster-promo-summer',
        name: '夏季促销海报 - 天窗冰甲',
        format: 'jpg',
        size: '2.8 MB',
        updatedAt: '2026-07-22',
        downloadUrl: '/marketing/poster/promo-sunroof.jpg',
        previewUrl: '/marketing/poster/promo-sunroof.jpg',
        description: '夏季天窗冰甲促销海报，突出隔热降温卖点。',
        tags: ['促销', '天窗冰甲'],
      },
      {
        id: 'poster-festival-oct',
        name: '国庆节点海报',
        format: 'png',
        size: '4.1 MB',
        updatedAt: '2026-08-01',
        downloadUrl: '/marketing/poster/festival-oct.png',
        previewUrl: '/marketing/poster/festival-oct.png',
        description: '国庆出行安全主题海报，适合节日节点传播。',
        tags: ['节气', '节点'],
      },
      {
        id: 'poster-brand-main',
        name: '品牌主视觉海报',
        format: 'jpg',
        size: '5.5 MB',
        updatedAt: '2026-07-20',
        downloadUrl: '/marketing/poster/brand-main.jpg',
        previewUrl: '/marketing/poster/brand-main.jpg',
        description: '品牌主视觉海报，展示全车资产管理理念。',
        tags: ['品牌', '主视觉'],
      },
    ],
  },
  {
    id: 'product-materials',
    name: '产品物料',
    nameEn: 'Product Materials',
    description: '各产品系列的单页、参数表与解决方案，用于客户介绍与销售支持。',
    icon: 'Film',
    materials: [
      {
        id: 'prod-window-film',
        name: '窗膜产品单页',
        format: 'pdf',
        size: '1.6 MB',
        updatedAt: '2026-07-25',
        downloadUrl: '/marketing/product/window-film.pdf',
        description: '窗膜五大系列（和光/和盾/和护/和真/和原）产品单页。',
        tags: ['窗膜', '单页'],
      },
      {
        id: 'prod-ppf',
        name: '隐形车衣产品单页',
        format: 'pdf',
        size: '1.8 MB',
        updatedAt: '2026-07-25',
        downloadUrl: '/marketing/product/ppf.pdf',
        description: '隐形车衣四大系列（和御/和旺/和兴/和雅）产品单页。',
        tags: ['车衣', '单页'],
      },
      {
        id: 'prod-color-ppf',
        name: 'TPU 改色车衣产品单页',
        format: 'pdf',
        size: '1.4 MB',
        updatedAt: '2026-07-25',
        downloadUrl: '/marketing/product/color-ppf.pdf',
        description: 'TPU 改色车衣产品单页，含色彩方案与保护特性。',
        tags: ['改色车衣', '单页'],
      },
      {
        id: 'prod-sunroof-film',
        name: '天窗冰甲产品单页',
        format: 'pdf',
        size: '1.2 MB',
        updatedAt: '2026-07-25',
        downloadUrl: '/marketing/product/sunroof-film.pdf',
        description: '天窗冰甲 T 系列产品单页。',
        tags: ['天窗冰甲', '单页'],
      },
      {
        id: 'prod-architectural',
        name: '建筑家居膜产品单页',
        format: 'pdf',
        size: '1.1 MB',
        updatedAt: '2026-07-25',
        downloadUrl: '/marketing/product/architectural.pdf',
        description: '建筑家居膜产品单页，覆盖居住与商业空间。',
        tags: ['建筑膜', '单页'],
      },
      {
        id: 'prod-comparison',
        name: '产品参数对比表',
        format: 'xlsx',
        size: '240 KB',
        updatedAt: '2026-07-25',
        downloadUrl: '/marketing/product/comparison.xlsx',
        description: '全产品线参数对比表，含透光率、隔热率、质保年限等。',
        tags: ['参数', '对比表'],
      },
    ],
  },
  {
    id: 'store-materials',
    name: '门店物料',
    nameEn: 'Store Materials',
    description: '门店展示与形象物料：门头、展架、台卡、样册、授权牌。',
    icon: 'Store',
    materials: [
      {
        id: 'store-signage-front',
        name: '门店门头灯箱设计稿',
        format: 'ai',
        size: '24 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/store/signage-front.ai',
        description: '门店门头灯箱矢量设计稿，含标准色与灯箱规格。',
        tags: ['门头', '展示'],
      },
      {
        id: 'store-display-stand',
        name: '门店产品展架设计稿',
        format: 'ai',
        size: '16 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/store/display-stand.ai',
        description: '门店产品展架矢量设计稿，展示窗膜与车衣样片。',
        tags: ['展架', '展示'],
      },
      {
        id: 'store-counter-card',
        name: '台卡 / 立牌设计稿',
        format: 'zip',
        size: '8.5 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/store/counter-card.zip',
        description: '前台台卡与立牌设计稿打包，含多尺寸源文件。',
        tags: ['台卡', '展示'],
      },
      {
        id: 'store-sample-book',
        name: '产品样册（电子版）',
        format: 'pdf',
        size: '12 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/store/sample-book.pdf',
        description: '门店茶点样册电子版，含全产品系列介绍。',
        tags: ['样册', '展示'],
      },
      {
        id: 'store-auth-plate',
        name: '授权门店牌匾设计',
        format: 'zip',
        size: '6.2 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/store/auth-plate.zip',
        description: '授权门店牌匾设计稿，含标准尺寸与制作说明。',
        tags: ['授权牌', '展示'],
      },
    ],
  },
  {
    id: 'video-materials',
    name: '视频素材',
    nameEn: 'Video Materials',
    description: '品牌 TVC、产品实测、施工过程与培训视频。',
    icon: 'Video',
    materials: [
      {
        id: 'video-brand-tvc',
        name: '品牌形象 TVC',
        format: 'mp4',
        size: '120 MB',
        updatedAt: '2026-07-30',
        downloadUrl: '/marketing/video/brand-tvc.mp4',
        description: '品牌形象 TVC，60 秒，适用于门店大屏与线上投放。',
        tags: ['TVC', '品牌'],
      },
      {
        id: 'video-test-heat',
        name: '隔热实测对比视频',
        format: 'mp4',
        size: '85 MB',
        updatedAt: '2026-07-30',
        downloadUrl: '/marketing/video/test-heat.mp4',
        description: '窗膜隔热实测对比视频，展示温升数据。',
        tags: ['实测', '窗膜'],
      },
      {
        id: 'video-install-process',
        name: '施工工艺过程视频',
        format: 'mp4',
        size: '150 MB',
        updatedAt: '2026-07-30',
        downloadUrl: '/marketing/video/install-process.mp4',
        description: '隐形车衣标准施工工艺全过程视频。',
        tags: ['施工', '车衣'],
      },
      {
        id: 'video-training-basic',
        name: '新手培训视频（基础）',
        format: 'mp4',
        size: '210 MB',
        updatedAt: '2026-07-30',
        downloadUrl: '/marketing/video/training-basic.mp4',
        description: '门店销售与施工基础培训视频，含产品知识。',
        tags: ['培训', '门店'],
      },
    ],
  },
  {
    id: 'sales-tools',
    name: '销售工具',
    nameEn: 'Sales Tools',
    description: '报价单模板、产品对比、销售话术与合作资料，助力一线销售。',
    icon: 'Briefcase',
    materials: [
      {
        id: 'tool-quote-template',
        name: '报价单模板',
        format: 'docx',
        size: '220 KB',
        updatedAt: '2026-07-29',
        downloadUrl: '/marketing/sales/quote-template.docx',
        description: '门店报价单模板，含窗膜与车衣标准报价位预留。',
        tags: ['报价', '模板'],
      },
      {
        id: 'tool-sell-talk',
        name: '销售话术 / FAQ',
        format: 'docx',
        size: '380 KB',
        updatedAt: '2026-07-29',
        downloadUrl: '/marketing/sales/sell-talk.docx',
        description: '销售话术与常见问题解答 FAQ 文档。',
        tags: ['话术', 'FAQ'],
      },
      {
        id: 'tool-contract-template',
        name: '施工合同模板',
        format: 'docx',
        size: '260 KB',
        updatedAt: '2026-07-29',
        downloadUrl: '/marketing/sales/contract-template.docx',
        description: '门店施工合同模板，含质保条款引用。',
        tags: ['合同', '模板'],
      },
      {
        id: 'tool-risk-comparison',
        name: '车衣 vs 改色 对比图表',
        format: 'png',
        size: '1.2 MB',
        updatedAt: '2026-07-29',
        downloadUrl: '/marketing/sales/risk-comparison.png',
        previewUrl: '/marketing/sales/risk-comparison.png',
        description: '隐形车衣与改色车衣的对比图表，用于客户讲解。',
        tags: ['对比', '销售'],
      },
    ],
  },
  {
    id: 'training-materials',
    name: '培训资料',
    nameEn: 'Training Materials',
    description: '施工工艺、产品知识、销售培训课件，用于门店员工能力建设。',
    icon: 'GraduationCap',
    materials: [
      {
        id: 'training-install-master',
        name: '施工工艺标准手册',
        format: 'pdf',
        size: '9.8 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/training/install-manual.pdf',
        description: '窗膜与车衣标准施工工艺手册，含验收标准。',
        tags: ['施工', '手册'],
      },
      {
        id: 'training-product-slides',
        name: '产品知识培训课件',
        format: 'pptx',
        size: '22 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/training/product-slides.pptx',
        description: '全产品线知识培训课件，用于门店培训。',
        tags: ['培训', '课件'],
      },
      {
        id: 'training-sales-slides',
        name: '销售技巧培训课件',
        format: 'pptx',
        size: '18 MB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/training/sales-slides.pptx',
        description: '门店销售技巧与客户沟通培训课件。',
        tags: ['培训', '销售'],
      },
      {
        id: 'training-faq-quiz',
        name: '产品知识自测题库',
        format: 'xlsx',
        size: '320 KB',
        updatedAt: '2026-07-28',
        downloadUrl: '/marketing/training/faq-quiz.xlsx',
        description: '产品知识自测题库，用于门店考核。',
        tags: ['自测', '产品知识'],
      },
    ],
  },
  {
    id: 'certificates',
    name: '证书与资质',
    nameEn: 'Certificates',
    description: '产品检测报告、认证证书与备案信息，供渠道与消费者核验。',
    icon: 'Award',
    materials: [
      {
        id: 'cert-test-report',
        name: '产品检测报告',
        format: 'pdf',
        size: '14 MB',
        updatedAt: '2026-07-26',
        downloadUrl: '/marketing/certificate/test-report.pdf',
        description: '产品全项检测报告，含透光率、隔热率、强度等指标。',
        tags: ['检测', '报告'],
      },
      {
        id: 'cert-qc-cert',
        name: '质量认证证书',
        format: 'pdf',
        size: '2.1 MB',
        updatedAt: '2026-07-26',
        downloadUrl: '/marketing/certificate/qc-cert.pdf',
        description: '质量体系认证证书，展示品牌品控能力。',
        tags: ['认证', '资质'],
      },
      {
        id: 'cert-icp',
        name: 'ICP 备案信息',
        format: 'png',
        size: '360 KB',
        updatedAt: '2026-07-26',
        downloadUrl: '/marketing/certificate/icp.png',
        previewUrl: '/marketing/certificate/icp.png',
        description: '网站 ICP 备案截图，供官网与门店核验。',
        tags: ['备案', '资质'],
      },
      {
        id: 'cert-materials-safe',
        name: '原材料环保检测报告',
        format: 'pdf',
        size: '6.5 MB',
        updatedAt: '2026-07-26',
        downloadUrl: '/marketing/certificate/material-safe.pdf',
        description: '原材料环保检测报告，展示产品环保属性。',
        tags: ['检测', '环保'],
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
