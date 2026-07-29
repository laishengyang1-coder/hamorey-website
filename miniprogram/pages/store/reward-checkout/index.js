/**
 * 门店端 — 积分兑换确认页
 */
const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    items: [],
    total: 0,
    submitting: false
  },

  onLoad(options) {
    try {
      const { items, total } = JSON.parse(decodeURIComponent(options.data || '{}'));
      this.setData({ items, total });
    } catch (e) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
    }
  },

  async submit() {
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    const items = this.data.items.map(i => ({
      reward_id: i.id,
      quantity: i.qty
    }));

    const res = await api.post('/store/redemptions', { items });
    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: '兑换成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ delta: 2 });
      }, 1500);
    } else {
      wx.showModal({
        title: '兑换失败',
        content: res.message || '请稍后重试',
        showCancel: false
      });
    }
  }
});
