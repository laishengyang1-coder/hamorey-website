Component({
  properties: {
    title: {
      type: String,
      value: ''
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
