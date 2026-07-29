/**
 * 门店端 — 积分商城（双列 + 数量选择 + 结算）
 */
const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    loading: true,
    error: '',
    rewards: [],
    cart: {},             // { [rewardId]: quantity }
    cartTotal: 0,         // 总积分
    cartCount: 0,         // 商品种类数
    showCart: false,
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
      const items = (res.data.items || []).map(r => ({ ...r, qty: 0 }));
      this.setData({ rewards: items, myPoints: res.data.points || 0 });
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

  /** 增加数量 */
  incQty(e) {
    const { id } = e.currentTarget.dataset;
    const rewards = this.data.rewards;
    const idx = rewards.findIndex(r => r.id === id);
    if (idx < 0) return;
    const item = rewards[idx];
    if (item.stock > 0 && item.qty >= item.stock) {
      wx.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
    rewards[idx].qty = (rewards[idx].qty || 0) + 1;
    this.setData({ rewards }, () => this.updateCart());
  },

  /** 减少数量 */
  decQty(e) {
    const { id } = e.currentTarget.dataset;
    const rewards = this.data.rewards;
    const idx = rewards.findIndex(r => r.id === id);
    if (idx < 0) return;
    if (rewards[idx].qty <= 0) return;
    rewards[idx].qty -= 1;
    this.setData({ rewards }, () => this.updateCart());
  },

  /** 更新购物车汇总 */
  updateCart() {
    const rewards = this.data.rewards;
    let cartTotal = 0, cartCount = 0;
    const cart = {};
    rewards.forEach(r => {
      if (r.qty > 0) {
        cart[r.id] = r.qty;
        cartTotal += r.qty * (r.points_required || 0);
        cartCount++;
      }
    });
    this.setData({ cart, cartTotal, cartCount, showCart: cartCount > 0 });
  },

  /** 去结算 */
  goCheckout() {
    const rewards = this.data.rewards;
    const items = rewards.filter(r => r.qty > 0).map(r => ({
      id: r.id,
      name: r.name,
      image: r.coverPath || '',
      points: r.points_required || 0,
      qty: r.qty
    }));
    if (items.length === 0) { wx.showToast({ title: '请选择商品', icon: 'none' }); return; }
    const data = encodeURIComponent(JSON.stringify({ items, total: this.data.cartTotal }));
    wx.navigateTo({ url: `/pages/store/reward-checkout/index?data=${data}` });
  }
});
