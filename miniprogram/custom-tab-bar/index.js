/**
 * 自定义 TabBar — 根据用户角色动态显示
 */

Component({
  data: {
    current: 0,
    visible: false,
    tabs: []
  },

  lifetimes: {
    attached() {
      this.updateTabs();
    }
  },

  pageLifetimes: {
    show() {
      this.updateTabs();
    }
  },

  methods: {
    /**
     * 根据当前页面和角色更新标签
     */
    updateTabs() {
      const app = getApp();
      const role = (app && app.globalData && app.globalData.role) || '';

      let tabs = [];
      let visible = false;

      if (role === 'store') {
        visible = true;
        tabs = [
          {
            pagePath: '/pages/store/index/index',
            text: '首页',
            icon: '/images/tab-home.png',
            iconSelected: '/images/tab-home-active.png'
          },
          {
            pagePath: '/pages/store/records/index',
            text: '质保记录',
            icon: '/images/tab-record.png',
            iconSelected: '/images/tab-record-active.png'
          },
          {
            pagePath: '/pages/store/codes/index',
            text: '质保码',
            icon: '/images/tab-code.png',
            iconSelected: '/images/tab-code-active.png'
          },
          {
            pagePath: '/pages/store/points/index',
            text: '积分',
            icon: '/images/tab-points.png',
            iconSelected: '/images/tab-points-active.png'
          }
        ];
      } else if (role === 'province') {
        visible = true;
        tabs = [
          {
            pagePath: '/pages/province/index/index',
            text: '首页',
            icon: '/images/tab-home.png',
            iconSelected: '/images/tab-home-active.png'
          },
          {
            pagePath: '/pages/province/stores/index',
            text: '门店',
            icon: '/images/tab-store.png',
            iconSelected: '/images/tab-store-active.png'
          },
          {
            pagePath: '/pages/province/codes/index',
            text: '质保码',
            icon: '/images/tab-code.png',
            iconSelected: '/images/tab-code-active.png'
          },
          {
            pagePath: '/pages/province/points/index',
            text: '积分',
            icon: '/images/tab-points.png',
            iconSelected: '/images/tab-points-active.png'
          }
        ];
      }

      // 确定当前选中的索引
      const pages = getCurrentPages();
      const currentPage = pages.length > 0 ? '/' + pages[pages.length - 1].route : '';
      let current = 0;
      tabs.forEach((tab, i) => {
        if (currentPage === tab.pagePath) {
          current = i;
        }
      });

      this.setData({ tabs, visible, current });
    },

    /**
     * 切换 Tab
     */
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset;
      if (this.data.current === index) return;

      wx.switchTab({
        url: path,
        fail() {
          // fallback: navigate to
          wx.redirectTo({ url: path });
        }
      });
    }
  }
});
