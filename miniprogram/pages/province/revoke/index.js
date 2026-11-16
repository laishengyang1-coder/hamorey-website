/**
 * 省代端 — 撤回质保码
 * 搜索本省代下属门店名下的质保码，勾选后把库存收回省代（不是删除，码仍然有效）
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    keyword: '',
    items: [],
    loading: false,
    searched: false,
    selectedIds: [],
    selectedCount: 0,
    submitting: false
  },

  onLoad() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.search();
  },

  onPullDownRefresh() {
    this.search().then(() => wx.stopPullDownRefresh());
  },

  onInput(e) {
    const value = e.detail.value;
    this.setData({ keyword: value });
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.search(), 250);
  },

  onClear() {
    this.setData({ keyword: '' });
    this.search();
  },

  /** 搜索下属门店名下可撤回的码 */
  async search() {
    this.setData({ loading: true });
    const params = { limit: 50 };
    const kw = (this.data.keyword || '').trim();
    if (kw) params.q = kw;

    const res = await api.get('/province/warranty-codes-revoke', params, { loading: false });
    const items = ((res.ok && res.data && res.data.items) || []).map((it) => ({
      ...it,
      checked: this.data.selectedIds.indexOf(it.id) >= 0
    }));
    this.setData({ items: items, loading: false, searched: true });
  },

  /** 勾选/取消单个 */
  toggle(e) {
    const id = e.currentTarget.dataset.id;
    let ids = this.data.selectedIds.slice();
    const idx = ids.indexOf(id);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(id);
    const items = this.data.items.map((it) => ({ ...it, checked: ids.indexOf(it.id) >= 0 }));
    this.setData({ selectedIds: ids, selectedCount: ids.length, items: items });
  },

  /** 全选/取消全选 */
  toggleAll() {
    if (this.data.selectedIds.length === this.data.items.length) {
      this.setData({ selectedIds: [], selectedCount: 0, items: this.data.items.map((it) => ({ ...it, checked: false })) });
      return;
    }
    const ids = this.data.items.map((it) => it.id);
    this.setData({ selectedIds: ids, selectedCount: ids.length, items: this.data.items.map((it) => ({ ...it, checked: true })) });
  },

  /** 提交撤回 */
  async handleRevoke() {
    const ids = this.data.selectedIds;
    if (ids.length === 0) {
      wx.showToast({ title: '请先勾选要撤回的码', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认撤回？',
      content: `将从下属门店收回 ${ids.length} 个质保码到省代库存。码不会被作废，之后仍可重新划给门店。`,
      confirmText: '撤回',
      confirmColor: '#5C1A1A',
      success: async (r) => {
        if (!r.confirm) return;
        this.setData({ submitting: true });
        const res = await api.post('/province/warranty-codes-revoke', { ids: ids }, { loading: true, loadingText: '撤回中...' });
        this.setData({ submitting: false });

        if (res.ok) {
          const n = (res.data && res.data.count) || ids.length;
          const skipped = (res.data && res.data.skipped) || [];
          wx.showToast({ title: `已撤回 ${n} 个`, icon: 'success' });
          if (skipped.length > 0) {
            setTimeout(() => {
              wx.showModal({ title: '部分未撤回', content: skipped.map((s) => `${s.code}：${s.reason}`).join('\n'), showCancel: false });
            }, 800);
          }
          this.setData({ selectedIds: [], selectedCount: 0 });
          this.search();
        } else {
          wx.showToast({ title: res.message || '撤回失败', icon: 'none' });
        }
      }
    });
  }
});
