/**
 * 和膜 HAMOREY — 全国授权门店
 */
const api = require('../../../utils/api');

const AUTH_LEVEL_MAP = {
  'HEBC': '品牌灯塔店',
  'HSS': '标准服务中心',
  'HSP': '优选施工点',
  'Service_Point': '授权服务点'
};

Page({
  data: {
    stores: [],
    provinces: [],
    activeProvince: '',
    loading: true,
    error: ''
  },

  onLoad() {
    this.fetchStores();
  },

  async fetchStores() {
    this.setData({ loading: true, error: '' });

    const res = await api.get('/stores', {}, { auth: false, loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const list = (res.data && res.data.stores) ? res.data.stores : [];
    // 构建省份列表（按出现顺序去重）
    const seen = {};
    const provinces = [];
    list.forEach(s => {
      const p = (s.province || '其他').trim();
      if (!seen[p]) { seen[p] = true; provinces.push(p); }
    });

    this.setData({
      stores: list,
      provinces,
      activeProvince: '',
      loading: false
    });
  },

  /** 省份筛选 */
  filterProvince(e) {
    const p = e.currentTarget.dataset.province || '';
    this.setData({
      activeProvince: this.data.activeProvince === p ? '' : p
    });
  },

  /** 拨打门店电话 */
  callStore(e) {
    const phone = e.currentTarget.dataset.phone;
    if (!phone) {
      wx.showToast({ title: '该门店暂无电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: phone });
  },

  /** 复制地址 */
  copyAddress(e) {
    const addr = e.currentTarget.dataset.address;
    if (!addr) return;
    wx.setClipboardData({
      data: addr,
      success: () => wx.showToast({ title: '地址已复制', icon: 'success' })
    });
  }
});
