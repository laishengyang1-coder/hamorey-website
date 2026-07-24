/**
 * 和膜 HAMOREY — 品牌首页
 * 车主 / 访客入口：品牌展示 + 功能入口
 */

const auth = require('../../../utils/auth');

// 首页配置化数据（后续可接入 CMS 后台）
const HOME_CONFIG = {
  banners: [
    {
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg.jpg',
      title: '和膜 HAMOREY',
      subtitle: '高端汽车膜 · 守护每一程',
      tag: '品牌旗舰'
    },
    {
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-1.jpg',
      title: '隐形车衣',
      subtitle: '漆面保护膜 · 自愈抗污',
      tag: 'PPF'
    },
    {
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-2.jpg',
      title: 'TPU 改色膜',
      subtitle: '色彩随心 · 保护随行',
      tag: 'COLOR'
    },
    {
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-3.jpg',
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
      icon: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/icon-warranty.png',
      page: '/pages/owner/warranty/index'
    },
    {
      key: 'login',
      title: '经销商登录',
      subtitle: 'Dealer Login',
      icon: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/icon-login.png',
      page: '/pages/store/login/index'
    },
    {
      key: 'terms',
      title: '质保范围',
      subtitle: 'Warranty Coverage',
      icon: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/icon-terms.png',
      page: '/pages/owner/warranty-terms/index'
    },
    {
      key: 'quote',
      title: '理赔报价',
      subtitle: 'Claim Quote',
      icon: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/icon-quote.png',
      page: '/pages/owner/quote/index'
    }
  ],
  cases: [
    {
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/cases/color-ppf/10001.jpg',
      title: 'TPU 改色 · 电光金属灰',
      desc: '质感出众 · 个性定制'
    },
    {
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/cases/color-ppf/10005.jpg',
      title: 'TPU 改色 · 液态金属银',
      desc: '色彩饱满 · 保护随行'
    },
    {
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/cases/color-ppf/10010.jpg',
      title: 'TPU 改色 · 哑光战斗灰',
      desc: '高级哑光 · 耐久如新'
    }
  ],
  productSeries: [
    {
      key: 'window',
      title: '窗膜',
      subtitle: 'WINDOW FILM',
      desc: '隔热·防晒·隐私',
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-window.png'
    },
    {
      key: 'ppf',
      title: '隐形车衣',
      subtitle: 'PAINT PROTECTION',
      desc: '抗划痕·自修复',
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-ppf.png'
    },
    {
      key: 'color',
      title: 'TPU 改色膜',
      subtitle: 'COLOR WRAP',
      desc: '色彩·保护·耐久',
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-color.png'
    },
    {
      key: 'roof',
      title: '天窗冰甲',
      subtitle: 'ROOF ARMOR',
      desc: '降温·防爆·隔热',
      image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-sunroof.png'
    }
  ],
  brand: {
    title: '和膜 HAMOREY',
    subtitle: 'BRAND INTRODUCTION',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/logo.png',
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
    wx.navigateTo({ url: '/pages/owner/cases/index' });
  },

  /** 案例库入口 */
  goCases() {
    wx.navigateTo({ url: '/pages/owner/cases/index' });
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
