const api = require('../../../utils/api');

Page({
  data: { rewardId: '', loading: true, error: '', reward: {}, submitting: false },

  onLoad(options) {
    const { id } = options;
    if (id) { this.setData({ rewardId: id }); this.loadReward(); }
    else { this.setData({ loading: false, error: '缺少商品ID' }); }
  },

  async loadReward() {
    this.setData({ loading: true, error: '' });
    const res = await api.get('/province/rewards', {}, { loading: false });
    if (res.ok && res.data.items) {
      const reward = res.data.items.find(r => r.id === this.data.rewardId);
      if (reward) {
        const fallbackCoverUrl = api.getPublicPhotoUrl(reward.cover_file_key);
        this.setData({
          loading: false,
          reward: {
            ...reward,
            fallbackCoverUrl,
            coverUrl: reward.cover_url || fallbackCoverUrl,
            usingFallbackCover: !reward.cover_url,
            imageFailed: false
          }
        });
      } else { this.setData({ loading: false, error: '商品不存在' }); }
    } else { this.setData({ loading: false, error: '加载失败' }); }
  },

  handleImageError() {
    const { reward } = this.data;
    if (!reward || reward.imageFailed) return;
    if (!reward.usingFallbackCover && reward.fallbackCoverUrl) {
      this.setData({ 'reward.coverUrl': reward.fallbackCoverUrl, 'reward.usingFallbackCover': true });
      return;
    }
    this.setData({ 'reward.imageFailed': true });
  },

  async handleRedeem() {
    const { reward } = this.data;
    wx.showModal({
      title: '确认兑换', content: `确定使用 ${reward.points_required} 积分兑换"${reward.name}"吗？`, confirmColor: '#5C1A1A',
      success: async (modalRes) => {
        if (!modalRes.confirm) return;
        this.setData({ submitting: true });
        const res = await api.post('/province/redemptions', { address_id: 'default', items: [{ reward_id: reward.id, quantity: 1 }] }, { loading: true, loadingText: '兑换中...' });
        this.setData({ submitting: false });
        if (res.ok) { wx.showToast({ title: '兑换成功', icon: 'success' }); setTimeout(() => wx.navigateBack(), 1500); }
        else { wx.showToast({ title: res.message || '兑换失败', icon: 'none' }); }
      }
    });
  }
});
