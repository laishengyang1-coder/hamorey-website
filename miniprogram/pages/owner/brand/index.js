/**
 * 品牌介绍页 — 和膜 HAMOREY
 */
Page({
  data: {
    productSeries: [
      {
        key: 'window',
        title: '窗膜',
        subtitle: 'WINDOW FILM',
        desc: '隔热·防晒·隐私',
        image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-window.png'
      },
      {
        key: 'ppf',
        title: '隐形车衣',
        subtitle: 'PAINT PROTECTION',
        desc: '抗划痕·自修复',
        image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-ppf.png'
      },
      {
        key: 'color',
        title: 'TPU 改色膜',
        subtitle: 'COLOR WRAP',
        desc: '色彩·保护·耐久',
        image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-color.png'
      },
      {
        key: 'roof',
        title: '天窗冰甲',
        subtitle: 'ROOF ARMOR',
        desc: '降温·防爆·隔热',
        image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-sunroof.png'
      }
    ],
    coreValues: [
      { icon: '专', title: '专业', en: 'PROFESSIONAL', desc: '全产业链自主研发与智能制造' },
      { icon: '品', title: '品质', en: 'QUALITY', desc: '产品+智能+服务一站式方案' },
      { icon: '服', title: '服务', en: 'SERVICE', desc: '首创全车资产管家服务标准' }
    ]
  },

  onSeriesTap() {
    wx.switchTab({ url: '/pages/owner/product/index' });
  }
});
