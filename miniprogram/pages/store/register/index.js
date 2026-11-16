/**
 * 门店端 — 登记质保（分步表单）
 * Step 0: 车主 → Step 1: 车辆 → Step 2: 产品与质保码（可加多个） → Step 3: 拍照 → Step 4: 确认
 *
 * 2026-11-16 改造：一辆车同时贴车衣 + 前挡 + 侧挡时，车主/车辆信息只填一次，
 * 产品用「+」添加多行、各自填一个质保码，一次提交。
 * 后端 /store/warranty-records-batch 生成 N 条记录（N 张证书），同属一个 batch_id。
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

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
    products: [{ code: '' }],
    photos: [],
    photoKeys: []
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('store')) return;
  },

  /**
   * 从「我的质保码」带码进入：把码放进第一个产品，并直接跳到产品步骤（方便继续加）
   */
  onLoad(options) {
    if (options && options.code) {
      this.setData({
        'products[0].code': decodeURIComponent(options.code),
        currentStep: 2
      });
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
    this.setData({ [`products[${index}].code`]: e.detail.value });
  },

  addProduct() {
    const products = this.data.products;
    if (products.length >= MAX_PRODUCTS) {
      wx.showToast({ title: `一次最多 ${MAX_PRODUCTS} 个产品`, icon: 'none' });
      return;
    }
    this.setData({ products: products.concat([{ code: '' }]) });
  },

  removeProduct(e) {
    const index = Number(e.currentTarget.dataset.index);
    const products = this.data.products.filter((item, i) => i !== index);
    this.setData({ products: products.length > 0 ? products : [{ code: '' }] });
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
    }

    return true;
  },

  nextStep() {
    if (!this.validateStep()) return;
    this.setData({ currentStep: this.data.currentStep + 1 });
  },

  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 });
    }
  },

  // ---------- 拍照 ----------
  takePhoto() {
    wx.chooseImage({
      count: 6 - this.data.photos.length,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: async (res) => {
        const newPhotos = [...this.data.photos, ...res.tempFilePaths];
        this.setData({ photos: newPhotos });

        const newKeys = [...this.data.photoKeys];
        for (const filePath of res.tempFilePaths) {
          try {
            const uploadRes = await api.post('/store/upload-url', {
              fileName: `photo_${Date.now()}.jpg`,
              contentType: 'image/jpeg'
            }, { loading: false });

            if (uploadRes.ok && uploadRes.data) {
              const uploadResult = await api.upload(filePath, uploadRes.data.uploadUrl);
              if (uploadResult.ok) newKeys.push(uploadRes.data.fileKey);
            }
          } catch (e) {
            // 上传失败不阻塞流程
          }
        }
        this.setData({ photoKeys: newKeys });
      }
    });
  },

  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos.filter((item, i) => i !== index);
    const photoKeys = this.data.photoKeys.filter((item, i) => i !== index);
    this.setData({ photos, photoKeys });
  },

  // ---------- 提交 ----------
  async handleSubmit() {
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
      photo_keys: this.data.photoKeys.length > 0 ? this.data.photoKeys : undefined
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
