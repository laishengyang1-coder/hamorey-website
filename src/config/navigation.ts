// ============================================================
// 和膜 HAMOREY — 导航菜单配置
// ============================================================

export interface NavItem {
  label: string;
  href: string;
  /** 是否使用品牌红强调色 */
  highlight?: boolean;
  /** 子菜单（产品体系下拉） */
  children?: NavChild[];
}

export interface NavChild {
  label: string;
  href: string;
  description?: string;
}

export const navItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '品牌', href: '/brand' },
  {
    label: '产品体系',
    href: '/products',
    children: [
      { label: '窗膜', href: '/products/window-film', description: '隔热、清晰与舒适的长期平衡' },
      { label: '隐形车衣', href: '/products/ppf', description: '守护原厂车漆与车辆残值' },
      { label: 'TPU改色车衣', href: '/products/color-ppf', description: '个性表达与车漆保护同步完成' },
      { label: '天窗冰甲', href: '/products/sunroof-film', description: '全景天窗与新能源顶部防护' },
      { label: '建筑家居膜', href: '/products/architectural-film', description: '将玻璃保护延伸到居住与商业空间' },
    ],
  },
  { label: '全车资产管家', href: '/service' },
  { label: '授权门店', href: '/stores' },
  { label: '百店计划', href: '/partner' },
  { label: '电子质保', href: '/warranty', highlight: true },
];

/** 页尾链接分组 */
export const footerNavGroups = [
  {
    title: '产品体系',
    links: [
      { label: '窗膜', href: '/products/window-film' },
      { label: '隐形车衣', href: '/products/ppf' },
      { label: 'TPU改色车衣', href: '/products/color-ppf' },
      { label: '天窗冰甲', href: '/products/sunroof-film' },
      { label: '建筑家居膜', href: '/products/architectural-film' },
    ],
  },
  {
    title: '品牌与服务',
    links: [
      { label: '品牌介绍', href: '/brand' },
      { label: '全车资产管家', href: '/service' },
      { label: '授权门店', href: '/stores' },
      { label: '百店计划', href: '/partner' },
    ],
  },
  {
    title: '质保与条款',
    links: [
      { label: '电子质保查询', href: '/warranty' },
      { label: '质保条款', href: '/warranty/terms' },
      { label: '隐私政策', href: '/privacy' },
      { label: '合作咨询', href: '/contact' },
      { label: '后台登录', href: '/login' },
    ],
  },
] as const;
