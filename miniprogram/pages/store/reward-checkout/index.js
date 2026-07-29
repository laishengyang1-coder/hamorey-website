/**
 * 门店端 — 积分兑换确认页（含收货地址）
 */
const api = require('../../../utils/api');

Page({
  data: {
    items: [], total: 0, submitting: false,
    address: { name: '', phone: '', region: '', detail: '' }
  },

  onLoad(options) {
    try {
      const { items, total } = JSON.parse(decodeURIComponent(options.data || '{}'));
      this.setData({ items, total });
    } catch (_e) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
    }
  },

  onAddrChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ ['address.' + field]: e.detail.value });
  },

  validateAddr() {
    const { name, phone, region, detail } = this.data.address;
    if (!name.trim()) { wx.showToast({ title: '请填写收货人', icon: 'none' }); return false; }
    if (!/^1\d{10}$/.test(phone.trim())) { wx.showToast({ title: '手机号格式不正确', icon: 'none' }); return false; }
    if (!region.trim()) { wx.showToast({ title: '请填写所在地区', icon: 'none' }); return false; }
    if (!detail.trim()) { wx.showToast({ title: '请填写详细地址', icon: 'none' }); return false; }
    return true;
  },

  async submit() {
    if (!this.validateAddr()) return;
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    const items = this.data.items.map(i => ({ reward_id: i.id, quantity: i.qty }));
    const address = `${this.data.address.name},${this.data.address.phone},${this.data.address.region} ${this.data.address.detail}`;

    const res = await api.post('/store/redemptions', {
      items,
      shipping_address: address
    });

    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: '兑换申请已提交', icon: 'success' });
      setTimeout(() => wx.navigateBack({ delta: 2 }), 1500);
    } else {
      wx.showModal({ title: '兑换失败', content: res.message || '请稍后重试', showCancel: false });
    }
  }
});
