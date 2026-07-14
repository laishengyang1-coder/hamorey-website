/**
 * 省代端 — 质保码库存
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

const STATUS_MAP = { in_stock: '可用', partial_used: '部分使用', exhausted: '已用完', frozen: '已冻结', voided: '已作废' };
const STATUS_TAG = { in_stock: 'tag-success', partial_used: 'tag-warning', exhausted: 'tag-info', frozen: 'tag-error', voided: 'tag-info' };

Page({
  data: {
    statusTabs: [{ label: '全部', value: '' }, { label: '可用', value: 'in_stock' }, { label: '已用完', value: 'exhausted' }],
    activeStatus: '', keyword: '', loading: true, loadingMore: false, error: '', codes: [],
    page: 1, pageSize: 20, hasMore: false
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadCodes();
  },

  async loadCodes() {
    this.setData({ loading: true, error: '', page: 1 });
    const params = { page: 1, pageSize: this.data.pageSize };
    if (this.data.activeStatus) params.status = this.data.activeStatus;
    if (this.data.keyword) params.keyword = this.data.keyword;
    const res = await api.get('/province/warranty-codes', params, { loading: false });
    if (!res.ok) { this.setData({ loading: false, error: res.message || '加载失败' }); return; }
    const items = res.data.items || [];
    this.setData({ loading: false, codes: items, hasMore: items.length < (res.data.total || 0), page: 1 });
  },

  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ loadingMore: true });
    const nextPage = this.data.page + 1;
    const params = { page: nextPage, pageSize: this.data.pageSize };
    if (this.data.activeStatus) params.status = this.data.activeStatus;
    if (this.data.keyword) params.keyword = this.data.keyword;
    const res = await api.get('/province/warranty-codes', params, { loading: false });
    this.setData({ loadingMore: false });
    if (res.ok) {
      const items = res.data.items || [];
      const codes = [...this.data.codes, ...items];
      this.setData({ codes, page: nextPage, hasMore: codes.length < (res.data.total || 0) });
    }
  },

  onKeywordInput(e) { this.setData({ keyword: e.detail.value }); },
  onSearch() { this.loadCodes(); },
  switchStatus(e) { this.setData({ activeStatus: e.currentTarget.dataset.value }, () => this.loadCodes()); },
  statusLabel(s) { return STATUS_MAP[s] || s; },
  statusTagClass(s) { return STATUS_TAG[s] || 'tag-info'; }
});
