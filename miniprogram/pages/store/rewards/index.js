/**
 * 门店端 — 积分商城商品列表
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    loading: true,
    error: '',
    rewards: []
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('store')) return;
    this.loadRewards();
  },

  async loadRewards() {
    this.setData({ loading: true, error: '' });
    const res = await api.get('/store/rewards', {}, { loading: false });
    this.setData({ loading: false });

    if (res.ok) {
      this.setData({ rewards: res.data.items || [] });
    } else {
      this.setData({ error: res.message || '加载失败' });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/store/reward-detail/index?id=${id}` });
  }
});
