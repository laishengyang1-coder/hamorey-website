/**
 * 车主端 — 质保卡详情页
 * 含施工门店、照片、到期日
 */

const api = require('../../../utils/api');

Page({
  data: {
    recordId: '',
    loading: true,
    error: '',
    record: {},
    recordPhotos: []
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ recordId: id });
      this.loadData();
    } else {
      this.setData({ loading: false, error: '缺少质保卡ID' });
    }
  },

  /**
   * 加载详情数据
   */
  async loadData() {
    this.setData({ loading: true, error: '' });

    const res = await api.get('/public/warranties', { id: this.data.recordId }, { loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const records = res.data.records || [];
    if (records.length === 0) {
      this.setData({ loading: false, error: '质保卡不存在' });
      return;
    }

    const record = records[0];
    this.setData({
      loading: false,
      record,
      recordPhotos: [] // 公开接口不返回照片详情，此处预留
    });
  },

  /**
   * 预览照片
   */
  previewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.recordPhotos.map(p => p.url || p.file_key);
    wx.previewImage({
      current: url,
      urls
    });
  },

  /**
   * 跳转报价页
   */
  goQuote() {
    const modelCode = this.data.record.product_model_snapshot || '';
    wx.navigateTo({
      url: `/pages/owner/quote/index?model_code=${encodeURIComponent(modelCode)}`
    });
  }
});
