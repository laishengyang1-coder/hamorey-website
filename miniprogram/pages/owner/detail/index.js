/**
 * 车主端 — 质保卡详情页（友商式长图版式）
 * 品牌头 + 产品卡 + 商品/车主/施工信息分组 + 部位价值参考表
 * + 质保须知 + 除外情形 + 下载证书（PNG 长图预览/保存）
 */

const api = require('../../../utils/api');

function formatWarrantyPrice(cents) {
  if (cents === null || cents === undefined || cents === '') return '--';
  const yuan = Math.round(Number(cents) / 100);
  return `¥${yuan}`;
}

function formatPriceCents(cents) {
  if (cents === null || cents === undefined || cents === '') return '--';
  const yuan = Math.round(Number(cents) / 100);
  return `¥${yuan.toLocaleString('zh-CN')}`;
}

/** 日期格式化：兼容 ISO 时间戳与 YYYY-MM-DD，输出 YYYY-MM-DD */
function fmtDate(s) {
  if (!s) return '--';
  const str = String(s);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  if (isNaN(d.getTime())) return str.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

Page({
  data: {
    recordId: '',
    loading: true,
    error: '',
    record: {},
    recordPhotos: [],
    partPrices: [],
    partCols: [[], []],
    certificateNo: ''
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

    const raw = records[0];
    const installDate = fmtDate(raw.installation_date);
    const expiryDate = fmtDate(raw.warranty_expiry_date);
    const record = {
      ...raw,
      warranty_price_text: formatWarrantyPrice(raw.warranty_price_cents),
      // 商品/车主/施工分组行（与长图证书版式一致）
      product_rows: [
        { label: '车膜卷号', value: raw.warranty_code || '--' },
        { label: '型号规格', value: `${raw.product_name_snapshot || ''} ${raw.product_model_snapshot || ''}`.trim() || '--' },
        { label: '装贴部位', value: '整车' },
        { label: '装贴价格', value: formatWarrantyPrice(raw.warranty_price_cents) },
        {
          label: '质保期限',
          value: `${raw.warranty_years_snapshot || '--'} 年（${installDate} 至 ${expiryDate}）`
        }
      ],
      owner_rows: [
        { label: '车主姓名', value: raw.customer_name_snapshot || '--' },
        { label: '品牌车型', value: `${raw.vehicle_brand_snapshot || ''} ${raw.vehicle_model_snapshot || ''}`.trim() || '--' },
        { label: '车牌号码', value: raw.plate_no_snapshot || '临时车牌' },
        { label: '车架号码', value: raw.vin_snapshot || '--' }
      ],
      install_rows: [
        { label: '施工日期', value: installDate },
        { label: '质保录入单位', value: raw.store_name_snapshot || '--' }
      ]
    };

    // 部位价值参考表：两列布局
    const partPrices = raw.part_prices || [];
    const partCols = [[], []];
    partPrices.forEach((p, i) => {
      partCols[i % 2].push({
        name: p.name,
        priceText: formatPriceCents(p.priceCents)
      });
    });

    this.setData({
      loading: false,
      record,
      partPrices,
      partCols,
      certificateNo: raw.certificate_no || '',
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
   * 下载/查看电子证书（PNG 长图，预览后可保存）
   */
  downloadCert() {
    const certNo = this.data.certificateNo;
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
        // 证书为 PNG 长图：预览（可长按保存到相册）
        wx.previewImage({
          current: res.tempFilePath,
          urls: [res.tempFilePath],
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
  }
});
