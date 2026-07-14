/**
 * 门店端 — 登记质保（分步表单）
 * Step 0: 输码 → Step 1: 填车主 → Step 2: 填车辆 → Step 3: 拍照 → Step 4: 确认
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    steps: ['质保码', '车主信息', '车辆信息', '拍照', '确认'],
    currentStep: 0,
    submitting: false,
    form: {
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
    if (!app.checkLogin('store')) return;
  },

  /**
   * 表单字段输入
   */
  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`form.${field}`]: value
    });
  },

  /**
   * 日期选择
   */
  onDateChange(e) {
    this.setData({
      'form.installation_date': e.detail.value
    });
  },

  /**
   * 校验当前步骤
   */
  validateStep() {
    const { currentStep, form } = this.data;

    if (currentStep === 0) {
      if (!form.warranty_code.trim()) {
        wx.showToast({ title: '请输入质保码', icon: 'none' });
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
      if (!form.plate_no.trim()) {
        wx.showToast({ title: '请输入车牌号', icon: 'none' });
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

  /**
   * 下一步
   */
  nextStep() {
    if (!this.validateStep()) return;

    const { currentStep } = this.data;
    this.setData({ currentStep: currentStep + 1 });
  },

  /**
   * 上一步
   */
  prevStep() {
    const { currentStep } = this.data;
    if (currentStep > 0) {
      this.setData({ currentStep: currentStep - 1 });
    }
  },

  /**
   * 拍照
   */
  takePhoto() {
    wx.chooseImage({
      count: 6 - this.data.photos.length,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: async (res) => {
        const newPhotos = [...this.data.photos, ...res.tempFilePaths];
        this.setData({ photos: newPhotos });

        // 上传照片获取 fileKey
        const newKeys = [...this.data.photoKeys];
        for (const filePath of res.tempFilePaths) {
          try {
            // 获取上传 URL
            const uploadRes = await api.post('/store/upload-url', {
              fileName: `photo_${Date.now()}.jpg`,
              contentType: 'image/jpeg'
            }, { loading: false });

            if (uploadRes.ok && uploadRes.data) {
              // 使用返回的 uploadUrl 上传
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

  /**
   * 删除照片
   */
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos.filter((_, i) => i !== index);
    const photoKeys = this.data.photoKeys.filter((_, i) => i !== index);
    this.setData({ photos, photoKeys });
  },

  /**
   * 提交质保登记
   */
  async handleSubmit() {
    this.setData({ submitting: true });

    const form = this.data.form;
    const payload = {
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

    const res = await api.post('/store/warranty-records', payload, {
      loading: true,
      loadingText: '提交中...'
    });

    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/store/records/index' });
      }, 1500);
    } else {
      wx.showToast({ title: res.message || '提交失败', icon: 'none' });
    }
  }
});
