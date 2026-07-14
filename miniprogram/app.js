/**
 * 和膜 HAMOREY 质保系统 — 微信小程序全局入口
 */

App({
  /**
   * 小程序启动时触发
   */
  onLaunch() {
    // 检查登录态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    this.globalData.token = token || null;
    this.globalData.userInfo = userInfo || null;
    this.globalData.isLoggedIn = !!(token && userInfo);

    // 如果已登录，验证 token 有效性
    if (this.globalData.isLoggedIn && userInfo) {
      this.globalData.role = userInfo.role || '';
    }

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    this.globalData.safeAreaBottom = systemInfo.safeArea
      ? systemInfo.screenHeight - systemInfo.safeArea.bottom
      : 0;
  },

  /**
   * 全局数据
   */
  globalData: {
    /** API 基础地址 */
    apiBaseUrl: 'https://hemoppf.com/api',
    /** 登录 token */
    token: null,
    /** 用户信息 */
    userInfo: null,
    /** 是否已登录 */
    isLoggedIn: false,
    /** 用户角色（store / province / admin） */
    role: '',
    /** 系统信息 */
    systemInfo: null,
    /** 状态栏高度 */
    statusBarHeight: 0,
    /** 底部安全区域高度 */
    safeAreaBottom: 0
  },

  /**
   * 检查登录状态，未登录则跳转登录页
   * @param {string} role 期望的角色（store / province）
   * @returns {boolean} 是否已登录且角色匹配
   */
  checkLogin(role) {
    if (!this.globalData.isLoggedIn) {
      const loginPage = role === 'province'
        ? '/pages/province/login/index'
        : '/pages/store/login/index';
      wx.redirectTo({ url: loginPage });
      return false;
    }
    if (role && this.globalData.role !== role) {
      wx.showToast({ title: '权限不足', icon: 'none' });
      return false;
    }
    return true;
  },

  /**
   * 设置登录状态
   * @param {string} token
   * @param {Object} userInfo
   */
  setLoginState(token, userInfo) {
    this.globalData.token = token;
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    this.globalData.role = userInfo.role || '';
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
  },

  /**
   * 清除登录状态
   */
  clearLoginState() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.role = '';
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  }
});
