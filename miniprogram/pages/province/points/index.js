const api = require('../../../utils/api');
const { pointsPage } = require('../../../utils/points-page');

Page({
  ...pointsPage('province', params => api.get('/province/points', params, { loading: false })),

  goRewards() { wx.navigateTo({ url: '/pages/province/rewards/index' }); },
  goOrders() { wx.navigateTo({ url: '/pages/store/orders/index?scope=province' }); }
});
