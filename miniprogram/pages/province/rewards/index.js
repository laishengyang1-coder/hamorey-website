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
    if (!app.checkLogin('province')) return;
    this.loadRewards();
    this.loadPoints();
  },

  async loadRewards() {
    this.setData({ loading: true, error: '' });
    const res = await api.get('/province/rewards', {}, { loading: false });
    this.setData({ loading: false });

    if (res.ok) {
      const items = (res.data.items || []).map(r => ({
        ...r,
        qty: 0,
        fallbackCoverUrl: api.getPublicPhotoUrl(r.cover_file_key),
        coverUrl: r.cover_url || api.getPublicPhotoUrl(r.cover_file_key),
        usingFallbackCover: !r.cover_url,
        imageFailed: false
      }));
      this.setData({ rewards: items });
    } else {
      this.setData({ error: res.message || '加载失败' });
    }
  },

  handleImageError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.rewards[index];
    if (!item || item.imageFailed) return;

    if (!item.usingFallbackCover && item.fallbackCoverUrl) {
      this.setData({
        [`rewards[${index}].coverUrl`]: item.fallbackCoverUrl,
        [`rewards[${index}].usingFallbackCover`]: true
      });
      return;
    }
    this.setData({ [`rewards[${index}].imageFailed`]: true });
  },

  /** 单独读取门店积分 */
  async loadPoints() {
    const res = await api.get('/province/points', {}, { loading: false });
    if (res.ok) {
      this.setData({ myPoints: res.data.available || 0 });
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
      id: r.id, name: r.name, image: r.coverUrl || '',
      points: r.points_required || 0, qty: r.qty
    }));
    if (items.length === 0) { wx.showToast({ title: '请选择商品', icon: 'none' }); return; }
    const data = encodeURIComponent(JSON.stringify({ items, total: this.data.cartTotal }));
    wx.navigateTo({ url: `/pages/province/reward-checkout/index?data=${data}` });
  }
});
