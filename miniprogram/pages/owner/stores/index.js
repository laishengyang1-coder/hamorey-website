/**
 * 和膜 HAMOREY — 全国授权门店
 */
const api = require('../../../utils/api');

/**
 * 从地址中提取区级行政单位
 * e.g. "广州市天河区天河北路233号" → "天河"
 *      "深圳市南山区科技园"   → "南山"
 */
function extractDistrict(address) {
  if (!address) return '';
  // 匹配 XX区
  const m1 = address.match(/([\u4e00-\u9fff]+?)区/);
  if (m1) return m1[1];
  // 匹配 XX县
  const m2 = address.match(/([\u4e00-\u9fff]+?)县/);
  if (m2) return m2[1];
  // 匹配 XX市 (fallback)
  const m3 = address.match(/([\u4e00-\u9fff]+?)市/);
  if (m3) return m3[1];
  return '';
}

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

    // 拉取全部门店（不限制 pageSize）
    const res = await api.get('/stores', { pageSize: 999 }, { auth: false, loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const raw = (res.data && res.data.stores) ? res.data.stores : [];

    // 转换门店名称、去除电话
    const list = raw.map(s => ({
      ...s,
      display_name: '和膜 HAMOREY（' + (extractDistrict(s.address) || s.city || '授权') + '店）',
      phone: ''  // 不展示电话
    }));

    // 按省份分组
    const seen = {};
    const provinces = [];
    list.forEach(s => {
      const p = (s.province || '其他').trim();
      if (!seen[p]) { seen[p] = true; provinces.push(p); }
    });

    this.setData({ stores: list, provinces, activeProvince: '', loading: false });
  },

  filterProvince(e) {
    const p = e.currentTarget.dataset.province || '';
    this.setData({ activeProvince: this.data.activeProvince === p ? '' : p });
  },

  copyAddress(e) {
    const addr = e.currentTarget.dataset.address;
    if (!addr) return;
    wx.setClipboardData({
      data: addr,
      success: () => wx.showToast({ title: '地址已复制', icon: 'success' })
    });
  }
});
