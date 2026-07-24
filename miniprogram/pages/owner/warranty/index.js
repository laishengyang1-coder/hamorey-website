/**
 * 和膜 HAMOREY — 质保查询（专注页）
 * 保留原有查询逻辑，从首页和底部 tab 均可进入
 */

const api = require('../../../utils/api');

Page({
  data: {
    keyword: '',
    bgList: [
      'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg.jpg',
      'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-1.jpg',
      'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-2.jpg',
      'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-3.jpg'
    ]
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
  }
});
