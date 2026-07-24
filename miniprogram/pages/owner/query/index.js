/**
 * 和膜 HAMOREY — 品牌首页
 * 车主 / 访客入口：品牌展示 + 功能入口
 */

const auth = require('../../../utils/auth');

// 首页配置化数据（后续可接入 CMS 后台）
const HOME_CONFIG = {
  banners: [
    {
      image: '/images/home-bg.jpg',
      title: '和膜 HAMOREY',
      subtitle: '高端汽车膜 · 守护每一程',
      tag: '品牌旗舰'
    },
    {
      image: '/images/home-bg-1.jpg',
      title: '隐形车衣',
      subtitle: '漆面保护膜 · 自愈抗污',
      tag: 'PPF'
    },
    {
      image: '/images/home-bg-2.jpg',
      title: 'TPU 改色膜',
      subtitle: '色彩随心 · 保护随行',
      tag: 'COLOR'
    },
    {
      image: '/images/home-bg-3.jpg',
      title: '全车窗膜',
      subtitle: '隔热防晒 · 清晰视野',
      tag: 'WINDOW'
    }
  ],
  functions: [
    {
      key: 'warranty',
      title: '质保查询',
      subtitle: 'Warranty Inquiry',
      icon: '/images/icon-warranty.png',
      iconBg: 'var(--color-primary)',
      page: '/pages/owner/warranty/index'
    },
    {
      key: 'login',
      title: '经销商登录',
      subtitle: 'Dealer Login',
      icon: '/images/icon-login.png',
      iconBg: '#1A1412',
      page: '/pages/store/login/index'
    },
    {
      key: 'terms',
      title: '质保范围查询',
      subtitle: 'Warranty Coverage',
      icon: '/images/icon-terms.png',
      iconBg: '#7A2E2E',
      page: '/pages/owner/warranty-terms/index'
    },
    {
      key: 'quote',
      title: '产品体系 / 报价',
      subtitle: 'Product & Quote',
      icon: '/images/icon-quote.png',
      iconBg: '#C8A96E',
      page: '/pages/owner/quote/index'
    }
  ],
  cases: [
    {
      image: '/images/home-bg-1.jpg',
      title: ' Porsche 911 全车 PPF',
      desc: '极致亮度 · 持久守护'
    },
    {
      image: '/images/home-bg-2.jpg',
      title: 'BMW M4 TPU 改色',
      desc: '电光金属 · 个性定制'
    },
    {
      image: '/images/home-bg-3.jpg',
      title: 'Mercedes 全车窗膜',
      desc: '高隔热 · 低反光'
    }
  ],
  productSeries: [
    {
      key: 'window',
      title: '窗膜',
      subtitle: 'WINDOW FILM',
      desc: '隔热·防晒·隐私',
      image: '/images/home-bg-3.jpg',
      icon: '🪟'
    },
    {
      key: 'ppf',
      title: '隐形车衣',
      subtitle: 'PAINT PROTECTION',
      desc: '抗划痕·自修复',
      image: '/images/home-bg-1.jpg',
      icon: '🛡️'
    },
    {
      key: 'color',
      title: 'TPU 改色膜',
      subtitle: 'COLOR WRAP',
      desc: '色彩·保护·耐久',
      image: '/images/home-bg-2.jpg',
      icon: '🎨'
    },
    {
      key: 'roof',
      title: '天窗冰甲',
      subtitle: 'ROOF ARMOR',
      desc: '降温·防爆·隔热',
      image: '/images/home-bg.jpg',
      icon: '❄️'
    }
  ],
  brand: {
    title: '和膜 HAMOREY',
    subtitle: 'BRAND INTRODUCTION',
    image: '/images/logo.png',
    paragraphs: [
      '和膜 HAMOREY 专注高端汽车膜解决方案，产品涵盖隐形车衣、TPU 改色膜、全车窗膜、天窗冰甲等系列。',
      '我们致力于以领先的材料科技与严谨的施工标准，为每一位车主带来持久的漆面保护与驾乘体验升级。'
    ]
  }
};

Page({
  data: {
    isLoggedIn: false,
    roleText: '',
    banners: HOME_CONFIG.banners,
    functions: HOME_CONFIG.functions,
    cases: HOME_CONFIG.cases,
    productSeries: HOME_CONFIG.productSeries,
    brand: HOME_CONFIG.brand
  },

  onShow() {
    this.updateLoginStatus();
  },

  updateLoginStatus() {
    const loggedIn = auth.isLoggedIn();
    const role = auth.getRole();
    let roleText = '';
    if (role === 'STORE') roleText = '门店';
    else if (role === 'PROVINCE') roleText = '省代';
    else if (role === 'HQ_ADMIN') roleText = '总部';
    this.setData({ isLoggedIn: loggedIn, roleText });
  },

  /** 功能入口点击 */
  onFunctionTap(e) {
    const { page } = e.currentTarget.dataset;
    if (!page) return;
    wx.navigateTo({ url: page });
  },

  /** 案例/产品卡片点击 */
  onCaseTap(e) {
    const { index } = e.currentTarget.dataset;
    wx.showToast({ title: '案例详情即将上线', icon: 'none' });
  },

  onSeriesTap(e) {
    const { key } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/owner/product/index?series=' + key });
  },

  /** 品牌介绍 / 关于 */
  goBrandIntro() {
    wx.showToast({ title: '品牌故事即将上线', icon: 'none' });
  },

  /** 授权门店 */
  goStores() {
    wx.navigateTo({ url: '/pages/owner/stores/index' });
  }
});
