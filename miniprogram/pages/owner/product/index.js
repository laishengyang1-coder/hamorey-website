/**
 * 和膜 HAMOREY — 产品体系
 * 按系列展示具体产品与参数
 */
const api = require('../../../utils/api');

const SERIES_LIST = [
  {
    key: 'window',
    label: '窗膜',
    en: 'WINDOW FILM',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-window.png',
    desc: '高隔热、高清晰、低反光，有效阻隔紫外线与红外线，提升驾乘舒适度与隐私保护。',
    products: [
      { name: '和光', code: 'HG', en: 'AURIS Dual-Silver', tech: '磁控双银工艺', warranty: 10, highlight: '顶级隔热·奢享节能', specs: ['可见光透射比 70%', '紫外线阻隔 99%', '太阳能总阻隔率 58%', '厚度 3mil'] },
      { name: '和盾', code: 'HD', en: 'FORTEX Armor', tech: '多层复合纳米陶瓷', warranty: 10, highlight: '超强防爆·安全堡垒', specs: ['可见光透射比 70%', '紫外线阻隔 99%', '太阳能总阻隔率 53%', '厚度 4mil'] },
      { name: '和护', code: 'HH', en: 'LUMIS UV400+', tech: '纳米陶瓷工艺', warranty: 8, highlight: '隔热耐用·贴心护肤', specs: ['可见光透射比 70%', '紫外线阻隔 99%', '太阳能总阻隔率 50%', '厚度 3mil'] },
      { name: '和真', code: 'HZ', en: 'CLARITY', tech: '高清原色', warranty: 5, highlight: '高清透光·自然视界', specs: ['可见光透射比 75%', '紫外线阻隔 99%', '太阳能总阻隔率 42%', '厚度 2mil'] },
      { name: '和原', code: 'HY', en: 'PRIME', tech: '基础纳米', warranty: 5, highlight: '均衡隔热·舒适驾乘', specs: ['可见光透射比 75%', '紫外线阻隔 99%', '太阳能总阻隔率 38%', '厚度 2mil'] }
    ]
  },
  {
    key: 'ppf',
    label: '隐形车衣',
    en: 'PAINT PROTECTION',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-ppf.png',
    desc: 'TPU 基材，抗划痕、自修复、耐黄变，为原厂漆面提供持久守护。',
    products: [
      { name: '和兴 HX8', code: 'HX8', en: 'HEXING HX8', tech: 'TPU 基材·抗划痕', warranty: 5, highlight: '极致性价比·持久守护', price: 9800, specs: ['TPU 基材', '厚度 8.5mil', '抗划痕', '自修复涂层'] },
      { name: '和兴 HX9', code: 'HX9', en: 'HEXING HX9', tech: 'TPU 基材·增强涂层', warranty: 7, highlight: '进阶保护·亮度持久', price: 12800, specs: ['TPU 基材', '厚度 9mil', '增强抗划痕', '耐黄变'] },
      { name: '和旺 HW8', code: 'HW8', en: 'HEWANG HW8', tech: 'TPU 基材·高密度', warranty: 8, highlight: '全能防护·一步到位', price: 14800, specs: ['高密度 TPU', '厚度 8.5mil', '抗穿刺', '疏水自洁'] },
      { name: '和旺 HW9', code: 'HW9', en: 'HEWANG HW9', tech: 'TPU 基材·高亮版', warranty: 10, highlight: '旗舰防护·十年质保', price: 15800, specs: ['高亮 TPU', '厚度 9mil', '抗穿刺', '持久增亮'] },
      { name: '和御 HY8', code: 'HY8', en: 'HEYU HY8', tech: 'TPU 基材·旗舰级', warranty: 10, highlight: '顶级旗舰·至尊守护', price: 16800, specs: ['旗舰级 TPU', '厚度 10mil', '顶级抗穿刺', '修复性能最强'] },
      { name: '和雅 HYM', code: 'YM-8', en: 'HEYA HYM', tech: 'TPU 基材·哑光版', warranty: 8, highlight: '哑光质感·低调奢华', price: 12800, specs: ['哑光 TPU', '厚度 8.5mil', '磨砂质感', '指纹不留痕'] }
    ]
  },
  {
    key: 'color',
    label: 'TPU 改色膜',
    en: 'COLOR WRAP',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-color.png',
    desc: '丰富的色彩选择，兼具改色与保护双重功能，满足个性化定制需求。',
    products: [
      { name: '和彩 QCCY', code: 'QCCY', en: 'HECAI QCCY', tech: 'TPU 全彩改色', warranty: 8, highlight: '全彩焕新·保护随行', price: 16800, specs: ['TPU 基材', '厚度 8mil', '200+ 颜色可选', '保护+改色二合一'] }
    ]
  },
  {
    key: 'roof',
    label: '天窗冰甲',
    en: 'ROOF ARMOR',
    image: 'https://hamorey-prod-1435246474.cos.ap-guangzhou.myqcloud.com/miniprogram/prod-sunroof.png',
    desc: '专为天窗设计，高效隔热、防爆裂，降低车内温度，提升行车安全。',
    products: [
      { name: '天窗冰甲 T1', code: 'T1', en: 'ROOF T1', tech: '高清隔热·基础版', warranty: 5, highlight: '高清透光·基础隔热', price: 5000, specs: ['高清透光', '隔热率 85%', '防爆裂', '厚度 2mil'] },
      { name: '天窗冰甲 T2', code: 'T2', en: 'ROOF T2', tech: '高清隔热·旗舰版', warranty: 8, highlight: '旗舰隔热·极致防护', price: 5000, specs: ['高清透光', '隔热率 92%', '防爆裂', '厚度 3mil'] }
    ]
  }
];

Page({
  data: {
    seriesList: SERIES_LIST,
    activeSeries: 'window',
    activeData: SERIES_LIST[0]
  },

  onLoad(options) {
    const { series } = options || {};
    if (series) {
      this.setData({ activeSeries: series, activeData: SERIES_LIST.find(s => s.key === series) || SERIES_LIST[0] });
    }
  },

  switchSeries(e) {
    const key = e.currentTarget.dataset.key;
    const data = SERIES_LIST.find(s => s.key === key) || SERIES_LIST[0];
    this.setData({ activeSeries: key, activeData: data });
  },

  goQuote() {
    wx.navigateTo({ url: '/pages/owner/quote/index' });
  },

  goStores() {
    wx.switchTab({ url: '/pages/owner/stores/index' });
  }
});
