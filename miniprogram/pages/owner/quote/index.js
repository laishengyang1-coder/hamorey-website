/**
 * 车主端 — 部位报价页
 * 选择产品型号 → 按车身区域分组展示部位 → 勾选汇总报价
 */
const api = require('../../../utils/api');

// 车身部位分组
const PART_GROUPS = {
  '前部': ['前保险杠', '前机盖', '前挡', '左前翼子板', '右前翼子板'],
  '侧面': ['左前门', '右前门', '左后门', '右后门', '侧挡'],
  '后部': ['后保险杠', '左后翼子板', '右后翼子板', '后备箱盖'],
  '顶部': ['车顶', '天窗冰甲整体']
};

Page({
  data: {
    models: [],          // 可选型号列表
    activeModel: '',     // 当前选中型号 code
    activeModelName: '', // 当前选中型号名称
    showModelPicker: false,
    loading: true,
    error: '',
    allPrices: [],       // 全部价格原始数据
    groupedParts: [],    // 按区域分组后的部位 [{group, parts: [...]}]
    selectedParts: [],
    totalPrice: 0
  },

  onLoad(options) {
    const { model_code } = options || {};
    this.loadAllPrices(model_code ? decodeURIComponent(model_code) : '');
  },

  /** 加载全部报价，提取可选型号列表 */
  async loadAllPrices(preselect) {
    this.setData({ loading: true, error: '' });

    const res = await api.get('/public/claim-prices', {}, { auth: false, loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const raw = (res.data && res.data.prices) ? res.data.prices : [];
    if (raw.length === 0) {
      this.setData({ loading: false, error: '暂无报价数据' });
      return;
    }

    // 提取不重复的型号
    const modelMap = {};
    raw.forEach(p => {
      if (p.model_code && !modelMap[p.model_code]) {
        modelMap[p.model_code] = { code: p.model_code, name: p.model_name || p.model_code };
      }
    });
    const models = Object.values(modelMap);

    // 确定当前型号
    let activeModel = models.length > 0 ? models[0].code : '';
    if (preselect && modelMap[preselect]) activeModel = preselect;

    this.setData({ models, allPrices: raw, loading: false });
    this.switchModel(activeModel);
  },

  /** 切换型号 */
  switchModel(code) {
    const model = this.data.models.find(m => m.code === code);
    if (!model) return;

    // 筛选当前型号的价格
    const modelPrices = this.data.allPrices
      .filter(p => p.model_code === code)
      .map(p => ({
        ...p,
        checked: false,
        price_fmt: Math.round((p.price_cents || 0) / 100) + ''
      }));

    // 按区域分组
    const groups = [];
    const groupedNames = new Set();
    Object.keys(PART_GROUPS).forEach(group => {
      const parts = [];
      PART_GROUPS[group].forEach(name => {
        const found = modelPrices.find(p => p.part_name === name);
        if (found) {
          parts.push(found);
          groupedNames.add(name);
        }
      });
      if (parts.length > 0) groups.push({ group, parts });
    });
    // 未匹配的放"其他"
    const others = modelPrices.filter(p => !groupedNames.has(p.part_name));
    if (others.length > 0) groups.push({ group: '其他', parts: others });

    this.setData({
      groupedParts: groups,
      activeModel: code,
      activeModelName: model.name,
      showModelPicker: false,
      selectedParts: [],
      totalPrice: 0
    });
  },

  /** 打开/关闭型号选择器 */
  toggleModelPicker() {
    this.setData({ showModelPicker: !this.data.showModelPicker });
  },

  /** 点击选择型号 */
  onPickModel(e) {
    this.switchModel(e.currentTarget.dataset.code);
  },

  /** 切换部位 */
  togglePart(e) {
    const { gi, pi } = e.currentTarget.dataset;
    const groups = this.data.groupedParts;
    groups[gi].parts[pi].checked = !groups[gi].parts[pi].checked;
    this.setData({ groupedParts: groups });
    this.recompute();
  },

  /** 切换整组 */
  toggleGroupAll(e) {
    const gi = e.currentTarget.dataset.gi;
    const groups = this.data.groupedParts;
    const allChecked = groups[gi].parts.every(p => p.checked);
    groups[gi].parts.forEach(p => p.checked = !allChecked);
    this.setData({ groupedParts: groups });
    this.recompute();
  },

  /** 全选/取消全选当前型号 */
  toggleAll() {
    const groups = this.data.groupedParts;
    const anyChecked = groups.some(g => g.parts.some(p => p.checked));
    groups.forEach(g => g.parts.forEach(p => p.checked = !anyChecked));
    this.setData({ groupedParts: groups });
    this.recompute();
  },

  /** 重新计算汇总（同时更新各组的 checked 状态） */
  recompute() {
    const selected = [];
    let sum = 0;
    this.data.groupedParts.forEach(g => {
      const allChecked = g.parts.length > 0 && g.parts.every(p => p.checked);
      g.groupChecked = allChecked;
      g.parts.forEach(p => {
        if (p.checked) {
          selected.push(p);
          sum += p.price_cents || 0;
        }
      });
    });
    this.setData({ selectedParts: selected, totalPrice: Math.round(sum / 100) });
  }
});
