/**
 * 门店端 — 兑换记录
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

const STATUS_MAP = { pending: '待审核', approved: '已通过', rejected: '已驳回', shipped: '已发货', completed: '已完成' };
const STATUS_TAG = { pending: 'tag-warning', approved: 'tag-success', rejected: 'tag-error', shipped: 'tag-info', completed: 'tag-success' };

Page({
  data: {
    statusTabs: [
      { label: '全部', value: '' },
      { label: '待审核', value: 'pending' },
      { label: '已通过', value: 'approved' },
      { label: '已发货', value: 'shipped' }
    ],
    activeStatus: '',
    loading: true,
    orders: []
  },

  onLoad(options) {
    // 门店与省代共用兑换记录页：?scope=province 时读取省代接口
    this.scope = options && options.scope === 'province' ? 'province' : 'store';
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin(this.scope || 'store')) return;
    this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true });
    const params = {};
    if (this.data.activeStatus) params.status = this.data.activeStatus;

    const res = await api.get(`/${this.scope || 'store'}/redemptions`, params, { loading: false });
    this.setData({ loading: false });

    if (res.ok) {
      const items = (res.data.items || []).map(item => {
        // Parse items_json if present
        let parsedItems = Array.isArray(item.items) ? item.items : [];
        if (!parsedItems.length && item.items_json) {
          try {
            parsedItems = JSON.parse(item.items_json);
          } catch (e) {
            parsedItems = [];
          }
        }
        return { ...item, items: parsedItems };
      });
      this.setData({ orders: items });
    }
  },

  switchStatus(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.value }, () => this.loadOrders());
  },

  statusLabel(s) { return STATUS_MAP[s] || s; },
  statusTagClass(s) { return STATUS_TAG[s] || 'tag-info'; }
});
