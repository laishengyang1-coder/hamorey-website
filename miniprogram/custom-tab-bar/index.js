/**
 * 自定义 TabBar — 根据用户角色动态显示
 * 公共访客：首页 / 产品 / 质保 / 我的
 * 已登录门店：首页 / 质保记录 / 质保码 / 积分
 * 已登录省代：首页 / 门店 / 质保码 / 积分
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
      // 后端 / globalData 中角色为大写：STORE / PROVINCE / HQ_ADMIN（与 DB、网页端一致）
      const role = ((app && app.globalData && app.globalData.role) || '').toUpperCase();

      let tabs = [];
      let visible = false;

      if (role === 'STORE') {
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
      } else if (role === 'PROVINCE') {
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
      } else {
        // 公共访客 / 未登录：品牌首页、产品、质保、我的
        visible = true;
        tabs = [
          {
            pagePath: '/pages/owner/query/index',
            text: '首页',
            textIcon: '🏠',
            activeColor: '#5C1A1A'
          },
          {
            pagePath: '/pages/owner/product/index',
            text: '产品',
            textIcon: '💎',
            activeColor: '#5C1A1A'
          },
          {
            pagePath: '/pages/owner/warranty/index',
            text: '质保',
            textIcon: '🛡️',
            activeColor: '#5C1A1A'
          },
          {
            pagePath: '/pages/owner/profile/index',
            text: '我的',
            textIcon: '👤',
            activeColor: '#5C1A1A'
          }
        ];
      }

      // 确定当前选中的索引（匹配不到任何 tab 时设为 -1，不高亮任何项）
      const pages = getCurrentPages();
      const currentPage = pages.length > 0 ? '/' + pages[pages.length - 1].route : '';
      let current = -1;
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
      const { path } = e.currentTarget.dataset;

      // 用「当前页面真实路由」判断是否在目标 tab 上，而不是用 current 索引。
      // 否则从子页面（非 tab 页，route 匹配不到任何 tab，current 回落为 0）点首页时，
      // 会被误判成「已在首页」而直接 return，导致跳不回去。
      const pages = getCurrentPages();
      const curRoute = pages.length > 0 ? '/' + pages[pages.length - 1].route : '';
      if (curRoute === path) return;

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
