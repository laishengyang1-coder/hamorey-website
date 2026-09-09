/**
 * 门店端 — 换膜无忧（提交换膜申请）
 * 输手机号查质保 → 选质保记录 → 填损坏信息 → 上传照片/视频 → 提交
 */

const api = require('../../../utils/api');

const MAX_MEDIA = 5;

/** ISO 日期长串 → YYYY-MM-DD */
function fmtDate(s) {
  if (!s) return '--';
  const str = String(s);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  if (isNaN(d.getTime())) return str.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 从本地文件路径取扩展名 */
function getExt(filePath) {
  const m = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(filePath || '');
  return m ? m[1].toLowerCase() : '';
}

Page({
  data: {
    phone: '',
    searching: false,
    searched: false,
    records: [],
    selectedId: '',
    selectedRecord: null,
    damagePart: '',
    description: '',
    mediaList: [],
    maxMedia: MAX_MEDIA,
    submitting: false
  },

  onShow() {
    const app = getApp();
    if (!app.checkLogin('store')) return;
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  /**
   * 查询客户质保记录
   */
  async onSearch() {
    const phone = this.data.phone.trim();
    if (!phone) {
      wx.showToast({ title: '请输入客户手机号', icon: 'none' });
      return;
    }

    this.setData({
      searching: true,
      searched: false,
      records: [],
      selectedId: '',
      selectedRecord: null
    });

    const res = await api.get('/store/warranty-lookup', { phone }, {
      loading: true,
      loadingText: '查询中...'
    });

    if (!res.ok) {
      this.setData({ searching: false, searched: true });
      wx.showToast({ title: res.message || '查询失败', icon: 'none' });
      return;
    }

    const records = ((res.data && res.data.items) || []).map((r) => ({
      ...r,
      installation_date: fmtDate(r.installation_date),
      exchanged: Number(r.film_exchanged) === 1,
      model_display: r.model_name || r.product_model_snapshot || r.product_name_snapshot || '--'
    }));

    this.setData({ searching: false, searched: true, records });
  },

  /**
   * 选择一条质保记录（已换膜的不可选）
   */
  onSelectRecord(e) {
    const id = e.currentTarget.dataset.id;
    const record = this.data.records.find((r) => String(r.id) === String(id));
    if (!record) return;
    if (record.exchanged) {
      wx.showToast({ title: '该质保已换过膜，不可再次申请', icon: 'none' });
      return;
    }
    this.setData({ selectedId: record.id, selectedRecord: record });
  },

  /**
   * 选择照片或视频并逐个上传
   */
  onChooseMedia() {
    const remain = MAX_MEDIA - this.data.mediaList.length;
    if (remain <= 0) {
      wx.showToast({ title: `最多上传 ${MAX_MEDIA} 个文件`, icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      success: (res) => {
        this.uploadMediaFiles(res.tempFiles || []);
      }
    });
  },

  updateMediaItem(index, patch) {
    const mediaList = this.data.mediaList.map((it, i) => (i === index ? { ...it, ...patch } : it));
    this.setData({ mediaList });
  },

  async uploadMediaFiles(files) {
    for (const f of files) {
      if (this.data.mediaList.length >= MAX_MEDIA) break;

      const localPath = f.tempFilePath;
      const mediaType = f.fileType === 'video' ? 'video' : 'image';
      const thumb = mediaType === 'video' ? (f.thumbTempFilePath || '') : localPath;

      // 先占位展示上传中
      const mediaList = [...this.data.mediaList, {
        localPath, thumb, mediaType, key: '', uploading: true
      }];
      this.setData({ mediaList });
      const index = mediaList.length - 1;

      const ext = getExt(localPath) || (mediaType === 'video' ? 'mp4' : 'jpg');
      const contentType = mediaType === 'video'
        ? `video/${ext}`
        : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      try {
        // 1. 获取上传预签名
        const urlRes = await api.post('/store/film-exchange-media-url', {
          fileName: `damage_${Date.now()}.${ext}`,
          contentType
        }, { loading: false });

        if (!urlRes.ok || !urlRes.data) {
          this.removeMediaItem(index);
          wx.showToast({ title: urlRes.message || '获取上传地址失败', icon: 'none' });
          continue;
        }

        // 2. 上传文件
        const upRes = await api.upload(localPath, urlRes.data.uploadUrl);
        if (upRes.ok) {
          this.updateMediaItem(index, {
            key: urlRes.data.fileKey,
            mediaType: urlRes.data.mediaType || mediaType,
            uploading: false
          });
        } else {
          this.removeMediaItem(index);
          wx.showToast({ title: upRes.message || '上传失败', icon: 'none' });
        }
      } catch (e) {
        this.removeMediaItem(index);
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    }
  },

  removeMediaItem(index) {
    const mediaList = this.data.mediaList.filter((_, i) => i !== index);
    this.setData({ mediaList });
  },

  onDeleteMedia(e) {
    this.removeMediaItem(e.currentTarget.dataset.index);
  },

  /**
   * 提交换膜申请
   */
  async onSubmit() {
    const { selectedRecord, mediaList, submitting } = this.data;
    if (submitting) return;

    if (!selectedRecord) {
      wx.showToast({ title: '请选择要换膜的质保记录', icon: 'none' });
      return;
    }
    if (mediaList.some((m) => m.uploading)) {
      wx.showToast({ title: '文件上传中，请稍候', icon: 'none' });
      return;
    }

    const mediaKeys = mediaList
      .filter((m) => m.key)
      .map((m) => ({ key: m.key, media_type: m.mediaType }));
    if (mediaKeys.length === 0) {
      wx.showToast({ title: '请至少上传 1 张照片或视频', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const res = await api.post('/store/film-exchange', {
      warranty_record_id: selectedRecord.id,
      damage_part: this.data.damagePart.trim() || undefined,
      description: this.data.description.trim() || undefined,
      media_keys: mediaKeys
    }, {
      loading: true,
      loadingText: '提交中...'
    });

    this.setData({ submitting: false });

    if (res.ok) {
      wx.showToast({ title: res.message || '换膜申请提交成功，等待总部审核', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.redirectTo({ url: '/pages/store/film-exchange-list/index' })
        });
      }, 1500);
    } else {
      wx.showToast({ title: res.message || '提交失败', icon: 'none' });
    }
  },

  /**
   * 查看我的换膜申请
   */
  goList() {
    wx.navigateTo({ url: '/pages/store/film-exchange-list/index' });
  }
});
