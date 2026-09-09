/**
 * 门店端 — 我的换膜申请列表（状态筛选）
 */

const api = require('../../../utils/api');

const STATUS_MAP = {
  pending: '待审核',
  approved: '待发货',
  shipped: '已发货',
  completed: '已完成',
  rejected: '已驳回'
};

const STATUS_TAG = {
  pending: 'tag-warning',
  approved: 'tag-primary',
  shipped: 'tag-info',
  completed: 'tag-success',
  rejected: 'tag-error'
};

const FILM_TYPE_MAP = {
  ppf: '车衣',
  window: '窗膜'
};

/** datetime → YYYY-MM-DD HH:mm */
function fmtDateTime(s) {
  if (!s) return '--';
  return String(s).replace('T', ' ').slice(0, 16);
}

/** 列表记录展示字段预处理 */
function fmtItem(r) {
  if (!r || typeof r !== 'object') return r;
  let compensateLabel = '';
  if (r.compensate_type === 'free') {
    compensateLabel = '免费补膜';
  } else if (r.compensate_type === 'charge') {
    compensateLabel = `收费补膜 ¥${r.charge_amount != null ? r.charge_amount : '--'}`;
  }
  return {
    ...r,
    status_label: STATUS_MAP[r.status] || r.status || '--',
    status_tag: STATUS_TAG[r.status] || 'tag-info',
    film_type_label: FILM_TYPE_MAP[r.film_type] || '',
    compensate_label: compensateLabel,
    created_at_text: fmtDateTime(r.created_at)
  };
}

Page({
  data: {
    statusTabs: [
      { label: '全部', value: '' },
      { label: '待审核', value: 'pending' },
      { label: '待发货', value: 'approved' },
      { label: '已发货', value: 'shipped' },
      { label: '已完成', value: 'completed' },
      { label: '已驳回', value: 'rejected' }
    ],
    activeStatus: '',
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
    this.loadList();
  },

  /**
   * 加载申请列表
   */
  async loadList() {
    this.setData({ loading: true, error: '', page: 1 });

    const params = {
      page: 1,
      pageSize: this.data.pageSize
    };
    if (this.data.activeStatus) params.status = this.data.activeStatus;

    const res = await api.get('/store/film-exchange', params, { loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const items = (res.data.items || []).map(fmtItem);
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

    const res = await api.get('/store/film-exchange', params, { loading: false });

    this.setData({ loadingMore: false });

    if (res.ok) {
      const items = (res.data.items || []).map(fmtItem);
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

  switchStatus(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.value }, () => {
      this.loadList();
    });
  },

  /**
   * 发起新的换膜申请
   */
  goApply() {
    wx.navigateTo({ url: '/pages/store/film-exchange/index' });
  }
});
