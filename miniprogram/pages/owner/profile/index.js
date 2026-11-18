/**
 * 和膜 HAMOREY — 我的（车主 / 访客个人中心）
 */

const auth = require('../../../utils/auth');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    role: '',
    roleText: '',
    menuItems: [
      { key: 'warranty', title: '质保查询', icon: '🔍', page: '/pages/owner/warranty/index' },
      { key: 'quote', title: '理赔报价', icon: '💎', page: '/pages/owner/quote/index' },
      { key: 'terms', title: '质保条款', icon: '📄', page: '/pages/owner/warranty-terms/index' },
      { key: 'store', title: '授权门店', icon: '🏪', page: '/pages/owner/stores/index' },
      { key: 'about', title: '关于和膜', icon: '🏷️', page: '/pages/owner/brand/index' }
    ]
  },

  onShow() {
    this.updateProfile();
  },

  updateProfile() {
    const loggedIn = auth.isLoggedIn();
    const info = auth.getUserInfo();
    const role = auth.getRole();
    let roleText = '';
    if (role === 'STORE') roleText = '门店';
    else if (role === 'PROVINCE') roleText = '省代';
    else if (role === 'HQ_ADMIN') roleText = '总部';

    this.setData({
      isLoggedIn: loggedIn,
      userInfo: info,
      role,
      roleText
    });
  },

  onMenuTap(e) {
    const { key, page } = e.currentTarget.dataset;
    if (!page) return;
    wx.navigateTo({ url: page });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/store/login/index' });
  },

  async doLogout() {
    const res = await wx.showModal({
      title: '确认退出',
      content: '退出后将无法使用门店/省代功能',
      confirmColor: '#5C1A1A'
    });
    if (res.confirm) {
      await auth.logout();
      this.updateProfile();
      wx.showToast({ title: '已退出登录', icon: 'none' });
    }
  }
});
