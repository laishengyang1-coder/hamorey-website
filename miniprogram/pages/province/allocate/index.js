/**
 * 省代端 — 划拨质保码给门店
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    stores: [],
    storeNames: [],
    selectedStoreIndex: -1,
    selectedStoreId: '',
    availableCodes: [],
    loadingCodes: true,
    submitting: false,
    allCodesSelected: false
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadStores();
    this.loadCodes();
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

  async loadCodes() {
    this.setData({ loadingCodes: true });
    const res = await api.get('/province/warranty-codes', { status: 'in_stock', pageSize: 200 }, { loading: false });
    this.setData({ loadingCodes: false });

    if (res.ok) {
      const codes = (res.data.items || []).map(c => ({ ...c, checked: false }));
      this.setData({ availableCodes: codes });
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
    const codes = this.data.availableCodes;
    codes[idx].checked = !codes[idx].checked;
    this.setData({
      availableCodes: codes,
      allCodesSelected: codes.every(c => c.checked)
    });
  },

  toggleAllCodes() {
    const allSelected = !this.data.allCodesSelected;
    const codes = this.data.availableCodes.map(c => ({ ...c, checked: allSelected }));
    this.setData({ availableCodes: codes, allCodesSelected: allSelected });
  },

  async handleAllocate() {
    if (this.data.selectedStoreIndex < 0) {
      wx.showToast({ title: '请选择目标门店', icon: 'none' }); return;
    }

    const codeIds = this.data.availableCodes
      .filter(c => c.checked)
      .map(c => c.id);

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
