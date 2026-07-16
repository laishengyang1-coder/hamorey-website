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
      recordCount: 0,
      codeCount: 0,
      points: 0
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
    try {
      // 获取记录数
      const recordsRes = await api.get('/store/warranty-records', { pageSize: 1 }, { loading: false });
      // 获取质保码数
      const codesRes = await api.get('/store/warranty-codes', { pageSize: 1, status: 'in_stock' }, { loading: false });
      // 获取积分
      const pointsRes = await api.get('/store/points', {}, { loading: false });
      // 获取全国积分排行
      const rankRes = await api.get('/store/dashboard', { type: 'national-points-ranking' }, { loading: false });

      const stats = {
        recordCount: recordsRes.ok ? (recordsRes.data.total || 0) : 0,
        codeCount: codesRes.ok ? (codesRes.data.total || 0) : 0,
        points: pointsRes.ok ? (pointsRes.data.available || 0) : 0
      };

      const ranking = rankRes.ok ? (rankRes.data.ranking || []) : [];
      const myRank = rankRes.ok ? (rankRes.data.myRank || null) : null;

      this.setData({ stats, nationalRanking: ranking, myRank });
    } catch (e) {
      // 静默处理
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/store/register/index' });
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
