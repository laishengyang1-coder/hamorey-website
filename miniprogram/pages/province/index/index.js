/**
 * 省代端 — 首页（数据概览卡片）
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    provinceName: '',
    loading: true,
    dashboard: {
      storeCount: 0, codeCount: 0, recordCount: 0,
      pendingCount: 0, todayRecords: 0, availablePoints: 0, frozenPoints: 0
    },
    storeRanking: [],
    productRanking: []
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;

    const userInfo = auth.getUserInfo();
    if (userInfo && userInfo.organization) {
      this.setData({ provinceName: userInfo.organization.name || '' });
    }
    this.loadDashboard();
  },

  async loadDashboard() {
    this.setData({ loading: true });
    try {
      const [summary, storeRank, productRank] = await Promise.all([
        api.get('/province/dashboard', {}, { loading: false }),
        api.get('/province/dashboard', { type: 'store-ranking' }, { loading: false }),
        api.get('/province/dashboard', { type: 'product-ranking' }, { loading: false }),
      ]);
      if (summary.ok) this.setData({ dashboard: summary.data });
      if (storeRank.ok) this.setData({ storeRanking: storeRank.data || [] });
      if (productRank.ok) this.setData({ productRanking: productRank.data || [] });
    } catch (e) {
      // 单点失败不阻塞整体展示
    } finally {
      this.setData({ loading: false });
    }
  },

  goStores() { wx.switchTab({ url: '/pages/province/stores/index' }); },
  goCodes() { wx.switchTab({ url: '/pages/province/codes/index' }); },
  goPoints() { wx.switchTab({ url: '/pages/province/points/index' }); },
  goAllocate() { wx.navigateTo({ url: '/pages/province/allocate/index' }); },
  goRewards() { wx.navigateTo({ url: '/pages/province/rewards/index' }); },

  handleLogout() {
    wx.showModal({
      title: '提示', content: '确定退出登录吗？', confirmColor: '#5C1A1A',
      success(res) {
        if (res.confirm) { auth.logout(); wx.reLaunch({ url: '/pages/owner/query/index' }); }
      }
    });
  }
});
