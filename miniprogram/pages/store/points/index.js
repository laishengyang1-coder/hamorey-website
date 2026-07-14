/**
 * 门店端 — 积分 + 流水
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

const LEDGER_LABELS = {
  award: '奖励积分', adjust: '积分调整', release: '解冻积分',
  deduct: '扣除积分', revoke: '撤销积分', freeze: '冻结积分', redemption: '兑换商品'
};

Page({
  data: {
    points: { available: 0, frozen: 0 },
    ledger: [],
    loading: true
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('store')) return;
    this.loadPoints();
  },

  async loadPoints() {
    this.setData({ loading: true });
    const res = await api.get('/store/points', {}, { loading: false });
    this.setData({ loading: false });

    if (res.ok) {
      this.setData({
        points: {
          available: res.data.available || 0,
          frozen: res.data.frozen || 0
        },
        ledger: res.data.items || []
      });
    }
  },

  ledgerLabel(type, desc) {
    if (desc && desc.length < 20) return desc;
    return LEDGER_LABELS[type] || type || '积分变动';
  },

  goRewards() {
    wx.navigateTo({ url: '/pages/store/rewards/index' });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/store/orders/index' });
  }
});
