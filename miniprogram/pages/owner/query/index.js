/**
 * 车主端 — 质保查询首页（智能识别）
 */
const api = require('../../../utils/api');

Page({
  data: {
    keyword: ''
  },

  /** 自动识别查询类型 */
  detectType(kw) {
    if (/^1[3-9]\d{9}$/.test(kw)) return 'phone';
    if (/^[\u4e00-\u9fa5][A-Za-z0-9]{5,7}$/.test(kw)) return 'plate';
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(kw)) return 'vin';
    return 'code';
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  async doSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) {
      wx.showToast({ title: '请输入查询内容', icon: 'none' });
      return;
    }

    const res = await api.get('/public/warranties', { q: kw }, {
      loading: true,
      loadingText: '查询中...'
    });

    if (!res.ok) {
      wx.showToast({ title: res.message || '查询失败', icon: 'none' });
      return;
    }

    const records = res.data.records || [];
    if (records.length === 0) {
      wx.showModal({
        title: '未找到',
        content: '未找到质保记录，请联系施工门店',
        showCancel: false,
        confirmColor: '#5C1A1A'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/owner/result/index?q=${encodeURIComponent(kw)}`
    });
  },

  goStoreLogin() {
    wx.navigateTo({ url: '/pages/store/login/index' });
  }
});
