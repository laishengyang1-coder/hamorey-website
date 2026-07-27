/**
 * 和膜 HAMOREY — 产品体系 / 报价入口
 */

const api = require('../../../utils/api');

const SERIES = [
  {
    key: 'window',
    title: '全车窗膜',
    subtitle: 'WINDOW FILM',
    desc: '高隔热、高清晰、低反光，有效阻隔紫外线与红外线，提升驾乘舒适度与隐私保护。',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-3.jpg',
    icon: '🪟',
    color: '#5C1A1A'
  },
  {
    key: 'ppf',
    title: '隐形车衣',
    subtitle: 'PAINT PROTECTION FILM',
    desc: 'TPU 基材，抗划痕、自修复、耐黄变，为原厂漆面提供持久守护。',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-1.jpg',
    icon: '🛡️',
    color: '#1A1412'
  },
  {
    key: 'color',
    title: 'TPU 改色膜',
    subtitle: 'COLOR WRAP FILM',
    desc: '丰富的色彩选择，兼具改色与保护双重功能，满足个性化定制需求。',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg-2.jpg',
    icon: '🎨',
    color: '#7A2E2E'
  },
  {
    key: 'roof',
    title: '天窗冰甲',
    subtitle: 'ROOF ICE ARMOR',
    desc: '专为天窗设计，高效隔热、防爆裂，降低车内温度，提升行车安全。',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/home-bg.jpg',
    icon: '❄️',
    color: '#C8A96E'
  }
];

Page({
  data: {
    series: SERIES,
    activeSeries: 'window',
    activeSeriesData: SERIES[0]
  },

  onLoad(options) {
    const { series, tab } = options || {};
    if (series) {
      this.switchSeries({ currentTarget: { dataset: { key: series } } });
    }
  },

  switchSeries(e) {
    const key = e.currentTarget.dataset.key;
    const item = SERIES.find(s => s.key === key) || SERIES[0];
    this.setData({ activeSeries: key, activeSeriesData: item });
  },

  goQuote() {
    wx.navigateTo({ url: '/pages/owner/quote/index' });
  },

  goStores() {
    wx.showToast({ title: '授权门店页面即将上线', icon: 'none' });
  }
});
