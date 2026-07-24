/**
 * 车主端 — 部位报价页（新版）
 * 逻辑：
 *  - PPF / TPU改色 → 13 漆面分部位报价，按产品型号选择
 *  - 窗膜 → 6 玻璃部位，按产品系列选择（统称如"和真"，不区分透光度）
 *  - 天窗冰甲 → 整体报价
 */
const api = require('../../../utils/api');

// 车身部位分组（PPF/改色共13个漆面）
const PPF_GROUPS = {
  '前部': ['前保险杠', '前机盖', '左前翼子板', '右前翼子板'],
  '侧面': ['左前门', '右前门', '左后门', '右后门'],
  '后部': ['后保险杠', '左后翼子板', '右后翼子板', '后备箱盖'],
  '顶部': ['车顶'],
};

// 窗膜部位分组
const WF_GROUPS = {
  '前挡': ['前挡'],
  '侧窗': ['左前侧窗', '右前侧窗', '左后侧窗', '右后侧窗'],
  '后挡': ['后挡'],
};

// 窗膜系列名（去掉透光度后缀，如 和真75 → 和真）
function seriesName(name) {
  return (name || '').replace(/[0-9]+$/, '');
}

Page({
  data: {
    loading: true,
    error: '',
    allPrices: [],      // API 全部原始数据
    categories: [],      // 产品大类 [{cat, label, models}]
    activeCategory: '',  // 当前选中的大类
    activeModel: '',     // 当前选中型号 code
    activeModelName: '', // 当前选中型号名
    showModelPicker: false,
    groupedParts: [],    // 分组部位 [{group, parts}]
    selectedParts: [],
    totalPrice: 0
  },

  onLoad() { this.loadAllPrices(); },

  /** 加载全量报价并构建选择器 */
  async loadAllPrices() {
    this.setData({ loading: true, error: '' });
    const res = await api.get('/public/claim-prices', {}, { auth: false, loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const prices = (res.data && res.data.prices) ? res.data.prices : [];
    if (prices.length === 0) {
      this.setData({ loading: false, error: '暂无报价数据' });
      return;
    }

    // 按 category 分组型号
    const catMap = {};
    prices.forEach(p => {
      const cat = p.category;
      if (!catMap[cat]) catMap[cat] = {};
      // 窗膜：按系列去重
      const key = cat === 'window_film' ? seriesName(p.model_name) : p.model_code;
      if (!catMap[cat][key]) {
        catMap[cat][key] = {
          code: p.model_code,
          name: cat === 'window_film' ? key : (p.model_name || p.model_code),
        };
      }
    });

    const CAT_LABELS = { ppf: '漆面保护膜 / PPF', color_ppf: 'TPU 改色膜', window_film: '汽车窗膜', sunroof_film: '天窗膜' };
    const categories = Object.keys(catMap).map(cat => ({
      cat,
      label: CAT_LABELS[cat] || cat,
      models: Object.values(catMap[cat]),
    }));

    const firstCat = categories[0];
    const firstModel = firstCat ? firstCat.models[0] : null;

    this.setData({
      allPrices: prices,
      categories,
      activeCategory: firstCat ? firstCat.cat : '',
      activeModel: firstModel ? firstModel.code : '',
      activeModelName: firstModel ? firstModel.name : '',
      loading: false,
    });

    if (firstModel) this.filterAndGroup(firstCat.cat, firstModel.code);
  },

  /** 按大类+型号过滤并分组部位 */
  filterAndGroup(cat, code) {
    const prices = this.data.allPrices.filter(p => p.category === cat && p.model_code === code);

    if (prices.length === 0) {
      this.setData({ groupedParts: [], selectedParts: [], totalPrice: 0 });
      return;
    }

    const groups = [];
    const groupedNames = new Set();

    if (cat === 'window_film') {
      // 窗膜：按玻璃位置分组
      Object.keys(WF_GROUPS).forEach(group => {
        const parts = [];
        WF_GROUPS[group].forEach(name => {
          const found = prices.find(p => p.part_name === name);
          if (found) { parts.push({ ...found, checked: false, price_fmt: Math.round((found.price_cents || 0) / 100) + '' }); groupedNames.add(name); }
        });
        if (parts.length > 0) groups.push({ group, parts });
      });
    } else if (cat === 'sunroof_film') {
      const parts = prices.map(p => ({ ...p, checked: false, price_fmt: Math.round((p.price_cents || 0) / 100) + '' }));
      if (parts.length > 0) groups.push({ group: '天窗冰甲', parts });
    } else {
      // PPF / color_ppf：按车身区域分组
      Object.keys(PPF_GROUPS).forEach(group => {
        const parts = [];
        PPF_GROUPS[group].forEach(name => {
          const found = prices.find(p => p.part_name === name);
          if (found) { parts.push({ ...found, checked: false, price_fmt: Math.round((found.price_cents || 0) / 100) + '' }); groupedNames.add(name); }
        });
        if (parts.length > 0) groups.push({ group, parts });
      });
    }

    // 未匹配放"其他"
    const others = prices.filter(p => !groupedNames.has(p.part_name)).map(p => ({ ...p, checked: false, price_fmt: Math.round((p.price_cents || 0) / 100) + '' }));
    if (others.length > 0) groups.push({ group: '其他', parts: others });

    this.setData({ groupedParts: groups, selectedParts: [], totalPrice: 0 });
  },

  /** 切换大类 */
  switchCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    const catData = this.data.categories.find(c => c.cat === cat);
    if (!catData) return;
    const firstModel = catData.models[0];
    this.setData({
      activeCategory: cat,
      activeModel: firstModel ? firstModel.code : '',
      activeModelName: firstModel ? firstModel.name : '',
      showModelPicker: false,
    });
    if (firstModel) this.filterAndGroup(cat, firstModel.code);
  },

  /** 打开/关闭型号选择器 */
  toggleModelPicker() {
    this.setData({ showModelPicker: !this.data.showModelPicker });
  },

  /** 点击型号 */
  onPickModel(e) {
    const { code, name } = e.currentTarget.dataset;
    this.setData({ activeModel: code, activeModelName: name, showModelPicker: false });
    this.filterAndGroup(this.data.activeCategory, code);
  },

  /** 切换部位勾选 */
  togglePart(e) {
    const { gi, pi } = e.currentTarget.dataset;
    const groups = this.data.groupedParts;
    groups[gi].parts[pi].checked = !groups[gi].parts[pi].checked;
    this.setData({ groupedParts: groups });
    this.recompute();
  },

  /** 整组全选 */
  toggleGroupAll(e) {
    const gi = e.currentTarget.dataset.gi;
    const groups = this.data.groupedParts;
    const allChecked = groups[gi].parts.every(p => p.checked);
    groups[gi].parts.forEach(p => p.checked = !allChecked);
    this.setData({ groupedParts: groups });
    this.recompute();
  },

  /** 计算汇总 */
  recompute() {
    const selected = [];
    let sum = 0;
    this.data.groupedParts.forEach(g => {
      const allChecked = g.parts.length > 0 && g.parts.every(p => p.checked);
      g.groupChecked = allChecked;
      g.parts.forEach(p => { if (p.checked) { selected.push(p); sum += p.price_cents || 0; } });
    });
    this.setData({ selectedParts: selected, totalPrice: Math.round(sum / 100) });
  }
});
