const INVITATION_URL = 'https://hemoppf.cn/lijiang2027/';
Page({
  data: { src: INVITATION_URL, failed: false },
  onLoad() { wx.showShareMenu({ menus: ['shareAppMessage'] }); },
  onWebLoad() { this.setData({ failed: false }); },
  onWebError() { this.setData({ failed: true }); },
  retry() { this.setData({ failed: false, src: INVITATION_URL + '?reload=' + Date.now() }); },
  copyLink() { wx.setClipboardData({ data: INVITATION_URL }); },
  onShareAppMessage() {
    return { title: '和膜2027丽江年会邀请函 | 和膜耀繁星，英雄聚丽江', path: '/pages/invitation/index/index', imageUrl: '/images/invitation-share.jpg' };
  }
});
