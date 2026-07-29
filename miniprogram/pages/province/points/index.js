const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const LEDGER_LABELS = { award: '奖励积分', adjust: '积分调整', release: '解冻积分', deduct: '扣除积分', revoke: '撤销积分', freeze: '冻结积分', redemption: '兑换商品' };

Page({
  data: { points: { available: 0, frozen: 0 }, ledger: [], loading: true },
  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadPoints();
  },
  async loadPoints() {
    this.setData({ loading: true });
    const res = await api.get('/province/points', {}, { loading: false });
    this.setData({ loading: false });
    if (res.ok) { this.setData({ points: { available: res.data.available || 0, frozen: res.data.frozen || 0 }, ledger: res.data.ledger || [] }); }
  },
  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso.replace('Z', ''));
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${dd} ${hh}:${mm}`;
  },
  ledgerLabel(type) { return LEDGER_LABELS[type] || type || '积分变动'; },
  goRewards() { wx.navigateTo({ url: '/pages/province/rewards/index' }); },
  goOrders() { wx.navigateTo({ url: '/pages/province/rewards/index' }); }
});
