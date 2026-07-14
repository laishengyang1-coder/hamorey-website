/**
 * 车主端 — 部位报价页
 * 13部位复选框 + 汇总总价
 */

const api = require('../../../utils/api');

Page({
  data: {
    modelCode: '',
    modelName: '',
    loading: true,
    error: '',
    prices: [],
    allSelected: false,
    selectedParts: [],
    totalPrice: 0
  },

  /**
   * 重新计算选中汇总
   */
  recomputeSelection() {
    const prices = this.data.prices;
    const selectedParts = prices.filter(p => p.checked);
    const sum = selectedParts.reduce((acc, p) => acc + (p.price_cents || 0), 0);
    const totalPrice = Math.round(sum / 100);
    this.setData({ selectedParts, totalPrice });
  },

  onLoad(options) {
    const { model_code } = options;
    this.setData({
      modelCode: model_code ? decodeURIComponent(model_code) : ''
    });
    this.loadPrices();
  },

  /**
   * 加载报价数据
   */
  async loadPrices() {
    this.setData({ loading: true, error: '' });

    const params = {};
    if (this.data.modelCode) {
      params.model_code = this.data.modelCode;
    }

    const res = await api.get('/public/claim-prices', params, { loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载报价失败' });
      return;
    }

    const prices = (res.data.prices || []).map(p => ({
      ...p,
      checked: false,
      price_fmt: Math.round((p.price_cents || 0) / 100) + ''
    }));

    const firstItem = prices.length > 0 ? prices[0] : {};

    this.setData({
      loading: false,
      prices,
      modelName: firstItem.model_name || '',
      modelCode: firstItem.model_code || this.data.modelCode
    });
  },

  /**
   * 切换部位选择
   */
  togglePart(e) {
    const index = e.currentTarget.dataset.index;
    const prices = this.data.prices;
    prices[index].checked = !prices[index].checked;

    const allSelected = prices.every(p => p.checked);

    this.setData({ prices, allSelected });
    this.recomputeSelection();
  },

  toggleAll() {
    const allSelected = !this.data.allSelected;
    const prices = this.data.prices.map(p => ({
      ...p,
      checked: allSelected
    }));

    this.setData({ prices, allSelected });
    this.recomputeSelection();
  }
});
