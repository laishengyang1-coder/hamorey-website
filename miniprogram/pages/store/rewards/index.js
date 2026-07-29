/**
 * 门店端 — 积分商城
 */
const api = require('../../../utils/api');

Page({
  data: {
    loading: true, error: '', rewards: [],
    cartTotal: 0, cartCount: 0, showCart: false,
    myPoints: 0
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
      const items = (res.data.items || []).map(r => ({ ...r, qty: 0, coverPath: '' }));
      this.setData({ rewards: items, myPoints: res.data.points || 0 });
      // 异步下载封面图（带认证头）
      items.forEach(async (item, i) => {
        if (item.cover_file_key) {
          const img = await api.downloadProtectedPhoto(item.cover_file_key);
          if (img.ok) this.setData({ [`rewards[${i}].coverPath`]: img.data.tempFilePath });
        }
      });
    } else {
      this.setData({ error: res.message || '加载失败' });
    }
  },

  incQty(e) {
    const { id } = e.currentTarget.dataset;
    const rewards = this.data.rewards;
    const idx = rewards.findIndex(r => r.id === id);
    if (idx < 0) return;
    const item = rewards[idx];
    if (item.stock_quantity > 0 && item.qty >= item.stock_quantity) {
      wx.showToast({ title: '库存不足', icon: 'none' }); return;
    }
    rewards[idx].qty = (rewards[idx].qty || 0) + 1;
    this.setData({ rewards }, () => this.updateCart());
  },

  decQty(e) {
    const { id } = e.currentTarget.dataset;
    const rewards = this.data.rewards;
    const idx = rewards.findIndex(r => r.id === id);
    if (idx < 0 || rewards[idx].qty <= 0) return;
    rewards[idx].qty -= 1;
    this.setData({ rewards }, () => this.updateCart());
  },

  updateCart() {
    const rewards = this.data.rewards;
    let cartTotal = 0, cartCount = 0;
    rewards.forEach(r => {
      if (r.qty > 0) { cartTotal += r.qty * (r.points_required || 0); cartCount++; }
    });
    this.setData({ cartTotal, cartCount, showCart: cartCount > 0 });
  },

  goCheckout() {
    const rewards = this.data.rewards;
    const items = rewards.filter(r => r.qty > 0).map(r => ({
      id: r.id, name: r.name, image: r.coverPath || '',
      points: r.points_required || 0, qty: r.qty
    }));
    if (items.length === 0) { wx.showToast({ title: '请选择商品', icon: 'none' }); return; }
    const data = encodeURIComponent(JSON.stringify({ items, total: this.data.cartTotal }));
    wx.navigateTo({ url: `/pages/store/reward-checkout/index?data=${data}` });
  }
});
