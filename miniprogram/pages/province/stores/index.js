/**
 * 省代端 — 下属门店列表
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    loading: true,
    error: '',
    stores: []
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadStores();
  },

  async loadStores() {
    this.setData({ loading: true, error: '' });
    const res = await api.get('/province/organizations', {}, { loading: false });
    this.setData({ loading: false });

    if (res.ok) {
      this.setData({ stores: res.data.items || [] });
    } else {
      this.setData({ error: res.message || '加载失败' });
    }
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/province/store-form/index?id=${id}` });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/province/store-form/index' });
  }
});
