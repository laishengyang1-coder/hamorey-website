/**
 * 省代端 — 登录页
 */

const auth = require('../../../utils/auth');

Page({
  data: {
    username: '',
    password: '',
    submitting: false
  },

  onLoad() {
    const app = getApp();
    // 已登录（本地 token 仍有效）则直接进入后台，跳过输入账号密码
    if (app && app.globalData && app.globalData.isLoggedIn) {
      const role = (app.globalData.role || '').toUpperCase();
      wx.switchTab({
        url: role === 'PROVINCE' ? '/pages/province/index/index' : '/pages/store/index/index'
      });
    }
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  async handleLogin() {
    const { username, password } = this.data;
    if (!username.trim()) { wx.showToast({ title: '请输入用户名', icon: 'none' }); return; }
    if (!password) { wx.showToast({ title: '请输入密码', icon: 'none' }); return; }

    this.setData({ submitting: true });
    const res = await auth.login(username.trim(), password);
    this.setData({ submitting: false });

    if (!res.ok) { wx.showToast({ title: res.message || '登录失败', icon: 'none' }); return; }

    // 后端返回角色为大写：PROVINCE / STORE / HQ_ADMIN（与 DB、网页端一致）
    const role = (res.data.role || '').toUpperCase();
    if (role === 'PROVINCE') {
      wx.switchTab({ url: '/pages/province/index/index' });
    } else if (role === 'STORE') {
      wx.switchTab({ url: '/pages/store/index/index' });
    } else if (role === 'HQ_ADMIN') {
      wx.showToast({ title: '总部管理请使用网页后台', icon: 'none' });
      wx.navigateTo({ url: '/pages/owner/profile/index' });
    } else {
      wx.showToast({ title: '未知角色类型', icon: 'none' });
    }
  },

  goStoreLogin() {
    wx.navigateTo({ url: '/pages/store/login/index' });
  }
});
