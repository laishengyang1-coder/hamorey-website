/**
 * 车主端 — 质保查询结果页
 * 按车辆聚合，每张质保卡含产品/型号/日期
 */

const api = require('../../../utils/api');

Page({
  data: {
    keyword: '',
    loading: true,
    error: '',
    vehicles: [],
    totalCount: 0
  },

  onLoad(options) {
    const { q } = options;
    this.setData({
      keyword: q ? decodeURIComponent(q) : ''
    });

    if (this.data.keyword) {
      this.fetchWarranties();
    } else {
      this.setData({ loading: false, error: '请输入查询内容' });
    }
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) {
      wx.showToast({ title: '请输入查询内容', icon: 'none' });
      return;
    }
    this.fetchWarranties();
  },

  async fetchWarranties() {
    this.setData({ loading: true, error: '' });

    const kw = this.data.keyword.trim();
    const res = await api.get('/public/warranties', { q: kw }, { loading: false });

    if (!res.ok) {
      this.setData({
        loading: false,
        error: res.message || '查询失败，请稍后重试'
      });
      return;
    }

    const records = res.data.records || [];

    if (records.length === 0) {
      this.setData({
        loading: false,
        vehicles: [],
        totalCount: 0
      });
      wx.showToast({
        title: '未找到质保记录，请联系施工门店',
        icon: 'none',
        duration: 2500
      });
      return;
    }

    // 按车辆（VIN + 车牌）聚合
    const vehicleMap = {};
    records.forEach((r) => {
      const key = `${r.vin_snapshot || ''}_${r.plate_no_snapshot || ''}`;
      if (!vehicleMap[key]) {
        vehicleMap[key] = {
          vehicleKey: key,
          plate_no_snapshot: r.plate_no_snapshot,
          vin_snapshot: r.vin_snapshot,
          vehicle_brand_snapshot: r.vehicle_brand_snapshot,
          vehicle_model_snapshot: r.vehicle_model_snapshot,
          warranties: []
        };
      }
      vehicleMap[key].warranties.push(r);
    });

    this.setData({
      loading: false,
      vehicles: Object.values(vehicleMap),
      totalCount: records.length
    });
  },

  /**
   * 查看质保卡详情
   */
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/owner/detail/index?id=${id}` });
  }
});
