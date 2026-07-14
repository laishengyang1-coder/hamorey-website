/**
 * 省代端 — 新增/编辑门店
 */

const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    storeId: '',
    isEdit: false,
    loading: false,
    submitting: false,
    form: { code: '', name: '', province: '', city: '', address: '', contact_name: '', phone: '', username: '', password: '' },
    statusOptions: ['运营中', '已停用'],
    statusIndex: 0
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ storeId: id, isEdit: true });
      this.loadStore();
    }
  },

  async loadStore() {
    this.setData({ loading: true });
    const res = await api.get('/province/organizations', {}, { loading: false });
    this.setData({ loading: false });

    if (res.ok) {
      const store = (res.data.items || []).find(s => s.id === this.data.storeId);
      if (store) {
        this.setData({
          form: {
            code: store.code || '',
            name: store.name || '',
            province: store.province || '',
            city: store.city || '',
            address: store.address || '',
            contact_name: store.contact_name || '',
            phone: store.phone || '',
            username: '',
            password: ''
          },
          statusIndex: store.status === 'active' ? 0 : 1
        });
      }
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onStatusChange(e) {
    this.setData({ statusIndex: Number(e.detail.value) });
  },

  async handleSubmit() {
    const { form, isEdit, storeId } = this.data;
    if (!form.code.trim()) { wx.showToast({ title: '请输入门店编码', icon: 'none' }); return; }
    if (!form.name.trim()) { wx.showToast({ title: '请输入门店名称', icon: 'none' }); return; }
    if (!isEdit && !form.username.trim()) { wx.showToast({ title: '请输入登录账号', icon: 'none' }); return; }
    if (!isEdit && form.password.length < 8) { wx.showToast({ title: '登录密码至少 8 位', icon: 'none' }); return; }

    this.setData({ submitting: true });

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      province: form.province.trim() || undefined,
      city: form.city.trim() || undefined,
      address: form.address.trim() || undefined,
      contact_name: form.contact_name.trim() || undefined,
      phone: form.phone.trim() || undefined
    };

    if (!isEdit) {
      payload.username = form.username.trim();
      payload.password = form.password;
    }

    let res;
    if (isEdit) {
      payload.status = this.data.statusIndex === 0 ? 'active' : 'disabled';
      res = await api.put(`/province/organizations/${storeId}`, payload, { loading: true, loadingText: '保存中...' });
    } else {
      res = await api.post('/province/organizations', payload, { loading: true, loadingText: '创建中...' });
    }

    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: isEdit ? '保存成功' : '创建成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } else {
      wx.showToast({ title: res.message || '操作失败', icon: 'none' });
    }
  }
});
