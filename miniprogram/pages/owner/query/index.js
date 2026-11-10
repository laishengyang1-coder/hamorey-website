/**
 * 和膜 HAMOREY — 品牌首页
 * 车主 / 访客入口：品牌展示 + 功能入口
 */

// 占位注释：触发开发者工具重新编译（图片资源改动有时不被监听）
const auth = require('../../../utils/auth');
const api = require('../../../utils/api');

// 首页配置化数据（后续可接入 CMS 后台）
const HOME_CONFIG = {
  banners: [
    { image: '/images/banner/banner-summit-2027.jpg' },
    { image: '/images/banner/banner-brand.jpg' },
    { image: '/images/banner/banner-ppf.jpg' },
    { image: '/images/banner/banner-color.jpg' },
    { image: '/images/banner/banner-window.jpg' }
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
    brand: HOME_CONFIG.brand,
    version: 'v2.3.4'
  },

  onShow() {
    this.updateLoginStatus();
    this.loadBanners();
  },

  /**
   * 轮播图改为读后台配置（/api/public/banners），后台改完即时生效，不用发版。
   * 接口失败或后台一张都没配时，保留 HOME_CONFIG.banners 里的本地图兜底，
   * 保证首页永远不会出现空白轮播。
   */
  async loadBanners() {
    try {
      const res = await api.get('/public/banners', {}, { loading: false });
      if (!res.ok) return;
      const items = (res.data && res.data.items) || [];
      if (items.length === 0) return;
      this.setData({
        banners: items.map((b) => ({
          id: b.id,
          image: b.image_url || api.getPublicPhotoUrl(b.image_file_key),
          linkPage: b.link_page || ''
        }))
      });
    } catch (e) {
      // 静默失败，保留本地兜底图
    }
  },

  onBannerTap(e) {
    const link = e.currentTarget.dataset.link;
    if (link) wx.navigateTo({ url: link });
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
    wx.navigateTo({ url: '/pages/owner/brand/index' });
  },

  /** 授权门店 */
  goStores() {
    wx.navigateTo({ url: '/pages/owner/stores/index' });
  }
});
