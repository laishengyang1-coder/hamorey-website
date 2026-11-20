const api = require('./api');

const MAX_PHOTOS = 6;

async function uploadPhoto(page, photo, ticketUrl) {
  let fileKey = '';
  try {
    const ticket = await api.post(ticketUrl, {
      fileName: `${photo.id}.jpg`,
      contentType: 'image/jpeg'
    }, { loading: false });

    // The page may close or the user may delete this photo during either request.
    if (page._photosClosed || !page.data.photos.some(item => item.id === photo.id)) return;
    if (ticket.ok && ticket.data && ticket.data.fileKey && ticket.data.uploadUrl) {
      const result = await api.upload(photo.path, ticket.data.uploadUrl, { loading: false });
      if (result.ok && result.data && result.data.fileKey === ticket.data.fileKey) {
        fileKey = ticket.data.fileKey;
      }
    }
  } catch (_) {
    // Keep the local preview so the user can retry the same photo.
  }

  if (page._photosClosed) return;
  const index = page.data.photos.findIndex(item => item.id === photo.id);
  if (index < 0) return;
  page.setData({
    [`photos[${index}]`]: { ...photo, status: fileKey ? 'ready' : 'failed', fileKey }
  });
}

function registrationPhotoMethods(ticketUrl) {
  return {
    takePhoto() {
      const remaining = MAX_PHOTOS - this.data.photos.length;
      if (remaining <= 0 || this._choosingPhotos || this.data.submitting) return;
      this._choosingPhotos = true;
      wx.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: ({ tempFilePaths }) => {
          if (this._photosClosed || this.data.submitting) return;
          const space = MAX_PHOTOS - this.data.photos.length;
          const selected = tempFilePaths.slice(0, space).map(path => {
            this._nextPhoto = (this._nextPhoto || 0) + 1;
            return { id: `photo-${this._nextPhoto}`, path, status: 'uploading', fileKey: '' };
          });
          this.setData({ photos: [...this.data.photos, ...selected] });
          selected.forEach(photo => uploadPhoto(this, photo, ticketUrl));
        },
        complete: () => { this._choosingPhotos = false; }
      });
    },

    retryPhoto(e) {
      if (this.data.submitting) return;
      const id = e.currentTarget.dataset.id;
      const index = this.data.photos.findIndex(item => item.id === id && item.status === 'failed');
      if (index < 0) return;
      const photo = { ...this.data.photos[index], status: 'uploading' };
      this.setData({ [`photos[${index}]`]: photo });
      return uploadPhoto(this, photo, ticketUrl);
    },

    deletePhoto(e) {
      if (this.data.submitting) return;
      const id = e.currentTarget.dataset.id;
      this.setData({ photos: this.data.photos.filter(photo => photo.id !== id) });
    },

    photosReady() {
      if (this.data.photos.some(photo => photo.status === 'failed')) {
        wx.showToast({ title: '请重试或删除失败照片', icon: 'none' });
        return false;
      }
      if (this._choosingPhotos || this.data.photos.some(photo => photo.status !== 'ready' || !photo.fileKey)) {
        wx.showToast({ title: '请等待照片上传完成', icon: 'none' });
        return false;
      }
      return true;
    }
  };
}

module.exports = { registrationPhotoMethods };
