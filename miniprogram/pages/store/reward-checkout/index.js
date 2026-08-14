/**
 * 门店端 — 积分兑换确认页（选择收货地址 / 新增收货地址）
 * 地址使用后端 addresses 表模型（address_id），与总部审核链路一致
 */
const api = require('../../../utils/api');

Page({
  data: {
    items: [],
    total: 0,
    submitting: false,
    addresses: [],
    selectedAddressId: '',
    showAddrForm: false,
    savingAddr: false,
    newAddr: { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false }
  },

  async onLoad(options) {
    try {
      const { items, total } = JSON.parse(decodeURIComponent(options.data || '{}'));
      this.setData({ items, total });
    } catch (_e) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }
    await this.loadAddresses();
  },

  /** 加载本店收货地址 */
  async loadAddresses() {
    const res = await api.get('/store/addresses', {}, { loading: false });
    const addresses = (res.ok && res.data && res.data.items) ? res.data.items : [];
    this.setData({
      addresses,
      selectedAddressId: addresses.length ? (addresses.find((a) => a.is_default)?.id || addresses[0].id) : '',
      showAddrForm: addresses.length === 0
    });
  },

  /** 选择已有地址 */
  tapAddress(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ selectedAddressId: id });
  },

  /** 展开/收起新增地址表单 */
  toggleAddrForm() {
    this.setData({ showAddrForm: !this.data.showAddrForm });
  },

  /** 新增地址表单输入 */
  onAddrFormInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ ['newAddr.' + field]: e.detail.value });
  },

  onDefaultChange(e) {
    this.setData({ 'newAddr.isDefault': e.detail.value });
  },

  validateNewAddr() {
    const a = this.data.newAddr;
    if (!a.name.trim()) { wx.showToast({ title: '请填写收货人', icon: 'none' }); return false; }
    if (!/^1\d{10}$/.test(a.phone.trim())) { wx.showToast({ title: '手机号格式不正确', icon: 'none' }); return false; }
    if (!a.province.trim()) { wx.showToast({ title: '请填写省份', icon: 'none' }); return false; }
    if (!a.city.trim()) { wx.showToast({ title: '请填写城市', icon: 'none' }); return false; }
    if (!a.detail.trim()) { wx.showToast({ title: '请填写详细地址', icon: 'none' }); return false; }
    return true;
  },

  /** 保存新增收货地址 */
  async saveAddress() {
    if (this.data.savingAddr) return;
    if (!this.validateNewAddr()) return;
    this.setData({ savingAddr: true });

    const a = this.data.newAddr;
    const res = await api.post('/store/addresses', {
      recipient_name: a.name.trim(),
      phone: a.phone.trim(),
      province: a.province.trim(),
      city: a.city.trim(),
      district: a.district.trim() || undefined,
      detail_address: a.detail.trim(),
      is_default: a.isDefault
    });

    this.setData({ savingAddr: false });

    if (res.ok && res.data && res.data.id) {
      this.setData({ newAddr: { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false } });
      await this.loadAddresses();
      this.setData({ selectedAddressId: res.data.id, showAddrForm: false });
      wx.showToast({ title: '地址已保存', icon: 'success' });
    } else {
      wx.showModal({ title: '保存失败', content: res.message || '请稍后重试', showCancel: false });
    }
  },

  /** 提交兑换 */
  async submit() {
    if (!this.data.selectedAddressId) {
      wx.showToast({ title: '请选择或新增收货地址', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    const items = this.data.items.map(i => ({ reward_id: i.id, quantity: i.qty }));

    const res = await api.post('/store/redemptions', {
      items,
      address_id: this.data.selectedAddressId
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
