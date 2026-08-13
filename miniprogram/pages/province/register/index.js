/**
 * 省代端 — 代下属门店登记质保（分步表单）
 * Step 0: 选门店+选码 → Step 1: 填车主 → Step 2: 填车辆 → Step 3: 拍照 → Step 4: 确认
 * 省代不能给自己上质保；质保码可从省代库存或所选门店库存中按关键词搜索选择
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    steps: ['门店与质保码', '车主信息', '车辆信息', '拍照', '确认'],
    currentStep: 0,
    submitting: false,
    // 下属门店
    stores: [],
    storeIds: [],
    storeNames: [],
    storeIndex: -1,
    selectedStoreName: '',
    // 库存来源：province=省代库存 / store=门店库存
    stockSource: 'province',
    // 质保码搜索
    codeQuery: '',
    codeOptions: [],
    codeDropdownOpen: false,
    searchTimer: null,
    form: {
      store_id: '',
      warranty_code: '',
      customer_name: '',
      customer_phone: '',
      plate_no: '',
      vin: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      installation_date: ''
    },
    photos: [],
    photoKeys: []
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('province')) return;
    this.loadStores();
  },

  /** 加载下属门店 */
  async loadStores() {
    const res = await api.get('/province/organizations', {}, { loading: false });
    if (res.ok && res.data && res.data.items) {
      const stores = res.data.items;
      this.setData({
        stores,
        storeIds: stores.map((s) => s.id),
        storeNames: stores.map((s) => s.name + (s.code ? '（' + s.code + '）' : ''))
      });
    }
  },

  /** 选择门店 */
  onStoreChange(e) {
    const idx = Number(e.detail.value);
    const store = this.data.stores[idx];
    if (!store) return;
    this.setData({
      storeIndex: idx,
      selectedStoreName: store.name,
      'form.store_id': store.id,
      codeQuery: '',
      codeOptions: [],
      codeDropdownOpen: false,
      'form.warranty_code': ''
    });
  },

  /** 切换库存来源 */
  onSourceChange(e) {
    const source = e.currentTarget.dataset.source;
    if (source === this.data.stockSource) return;
    this.setData({
      stockSource: source,
      codeQuery: '',
      codeOptions: [],
      codeDropdownOpen: false,
      'form.warranty_code': ''
    });
  },

  /** 质保码输入（防抖搜索） */
  onCodeInput(e) {
    const value = e.detail.value;
    this.setData({ codeQuery: value, 'form.warranty_code': value });
    if (this.data.searchTimer) clearTimeout(this.data.searchTimer);
    const timer = setTimeout(() => this.searchCodes(value), 250);
    this.setData({ searchTimer: timer });
  },

  /** 搜索质保码 */
  async searchCodes(value) {
    if (!value.trim()) {
      this.setData({ codeOptions: [], codeDropdownOpen: false });
      return;
    }
    if (!this.data.form.store_id) {
      wx.showToast({ title: '请先选择门店', icon: 'none' });
      return;
    }
    const ownerOrgId = this.data.stockSource === 'store' ? this.data.form.store_id : '';
    const res = await api.get('/province/warranty-codes', {
      q: value.trim(),
      limit: 10,
      owner_org_id: ownerOrgId,
      transferable: 1
    }, { loading: false });
    if (res.ok) {
      this.setData({ codeOptions: (res.data && res.data.items) || [], codeDropdownOpen: true });
    } else {
      this.setData({ codeOptions: [], codeDropdownOpen: false });
    }
  },

  /** 选择质保码 */
  onSelectCode(e) {
    const code = e.currentTarget.dataset.code;
    this.setData({
      codeQuery: code,
      'form.warranty_code': code,
      codeOptions: [],
      codeDropdownOpen: false
    });
  },

  /** 关闭下拉 */
  closeDropdown() {
    this.setData({ codeDropdownOpen: false });
  },

  /** 表单字段输入 */
  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({ [`form.${field}`]: value });
  },

  /** 日期选择 */
  onDateChange(e) {
    this.setData({ 'form.installation_date': e.detail.value });
  },

  /** 校验当前步骤 */
  validateStep() {
    const { currentStep, form } = this.data;

    if (currentStep === 0) {
      if (!form.store_id) {
        wx.showToast({ title: '请选择门店', icon: 'none' });
        return false;
      }
      if (!form.warranty_code.trim()) {
        wx.showToast({ title: '请输入或选择质保码', icon: 'none' });
        return false;
      }
    }

    if (currentStep === 1) {
      if (!form.customer_name.trim()) {
        wx.showToast({ title: '请输入车主姓名', icon: 'none' });
        return false;
      }
      if (!form.customer_phone.trim()) {
        wx.showToast({ title: '请输入联系电话', icon: 'none' });
        return false;
      }
      if (!/^1\d{10}$/.test(form.customer_phone.trim())) {
        wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.vin.trim()) {
        wx.showToast({ title: '请输入车架号（VIN）', icon: 'none' });
        return false;
      }
      if (!form.vehicle_brand.trim()) {
        wx.showToast({ title: '请输入车辆品牌', icon: 'none' });
        return false;
      }
      if (!form.vehicle_model.trim()) {
        wx.showToast({ title: '请输入车辆型号', icon: 'none' });
        return false;
      }
      if (!form.installation_date) {
        wx.showToast({ title: '请选择施工日期', icon: 'none' });
        return false;
      }
    }

    return true;
  },

  /** 下一步 */
  nextStep() {
    if (!this.validateStep()) return;
    const { currentStep } = this.data;
    this.setData({ currentStep: currentStep + 1 });
  },

  /** 上一步 */
  prevStep() {
    const { currentStep } = this.data;
    if (currentStep > 0) {
      this.setData({ currentStep: currentStep - 1 });
    }
  },

  /** 拍照 */
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
            const uploadRes = await api.post('/province/upload-url', {
              fileName: `photo_${Date.now()}.jpg`,
              contentType: 'image/jpeg'
            }, { loading: false });

            if (uploadRes.ok && uploadRes.data) {
              const uploadResult = await api.upload(filePath, uploadRes.data.uploadUrl);
              if (uploadResult.ok) {
                newKeys.push(uploadRes.data.fileKey);
              }
            }
          } catch (e) {
            // 上传失败不阻塞流程
          }
        }
        this.setData({ photoKeys: newKeys });
      }
    });
  },

  /** 删除照片 */
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos.filter((_, i) => i !== index);
    const photoKeys = this.data.photoKeys.filter((_, i) => i !== index);
    this.setData({ photos, photoKeys });
  },

  /** 提交质保登记 */
  async handleSubmit() {
    this.setData({ submitting: true });

    const form = this.data.form;
    const payload = {
      store_id: form.store_id,
      warranty_code: form.warranty_code.trim(),
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      plate_no: form.plate_no.trim(),
      vin: form.vin.trim() || undefined,
      vehicle_brand: form.vehicle_brand.trim(),
      vehicle_model: form.vehicle_model.trim(),
      vehicle_year: form.vehicle_year.trim() || undefined,
      installation_date: form.installation_date,
      photo_keys: this.data.photoKeys.length > 0 ? this.data.photoKeys : undefined
    };

    const res = await api.post('/province/warranty-records', payload, {
      loading: true,
      loadingText: '提交中...'
    });

    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({ title: res.message || '提交失败', icon: 'none' });
    }
  }
});
