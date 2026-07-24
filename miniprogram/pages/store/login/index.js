/**
 * 门店端 — 登录页
 */

const auth = require('../../../utils/auth');

Page({
  data: {
    username: '',
    password: '',
    submitting: false
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  /**
   * 执行登录
   */
  async handleLogin() {
    const { username, password } = this.data;

    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const res = await auth.login(username.trim(), password);

    this.setData({ submitting: false });

    if (!res.ok) {
      wx.showToast({ title: res.message || '登录失败', icon: 'none' });
      return;
    }

    // 根据角色跳转（后端返回角色为大写：STORE / PROVINCE / HQ_ADMIN）
    const role = (res.data.role || '').toUpperCase();
    if (role === 'STORE') {
      wx.switchTab({ url: '/pages/store/index/index' });
    } else if (role === 'PROVINCE') {
      wx.switchTab({ url: '/pages/province/index/index' });
    } else if (role === 'HQ_ADMIN') {
      wx.showToast({ title: '总部管理请使用网页后台', icon: 'none' });
      wx.navigateTo({ url: '/pages/owner/profile/index' });
    } else {
      wx.showToast({ title: '未知角色类型', icon: 'none' });
    }
  },

  /**
   * 跳转省代登录
   */
  goProvinceLogin() {
    wx.navigateTo({ url: '/pages/province/login/index' });
  }
});
