/**
 * 省代端 — 单店质保码明细
 * 入参：store_id（门店 id）
 * 数据源：GET /api/province/store-inventory?store_id=xxx
 */
const api = require('../../../utils/api');

const STATUS_MAP = {
  in_stock: '可用',
  partial_used: '部分使用',
  exhausted: '已用完',
  frozen: '已冻结',
  voided: '已作废'
};
const STATUS_TAG = {
  in_stock: 'tag-success',
  partial_used: 'tag-warning',
  exhausted: 'tag-info',
  frozen: 'tag-error',
  voided: 'tag-info'
};

Page({
  data: {
    storeId: '',
    storeName: '门店质保码',
    loading: true,
    error: '',
    summary: { total: 0, in_stock: 0, partial_used: 0, exhausted: 0, available: 0 },
    codes: []
  },

  onLoad(query) {
    const storeId = (query && query.store_id) || '';
    // name 只用于首屏标题，最终以接口返回的门店名为准
    let name = '';
    if (query && query.name) {
      try { name = decodeURIComponent(query.name); } catch (e) { name = query.name; }
    }
    this.setData({ storeId, storeName: name || '门店质保码' });

    if (!storeId) {
      this.setData({ loading: false, error: '缺少门店参数' });
      return;
    }
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true, error: '' });
    const res = await api.get(
      '/province/store-inventory',
      { store_id: this.data.storeId, pageSize: 500 },
      { loading: false }
    );
    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }
    const data = res.data || {};
    const store = data.store || {};
    this.setData({
      loading: false,
      storeName: store.name || this.data.storeName,
      summary: data.summary || { total: 0, in_stock: 0, partial_used: 0, exhausted: 0, available: 0 },
      codes: data.items || []
    });
    if (store.name) {
      wx.setNavigationBarTitle({ title: store.name });
    }
  },

  statusLabel(s) { return STATUS_MAP[s] || s; },
  statusTagClass(s) { return STATUS_TAG[s] || 'tag-info'; },

  onPullDownRefresh() {
    this.loadDetail().then(() => wx.stopPullDownRefresh());
  }
});
