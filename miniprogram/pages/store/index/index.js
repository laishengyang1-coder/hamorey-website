/**
 * 门店端 — 首页
 * 快捷入口：登记质保、记录、积分
 */

const auth = require('../../../utils/auth');
const api = require('../../../utils/api');

Page({
  data: {
    storeName: '',
    storeCity: '',
    stats: {
      recordCount: '—',
      codeCount: '—',
      points: '—'
    },
    nationalRanking: [],
    myRank: null
  },

  onShow() {
    // 检查登录
    const app = getApp();
    if (!app.checkLogin('store')) return;

    const userInfo = auth.getUserInfo();
    if (userInfo && userInfo.organization) {
      this.setData({
        storeName: userInfo.organization.name || '',
        storeCity: userInfo.organization.city || ''
      });
    }

    this.loadDashboard();
  },

  /**
   * 加载概览数据
   */
  async loadDashboard() {
    const [summary, rank] = await Promise.all([
      api.get('/store/dashboard', {}, { loading: false }),
      api.get('/store/dashboard', { type: 'national-points-ranking' }, { loading: false }),
    ]);
    if (summary.ok) {
      this.setData({ stats: {
        recordCount: summary.data.recordCount,
        codeCount: summary.data.codeCount,
        points: summary.data.availablePoints,
      } });
    }
    if (rank.ok) {
      this.setData({ nationalRanking: rank.data.ranking || [], myRank: rank.data.myRank || null });
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/owner/query/index' });
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/store/register/index' });
  },

  goFilmExchange() {
    wx.navigateTo({ url: '/pages/store/film-exchange/index' });
  },

  goRecords() {
    wx.switchTab({ url: '/pages/store/records/index' });
  },

  goCodes() {
    wx.switchTab({ url: '/pages/store/codes/index' });
  },

  goPoints() {
    wx.switchTab({ url: '/pages/store/points/index' });
  },

  goRewards() {
    wx.navigateTo({ url: '/pages/store/rewards/index' });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/store/orders/index' });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      confirmColor: '#5C1A1A',
      async success(res) {
        if (res.confirm) {
          await auth.logout();
          wx.reLaunch({ url: '/pages/owner/query/index' });
        }
      }
    });
  }
});
