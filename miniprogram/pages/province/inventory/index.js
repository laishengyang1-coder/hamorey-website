/**
 * 省代端 — 门店库存（下属门店的质保码库存概览）
 * 数据源：GET /api/province/store-inventory
 */
const api = require('../../../utils/api');

Page({
  data: {
    loading: true,
    error: '',
    stores: [],
    summary: { store_count: 0, total: 0, available: 0, exhausted: 0 }
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, error: '' });
    const res = await api.get('/province/store-inventory', {}, { loading: false });
    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }
    const data = res.data || {};
    this.setData({
      loading: false,
      stores: data.stores || [],
      summary: data.summary || { store_count: 0, total: 0, available: 0, exhausted: 0 }
    });
  },

  openStore(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/province/store-codes/index?store_id=${encodeURIComponent(id)}&name=${encodeURIComponent(name || '')}`
    });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  }
});
