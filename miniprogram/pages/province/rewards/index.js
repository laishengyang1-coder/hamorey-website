const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: { loading: true, error: '', rewards: [] },
  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadRewards();
  },
  async loadRewards() {
    this.setData({ loading: true, error: '' });
    const res = await api.get('/province/rewards', {}, { loading: false });
    this.setData({ loading: false });
    if (res.ok) {
      const items = res.data.items || [];
      this.setData({ rewards: items });
      // 异步下载封面图
      items.forEach(async (item, i) => {
        if (item.cover_file_key) {
          const img = await api.downloadProtectedPhoto(item.cover_file_key);
          if (img.ok) {
            this.setData({ [`rewards[${i}].coverPath`]: img.data.tempFilePath });
          }
        }
      });
    } else { this.setData({ error: res.message || '加载失败' }); }
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/province/reward-detail/index?id=${id}` });
  }
});
