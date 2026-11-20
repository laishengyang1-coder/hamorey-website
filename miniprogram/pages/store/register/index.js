/**
 * 门店端 — 登记质保（分步表单）
 * Step 0: 车主 → Step 1: 车辆 → Step 2: 产品与质保码（可加多个） → Step 3: 拍照 → Step 4: 确认
 *
 * 2026-11-16 改造：一辆车同时贴车衣 + 前挡 + 侧挡时，车主/车辆信息只填一次，
 * 产品用「+」添加多行、各自填一个质保码，一次提交。
 * 后端 /store/warranty-records-batch 生成 N 条记录（N 张证书），同属一个 batch_id。
 */

const api = require('../../../utils/api');
const { registrationPhotoMethods } = require('../../../utils/registration-photos');

const MAX_PRODUCTS = 8;

Page({
  data: {
    steps: ['车主信息', '车辆信息', '产品与质保码', '拍照', '确认'],
    currentStep: 0,
    submitting: false,
    maxProducts: MAX_PRODUCTS,
    form: {
      customer_name: '',
      customer_phone: '',
      plate_no: '',
      vin: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      installation_date: ''
    },
    // 每个元素 = 一个产品（一个质保码 → 一条记录 → 一张证书）
    products: [{ code: '', model: '', resolved: false, checked: false }],
    suggestions: [],
    suggestIndex: -1,
    suggestionLoading: false,
    suggestionQuery: null,
    photos: []
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('store')) return;
  },

  /**
   * 从「我的质保码」带码进入：把码放进第一个产品并自动识别型号。
   * 仍从第 1 步开始（车主、车辆为必填），到第 3 步时码已填好、可继续加产品。
   * 之前直接跳到第 3 步且未识别型号，会卡在「未识别到产品」，最后提交时车主信息也是空的。
   */
  onLoad(options) {
    if (options && options.code) {
      const code = decodeURIComponent(options.code);
      this.setData({ 'products[0].code': code, currentStep: 0 });
      this.resolveCode(0, code);
      wx.showToast({ title: '已带入质保码，请先填写车主信息', icon: 'none', duration: 2500 });
    }
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ 'form.installation_date': e.detail.value });
  },

  // ---------- 产品行 ----------
  onProductInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    const value = e.detail.value;
    this.setData({
      [`products[${index}].code`]: value,
      [`products[${index}].model`]: '',
      [`products[${index}].resolved`]: false,
      [`products[${index}].checked`]: false,
      suggestIndex: index
    });
    this.searchCodes(value);
  },

  /** 输入长度像不像是完整质保码（避免打到半截就判"不存在"）*/
  isCodeLike(v) {
    const s = (v || '').trim();
    return s.length >= 6 && /[0-9]/.test(s);
  },

  /** 失焦：只有完整码才做精确识别；半截输入不报错，等用户继续打字 */
  onProductBlur(e) {
    const index = Number(e.currentTarget.dataset.index);
    const code = (this.data.products[index] || {}).code || '';
    if (!code.trim()) return;
    if (!this.isCodeLike(code)) {
      this.setData({
        [`products[${index}].model`]: '',
        [`products[${index}].resolved`]: false,
        [`products[${index}].checked`]: false
      });
      return;
    }
    this.resolveCode(index, code);
  },

  /** 精确识别：拿输入的码去本店库存里做全等匹配，命中就显示型号 */
  async resolveCode(index, code) {
    const v = (code || '').trim();
    if (!v) return;
    const res = await api.get('/store/warranty-codes', { q: v, limit: 5 }, { loading: false });
    const items = (res.ok && res.data && res.data.items) || [];
    const hit = items.find((x) => (x.code || '').toUpperCase() === v.toUpperCase());
    this.setData({
      [`products[${index}].model`]: hit ? (hit.model_name || '') : '',
      [`products[${index}].resolved`]: !!hit,
      [`products[${index}].checked`]: true
    });
  },

  /**
   * 质保码查找：
   * - 有输入：1 个字符就开搜（防抖 200ms）
   * - 空输入：直接列本店可用的前 8 个码（方便直接点选）
   */
  searchCodes(keyword) {
    const q = (keyword || '').trim();
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this.setData({ suggestionLoading: true });
    this._searchTimer = setTimeout(async () => {
      const params = { limit: 8 };
      if (q) params.q = q;
      const res = await api.get('/store/warranty-codes', params, { loading: false });
      const items = (res.ok && res.data && res.data.items) || [];
      this.setData({ suggestions: items, suggestionLoading: false, suggestionQuery: q });
    }, q ? 200 : 0);
  },

  /** 聚焦时就把候选列出来（空输入 = 本店可用码）*/
  onProductFocus(e) {
    const index = Number(e.currentTarget.dataset.index);
    const code = (this.data.products[index] || {}).code || '';
    this.setData({ suggestIndex: index });
    this.searchCodes(code);
  },

  /** 点选建议码 */
  onPickCode(e) {
    const sugIdx = Number(e.currentTarget.dataset.sug);
    const rowIdx = this.data.suggestIndex;
    const item = this.data.suggestions[sugIdx];
    if (!item || rowIdx < 0) return;
    this.setData({
      [`products[${rowIdx}].code`]: item.code,
      [`products[${rowIdx}].model`]: item.model_name || '',
      [`products[${rowIdx}].resolved`]: true,
      [`products[${rowIdx}].checked`]: true,
      suggestions: [],
      suggestIndex: -1
    });
  },

  closeSuggest() {
    this.setData({ suggestions: [], suggestIndex: -1 });
  },

  addProduct() {
    const products = this.data.products;
    if (products.length >= MAX_PRODUCTS) {
      wx.showToast({ title: `一次最多 ${MAX_PRODUCTS} 个产品`, icon: 'none' });
      return;
    }
    this.setData({ products: products.concat([{ code: '', model: '', resolved: false, checked: false }]) });
  },

  removeProduct(e) {
    const index = Number(e.currentTarget.dataset.index);
    const products = this.data.products.filter((item, i) => i !== index);
    this.setData({ products: products.length > 0 ? products : [{ code: '', model: '', resolved: false, checked: false }] });
  },

  // ---------- 步骤校验 ----------
  validateStep() {
    const { currentStep, form, products } = this.data;

    if (currentStep === 0) {
      if (!form.customer_name.trim()) { wx.showToast({ title: '请输入车主姓名', icon: 'none' }); return false; }
      if (!form.customer_phone.trim()) { wx.showToast({ title: '请输入联系电话', icon: 'none' }); return false; }
      if (!/^1\d{10}$/.test(form.customer_phone.trim())) { wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return false; }
    }

    if (currentStep === 1) {
      if (!form.vin.trim()) { wx.showToast({ title: '请输入车架号（VIN）', icon: 'none' }); return false; }
      if (!form.vehicle_brand.trim()) { wx.showToast({ title: '请输入车辆品牌', icon: 'none' }); return false; }
      if (!form.vehicle_model.trim()) { wx.showToast({ title: '请输入车辆型号', icon: 'none' }); return false; }
      if (!form.installation_date) { wx.showToast({ title: '请选择施工日期', icon: 'none' }); return false; }
    }

    if (currentStep === 2) {
      const codes = products.map((p) => (p.code || '').trim()).filter(Boolean);
      if (codes.length === 0) { wx.showToast({ title: '请至少填一个质保码', icon: 'none' }); return false; }
      if (new Set(codes.map((c) => c.toUpperCase())).size !== codes.length) {
        wx.showToast({ title: '同一个质保码不要重复填', icon: 'none' });
        return false;
      }
      // 每个码必须能识别出产品（不在本店库存 / 已用完的会识别失败）
      const unresolved = products
        .map((p, i) => ({ p: p, i: i }))
        .filter((x) => (x.p.code || '').trim() && !x.p.resolved);
      if (unresolved.length > 0) {
        this.resolveCode(unresolved[0].i, unresolved[0].p.code);
        wx.showToast({ title: `第 ${unresolved[0].i + 1} 个码未识别到产品，请核对`, icon: 'none' });
        return false;
      }
    }

    return true;
  },

  nextStep() {
    if (!this.validateStep()) return;
    if (this.data.currentStep === 3 && !this.photosReady()) return;
    this.setData({ currentStep: this.data.currentStep + 1 });
  },

  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 });
    }
  },

  ...registrationPhotoMethods('/store/upload-url'),

  onUnload() {
    this._photosClosed = true;
  },

  // ---------- 提交 ----------
  async handleSubmit() {
    if (this.data.submitting || !this.photosReady()) return;
    const form = this.data.form;
    const codes = this.data.products.map((p) => (p.code || '').trim()).filter(Boolean);

    if (codes.length === 0) {
      wx.showToast({ title: '请至少填一个质保码', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const payload = {
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      plate_no: form.plate_no.trim(),
      vin: form.vin.trim(),
      vehicle_brand: form.vehicle_brand.trim(),
      vehicle_model: form.vehicle_model.trim(),
      vehicle_year: form.vehicle_year.trim() || undefined,
      installation_date: form.installation_date,
      products: codes.map((code) => ({ warranty_code: code })),
      photo_keys: this.data.photos.length ? this.data.photos.map(photo => photo.fileKey) : undefined
    };

    const res = await api.post('/store/warranty-records-batch', payload, {
      loading: true,
      loadingText: '提交中...'
    });

    this.setData({ submitting: false });

    if (res.ok) {
      const n = codes.length;
      wx.showToast({ title: n > 1 ? `已提交 ${n} 个产品` : '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/store/records/index' });
      }, 1500);
    } else {
      const errors = (res.data && res.data.errors) || [];
      wx.showToast({ title: (errors[0] && errors[0].message) || res.message || '提交失败', icon: 'none' });
    }
  }
});
