const api = require('../../../utils/api');
const { pointsPage } = require('../../../utils/points-page');

Page({
  ...pointsPage('store', params => api.get('/store/points', params, { loading: false })),

  goRewards() {
    wx.navigateTo({ url: '/pages/store/rewards/index' });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/store/orders/index' });
  }
});
