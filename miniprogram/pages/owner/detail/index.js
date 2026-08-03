/**
 * 车主端 — 质保卡详情页
 * 含施工门店、照片、到期日
 */

const api = require('../../../utils/api');

function formatWarrantyPrice(cents) {
  if (cents === null || cents === undefined || cents === '') return '--';
  const yuan = Math.round(Number(cents) / 100);
  return `¥${yuan}`;
}

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

    const record = {
      ...records[0],
      warranty_price_text: formatWarrantyPrice(records[0].warranty_price_cents)
    };
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
   * 下载/查看电子证书 PDF
   */
  downloadCert() {
    const certNo = this.data.record.certificate_no || '';
    if (!certNo) {
      wx.showToast({ title: '该质保暂无证书', icon: 'none' });
      return;
    }
    if (this.data.downloading) return;
    this.setData({ downloading: true });
    wx.showLoading({ title: '正在获取证书...', mask: true });

    const url = `${api.getBaseUrl()}/public/certificates/${encodeURIComponent(certNo)}/download`;
    wx.downloadFile({
      url,
      success: (res) => {
        wx.hideLoading();
        this.setData({ downloading: false });
        if (res.statusCode !== 200) {
          wx.showToast({ title: '证书获取失败', icon: 'none' });
          return;
        }
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'pdf',
          showMenu: true,
          fail: () => { wx.showToast({ title: '打开证书失败', icon: 'none' }); }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ downloading: false });
        console.error('[download cert]', err);
        wx.showToast({ title: '下载失败，请确认网络与域名配置', icon: 'none', duration: 2500 });
      }
    });
  },

  /**
   * 跳转报价页
   */
  goQuote() {
    const modelCode = this.data.record.model_code || this.data.record.product_model_snapshot || '';
    wx.navigateTo({
      url: `/pages/owner/quote/index?model_code=${encodeURIComponent(modelCode)}`
    });
  }
});
