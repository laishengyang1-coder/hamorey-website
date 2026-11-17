const INVITATION_URL = 'https://hemoppf.cn/lijiang2027/';
const SHARE_TITLE = '和膜2027丽江年会邀请函';
const SHARE_IMAGE = '/images/invitation-share-20261117.jpg';
Page({
  data: { src: INVITATION_URL, failed: false },
  onLoad() {
    // Own cover and destination, independent of the global warranty share card.
    this.shareImage = SHARE_IMAGE;
    try {
      const localPath = `${wx.env.USER_DATA_PATH}/invitation-share-20261117.jpg`;
      wx.getFileSystemManager().copyFileSync(SHARE_IMAGE, localPath);
      this.shareImage = localPath;
    } catch (_) { /* A code-package image remains a supported fallback. */ }
  },
  onShow() {
    wx.showShareMenu({ menus: ['shareAppMessage'] });
    // web-view pages cannot provide a reliable timeline single-page experience.
    wx.hideShareMenu({ menus: ['shareTimeline'] });
  },
  onWebLoad() { this.setData({ failed: false }); },
  onWebError() { this.setData({ failed: true }); },
  retry() { this.setData({ failed: false, src: INVITATION_URL + '?reload=' + Date.now() }); },
  copyLink() { wx.setClipboardData({ data: INVITATION_URL }); },
  onShareAppMessage() {
    return { title: SHARE_TITLE, path: '/pages/invitation/index/index', imageUrl: this.shareImage || SHARE_IMAGE };
  }
});
