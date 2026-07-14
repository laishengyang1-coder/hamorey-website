Component({
  properties: {
    title: {
      type: String,
      value: ''
    }
  },

  data: {
    statusBarHeight: 20
  },

  lifetimes: {
    attached() {
      try {
        const info = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync());
        this.setData({ statusBarHeight: info.statusBarHeight || 20 });
      } catch (e) {
        // ignore
      }
    }
  },

  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
      } else {
        // No page to go back to — go to owner query page
        wx.reLaunch({ url: '/pages/owner/query/index' });
      }
    }
  }
});
