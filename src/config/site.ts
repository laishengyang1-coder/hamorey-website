// ============================================================
// 和膜 HAMOREY — 站点全局配置
// ============================================================

export const siteConfig = {
  /** 品牌中文名 */
  brandName: '和膜',
  /** 品牌英文名 */
  brandNameEn: 'HAMOREY',
  /** 品牌口号 */
  slogan: '和膜，不止于膜',
  /** 品牌定位 */
  positioning: '高端汽车膜品牌 · 全车资产管家',
  /** 品牌描述 */
  description:
    '以产品、智能与服务，构建覆盖选膜、施工、质保与理赔的全车资产管理体系。',
  /** 正式域名 */
  domain: 'hemoppf.com',
  /** 站点 URL */
  siteUrl: 'https://hemoppf.com',
  /** ICP 备案号（占位） */
  icpNumber: '粤ICP备XXXXXXXX号',
  /** 联系方式 */
  contact: {
    phone: '',
    email: 'anhui@heheppf.com',
    address: '上海市宝山区真陈路1018号和和新材',
    businessHours: '周一至周五 09:00-18:00',
  },
  /** 页尾行动区文案 */
  cta: {
    title: '共你我，和天下',
    description: '选择和膜，选择全车资产的长期守护。',
    links: [
      { label: '产品咨询', href: '/contact' },
      { label: '申请合作', href: '/partner' },
      { label: '查询质保', href: '/warranty' },
    ],
  },
  /** 社交媒体（占位） */
  social: {
    wechat: '和膜',
    weibo: '',
    douyin: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
