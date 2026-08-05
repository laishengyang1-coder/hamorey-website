/**
 * 省代端 — 划拨质保码给门店
 * 支持分页加载（后端单页上限 100 条），跨页保留选择状态
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

const PAGE_SIZE = 100;

Page({
  data: {
    stores: [],
    storeNames: [],
    selectedStoreIndex: -1,
    selectedStoreId: '',
    availableCodes: [],
    loadingCodes: true,
    loadingMore: false,
    page: 1,
    hasMore: false,
    totalCodes: 0,
    keyword: '',
    submitting: false,
    allCodesSelected: false,
    selectedCodes: [],
    selectedIds: {},
    selectedCount: 0
  },

  onUnload() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadStores();
    this.loadCodes(true);
  },

  async loadStores() {
    const res = await api.get('/province/organizations', {}, { loading: false });
    if (res.ok) {
      const stores = res.data.items || [];
      this.setData({
        stores,
        storeNames: stores.map(s => s.name || s.code || '--')
      });
    }
  },

  /**
   * 加载质保码
   * @param {boolean} reset true=从第一页重新加载；false=加载下一页追加
   */
  async loadCodes(reset) {
    if (reset) {
      this.setData({ page: 1, availableCodes: [], hasMore: false, totalCodes: 0, allCodesSelected: false, selectedCodes: [] });
    }
    const nextPage = reset ? 1 : this.data.page + 1;
    this.setData(reset ? { loadingCodes: true } : { loadingMore: true });

    const params = { status: 'in_stock', page: nextPage, pageSize: PAGE_SIZE };
    if (this.data.keyword) params.keyword = this.data.keyword;
    const res = await api.get('/province/warranty-codes', params, { loading: false });

    if (res.ok) {
      const items = res.data.items || [];
      const total = res.data.total || items.length;
      const selectedIds = this.data.selectedIds;
      // 追加时从已选集合恢复勾选状态
      const newCodes = items.map(c => ({ ...c, checked: !!selectedIds[c.id] }));
      const existing = reset ? [] : this.data.availableCodes;
      const merged = existing.concat(newCodes);

      this.setData({
        availableCodes: merged,
        page: nextPage,
        totalCodes: total,
        hasMore: merged.length < total,
        allCodesSelected: merged.length > 0 && merged.every(c => c.checked),
        selectedCodes: merged.filter(c => selectedIds[c.id]),
        selectedCount: Object.keys(selectedIds).length
      });
    }
    this.setData({ loadingCodes: false, loadingMore: false });
  },

  /** 关键字输入（防抖 400ms 后重新搜索） */
  onKeywordInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.loadCodes(true), 400);
  },

  /** 清空搜索关键字 */
  clearKeyword() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this.setData({ keyword: '' });
    this.loadCodes(true);
  },

  /** 滚动到底部自动加载更多 */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore && !this.data.loadingCodes) {
      this.loadCodes(false);
    }
  },

  /** 点击"加载更多"按钮 */
  loadMore() {
    if (this.data.hasMore && !this.data.loadingMore && !this.data.loadingCodes) {
      this.loadCodes(false);
    }
  },

  onStoreChange(e) {
    const idx = Number(e.detail.value);
    const store = this.data.stores[idx];
    this.setData({
      selectedStoreIndex: idx,
      selectedStoreId: store ? store.id : ''
    });
  },

  toggleCode(e) {
    const idx = e.currentTarget.dataset.index;
    const codes = this.data.availableCodes.slice();
    const item = codes[idx];
    if (!item) return;
    const selectedIds = { ...this.data.selectedIds };
    if (item.checked) {
      delete selectedIds[item.id];
    } else {
      selectedIds[item.id] = true;
    }
    codes[idx] = { ...item, checked: !item.checked };
    this.setData({
      availableCodes: codes,
      selectedIds,
      allCodesSelected: codes.length > 0 && codes.every(c => c.checked),
      selectedCodes: codes.filter(c => selectedIds[c.id]),
      selectedCount: Object.keys(selectedIds).length
    });
  },

  toggleAllCodes() {
    const allSelected = !this.data.allCodesSelected;
    const codes = this.data.availableCodes.map(c => ({ ...c, checked: allSelected }));
    const selectedIds = { ...this.data.selectedIds };
    if (allSelected) {
      codes.forEach(c => { selectedIds[c.id] = true; });
    } else {
      codes.forEach(c => { delete selectedIds[c.id]; });
    }
    this.setData({
      availableCodes: codes,
      allCodesSelected: allSelected,
      selectedIds,
      selectedCodes: codes.filter(c => c.checked),
      selectedCount: Object.keys(selectedIds).length
    });
  },

  async handleAllocate() {
    if (this.data.selectedStoreIndex < 0) {
      wx.showToast({ title: '请选择目标门店', icon: 'none' }); return;
    }

    const codeIds = Object.keys(this.data.selectedIds);

    if (codeIds.length === 0) {
      wx.showToast({ title: '请选择质保码', icon: 'none' }); return;
    }

    this.setData({ submitting: true });

    const res = await api.post('/province/warranty-codes/allocate', {
      code_ids: codeIds,
      to_store_id: this.data.selectedStoreId
    }, { loading: true, loadingText: '划拨中...' });

    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: '划拨成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } else {
      wx.showToast({ title: res.message || '划拨失败', icon: 'none' });
    }
  }
});
