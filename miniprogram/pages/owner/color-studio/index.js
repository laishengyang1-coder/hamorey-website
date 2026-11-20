const STUDIO_URL = 'https://hemoppf.cn/color-studio';
const EMBED_URL = STUDIO_URL + '?embed=miniprogram';
const STUDIO_TITLE = '和膜在线选色';
const COVER_NAME = 'color-studio-share-20261120.jpg';
const COVER_PATH = '/images/' + COVER_NAME;

Page({
  data: { src: EMBED_URL, failed: false },

  onLoad() {
    // Follow the invitation page's image handling for WeChat chat previews.
    this.shareCover = COVER_PATH;
    try {
      const localPath = wx.env.USER_DATA_PATH + '/' + COVER_NAME;
      wx.getFileSystemManager().copyFileSync(COVER_PATH, localPath);
      this.shareCover = localPath;
    } catch (_) {
      // WeChat can also share the image directly from the app package.
    }
  },

  onShow() {
    wx.showShareMenu({ menus: ['shareAppMessage'] });
    wx.hideShareMenu({ menus: ['shareTimeline'] });
  },

  onWebLoad() {
    wx.setNavigationBarTitle({ title: STUDIO_TITLE });
  },

  onWebError() {
    this.setData({ failed: true });
  },

  retry() {
    this.setData({ src: EMBED_URL, failed: false });
  },

  copyLink() {
    wx.setClipboardData({ data: STUDIO_URL });
  },

  onShareAppMessage() {
    return {
      title: STUDIO_TITLE,
      path: '/pages/owner/color-studio/index',
      imageUrl: this.shareCover || COVER_PATH
    };
  }
});
