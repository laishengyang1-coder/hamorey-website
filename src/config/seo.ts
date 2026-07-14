// ============================================================
// 和膜 HAMOREY — 页面 SEO 元数据配置
// ============================================================

export interface SeoMeta {
  title: string;
  description: string;
  ogImage?: string;
  /** 是否禁止搜索引擎收录 */
  noindex?: boolean;
}

/** 默认 OG 图片 */
const DEFAULT_OG = '/og-default.jpg';

export const seoConfig: Record<string, SeoMeta> = {
  home: {
    title: '和膜 HAMOREY — 全车资产管家',
    description:
      '以产品、智能与服务，构建覆盖选膜、施工、质保与理赔的全车资产管理体系。和膜，不止于膜。',
    ogImage: DEFAULT_OG,
  },
  brand: {
    title: '品牌介绍 — 和膜 HAMOREY',
    description:
      '和膜是面向中国车主、保险公司和渠道伙伴的高端汽车膜品牌，以全车资产管家为定位，提供专业、品质、服务三位一体的品牌价值。',
    ogImage: DEFAULT_OG,
  },
  products: {
    title: '产品中心 — 和膜 HAMOREY',
    description:
      '和膜五大产品体系：窗膜、隐形车衣、TPU改色车衣、天窗冰甲、建筑家居膜，覆盖全车玻璃与漆面防护需求。',
    ogImage: DEFAULT_OG,
  },
  'products/window-film': {
    title: '窗膜 — 和膜 HAMOREY',
    description:
      '和膜窗膜五大系列：和光、和盾、和护、和真、和原，提供隔热、清晰、安全与紫外防护的长期平衡。',
    ogImage: DEFAULT_OG,
  },
  'products/ppf': {
    title: '隐形车衣 — 和膜 HAMOREY',
    description:
      '和膜隐形车衣四大系列：和御、和旺、和兴、和雅，守护原厂车漆与车辆残值，含13个理赔部位报价。',
    ogImage: DEFAULT_OG,
  },
  'products/color-ppf': {
    title: 'TPU改色车衣 — 和膜 HAMOREY',
    description:
      '和膜TPU改色车衣，个性表达与车漆保护同步完成，提供多种颜色与材质选择。',
    ogImage: DEFAULT_OG,
  },
  'products/sunroof-film': {
    title: '天窗冰甲 — 和膜 HAMOREY',
    description:
      '和膜天窗冰甲T系列，面向全景天窗与新能源车型的顶部防护，隔热降温、防爆安全。',
    ogImage: DEFAULT_OG,
  },
  'products/architectural-film': {
    title: '建筑家居膜 — 和膜 HAMOREY',
    description:
      '和膜建筑家居膜，将玻璃保护延伸到居住与商业空间，提供隔热、隐私、装饰和安全方向解决方案。',
    ogImage: DEFAULT_OG,
  },
  service: {
    title: '全车资产管家 — 和膜 HAMOREY',
    description:
      '和膜全车资产管家服务体系：四膜产品组合、授权施工、三码合一、电子质保、理赔报价与售后服务。',
    ogImage: DEFAULT_OG,
  },
  stores: {
    title: '授权门店 — 和膜 HAMOREY',
    description:
      '查找和膜授权门店，包括品牌灯塔店、标准服务中心和区域服务点，获取正规施工服务。',
    ogImage: DEFAULT_OG,
  },
  partner: {
    title: '百店计划 — 和膜 HAMOREY',
    description:
      '和膜百店计划，诚邀省代和门店合作伙伴。以产品体系、数字质保、品牌物料和门店服务工具，支持区域伙伴建立长期经营能力。',
    ogImage: DEFAULT_OG,
  },
  warranty: {
    title: '电子质保查询 — 和膜 HAMOREY',
    description:
      '输入手机号、车牌号、VIN或质保码，查询和膜电子质保证书。系统自动识别输入类型，按车辆展示已生效质保。',
    ogImage: DEFAULT_OG,
    noindex: true,
  },
  'warranty/terms': {
    title: '质保条款 — 和膜 HAMOREY',
    description: '和膜电子质保条款与责任说明。',
    ogImage: DEFAULT_OG,
  },
  contact: {
    title: '合作咨询 — 和膜 HAMOREY',
    description: '和膜招商与业务合作咨询入口，提交您的合作意向，我们将尽快与您联系。',
    ogImage: DEFAULT_OG,
  },
  privacy: {
    title: '隐私政策 — 和膜 HAMOREY',
    description: '和膜 HAMOREY 隐私政策，说明个人信息使用和查询规则。',
    ogImage: DEFAULT_OG,
  },
  '404': {
    title: '页面未找到 — 和膜 HAMOREY',
    description: '您访问的页面不存在，请返回首页继续浏览。',
    ogImage: DEFAULT_OG,
    noindex: true,
  },
};

/** 根据路由 key 获取 SEO 配置 */
export function getSeoMeta(routeKey: string): SeoMeta {
  return seoConfig[routeKey] ?? seoConfig.home;
}
