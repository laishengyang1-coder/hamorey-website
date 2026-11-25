const PAGE_SIZE = 20;

// 对应余额计算：冻结时从可用转到冻结，实扣时通常只减少冻结余额。
function formatLedgerEntry(row) {
  const points = Number(row.points_change) || 0;
  const frozen = Number(row.frozen_change) || 0;
  let availableDelta = 0;
  let frozenDelta = 0;
  switch (row.change_type) {
    case 'release':
      frozenDelta = -frozen;
      availableDelta = points;
      break;
    case 'freeze':
      frozenDelta = frozen;
      availableDelta = -points;
      break;
    case 'deduct':
      frozenDelta = -frozen;
      availableDelta = -points;
      break;
    case 'revoke':
      availableDelta = -points;
      break;
    case 'award':
    case 'adjust':
      availableDelta = points;
      break;
  }
  const signed = n => n > 0 ? '+' + n : String(n);
  return { ...row, availableDelta, frozenDelta,
    availableText: signed(availableDelta), frozenText: signed(frozenDelta) };
}

function pointsPage(role, fetchPoints) {
  return {
    data: {
      points: null, ledger: [], page: 1, pages: 1, total: 0,
      loading: true, error: '',
    },

    onShow() {
      if (getApp().checkLogin(role)) this.loadPoints(1);
    },

    async loadPoints(page) {
      const request = (this.pointsRequest || 0) + 1;
      this.pointsRequest = request;
      this.requestedPage = page;
      this.setData({ loading: true, error: '' });
      const res = await fetchPoints({ page, pageSize: PAGE_SIZE });
      if (request !== this.pointsRequest) return;
      if (!res.ok) {
        this.setData({ loading: false, error: res.message || '积分加载失败' });
        return;
      }

      const data = res.data;
      const ledger = (data.ledger || []).map(formatLedgerEntry);
      const total = Number(data.total ?? ledger.length);
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > pages) return this.loadPoints(pages);
      this.setData({
        loading: false, page, pages, total, ledger,
        points: { available: Number(data.available) || 0, frozen: Number(data.frozen) || 0 },
      });
    },

    previousPage() {
      if (!this.data.loading && this.data.page > 1) this.loadPoints(this.data.page - 1);
    },

    nextPage() {
      if (!this.data.loading && this.data.page < this.data.pages) this.loadPoints(this.data.page + 1);
    },

    retryPage() {
      this.loadPoints(this.requestedPage || 1);
    },
  };
}

module.exports = { pointsPage };
