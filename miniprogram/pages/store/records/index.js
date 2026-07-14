/**
 * 门店端 — 质保记录列表（状态筛选）
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

const STATUS_MAP = {
  pending: '待审核',
  active: '已通过',
  rejected: '已驳回',
  expired: '已过期'
};

const STATUS_TAG = {
  pending: 'tag-warning',
  active: 'tag-success',
  rejected: 'tag-error',
  expired: 'tag-info'
};

Page({
  data: {
    statusTabs: [
      { label: '全部', value: '' },
      { label: '待审核', value: 'pending' },
      { label: '已通过', value: 'active' },
      { label: '已驳回', value: 'rejected' }
    ],
    activeStatus: '',
    keyword: '',
    loading: true,
    loadingMore: false,
    error: '',
    records: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('store')) return;
    this.loadRecords();
  },

  /**
   * 加载记录
   */
  async loadRecords() {
    this.setData({ loading: true, error: '', page: 1 });

    const params = {
      page: 1,
      pageSize: this.data.pageSize
    };
    if (this.data.activeStatus) params.status = this.data.activeStatus;
    if (this.data.keyword) params.keyword = this.data.keyword;

    const res = await api.get('/store/warranty-records', params, { loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const items = res.data.items || [];
    const total = res.data.total || 0;

    this.setData({
      loading: false,
      records: items,
      total,
      hasMore: items.length < total,
      page: 1
    });
  },

  /**
   * 加载更多
   */
  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ loadingMore: true });

    const nextPage = this.data.page + 1;
    const params = {
      page: nextPage,
      pageSize: this.data.pageSize
    };
    if (this.data.activeStatus) params.status = this.data.activeStatus;
    if (this.data.keyword) params.keyword = this.data.keyword;

    const res = await api.get('/store/warranty-records', params, { loading: false });

    this.setData({ loadingMore: false });

    if (res.ok) {
      const items = res.data.items || [];
      const total = res.data.total || 0;
      const records = [...this.data.records, ...items];

      this.setData({
        records,
        total,
        page: nextPage,
        hasMore: records.length < total
      });
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadRecords();
  },

  switchStatus(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.value }, () => {
      this.loadRecords();
    });
  },

  statusLabel(status) {
    return STATUS_MAP[status] || status;
  },

  statusTagClass(status) {
    return STATUS_TAG[status] || 'tag-info';
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/store/edit/index?id=${id}` });
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/store/register/index' });
  }
});
