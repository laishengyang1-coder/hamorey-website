/**
 * 门店端 — 质保详情 / 驳回修改
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

const STATUS_MAP = { pending: '待审核', active: '已通过', rejected: '已驳回', expired: '已过期' };
const STATUS_TAG = { pending: 'tag-warning', active: 'tag-success', rejected: 'tag-error', expired: 'tag-info' };
const LOG_LABELS = { submit: '提交审核', resubmit: '重新提交', approve: '审核通过', reject: '审核驳回', revoke: '撤销' };

Page({
  data: {
    recordId: '',
    loading: true,
    error: '',
    record: {},
    photos: [],
    auditLogs: [],
    isRejected: false,
    submitting: false,
    editForm: {
      customer_name: '',
      customer_phone: '',
      plate_no: '',
      vin: '',
      vehicle_brand: '',
      vehicle_model: '',
      installation_date: ''
    }
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ recordId: id });
      this.loadRecord();
    } else {
      this.setData({ loading: false, error: '缺少记录ID' });
    }
  },

  async loadRecord() {
    this.setData({ loading: true, error: '' });

    const res = await api.get(`/store/warranty-records/${this.data.recordId}`, {}, { loading: false });

    if (!res.ok) {
      this.setData({ loading: false, error: res.message || '加载失败' });
      return;
    }

    const record = res.data.record || {};
    const photos = res.data.photos || [];
    const auditLogs = res.data.auditLogs || [];
    const isRejected = record.status === 'rejected';

    this.setData({
      loading: false,
      record,
      photos,
      auditLogs,
      isRejected,
      editForm: {
        customer_name: record.customer_name_snapshot || '',
        customer_phone: record.customer_phone_snapshot || '',
        plate_no: record.plate_no_snapshot || '',
        vin: record.vin_snapshot || '',
        vehicle_brand: record.vehicle_brand_snapshot || '',
        vehicle_model: record.vehicle_model_snapshot || '',
        installation_date: record.installation_date || ''
      }
    });
  },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`editForm.${field}`]: e.detail.value });
  },

  onEditDateChange(e) {
    this.setData({ 'editForm.installation_date': e.detail.value });
  },

  async handleResubmit() {
    const { editForm } = this.data;

    if (!editForm.customer_name.trim()) {
      wx.showToast({ title: '请输入车主姓名', icon: 'none' }); return;
    }
    if (!editForm.plate_no.trim()) {
      wx.showToast({ title: '请输入车牌号', icon: 'none' }); return;
    }

    this.setData({ submitting: true });

    const res = await api.put(`/store/warranty-records/${this.data.recordId}`, {
      customer_name: editForm.customer_name.trim(),
      customer_phone: editForm.customer_phone.trim(),
      plate_no: editForm.plate_no.trim(),
      vin: editForm.vin.trim() || undefined,
      vehicle_brand: editForm.vehicle_brand.trim(),
      vehicle_model: editForm.vehicle_model.trim(),
      installation_date: editForm.installation_date
    }, { loading: true, loadingText: '提交中...' });

    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: '修改已重新提交', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } else {
      wx.showToast({ title: res.message || '提交失败', icon: 'none' });
    }
  },

  statusLabel(s) { return STATUS_MAP[s] || s; },
  statusTagClass(s) { return STATUS_TAG[s] || 'tag-info'; },
  logActionLabel(a) { return LOG_LABELS[a] || a; },

  previewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.photos.map(p => p.url || p.file_key);
    wx.previewImage({ current: url, urls });
  }
});
