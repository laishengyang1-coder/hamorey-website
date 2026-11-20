const api = require('./api');

// Retain an unanswered submission across page closes and app restarts.
// The storage key contains only account, delivery-address and product IDs.
async function submitRedemption(role, addressId, items, options) {
  const user = getApp().globalData.userInfo || wx.getStorageSync('userInfo');
  if (!user || !user.id) return { ok: false, message: '请重新登录后兑换' };
  const quantities = items.map(item => [item.reward_id, item.quantity]);
  quantities.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  const storageKey = 'points-redemption:' + JSON.stringify([role, user.organization?.id || '', user.id, addressId, quantities]);
  let requestId;
  try {
    requestId = wx.getStorageSync(storageKey);
    if (!requestId) {
      // This is a per-intent identifier, not a credential.
      const random = () => Math.random().toString(36).slice(2);
      requestId = [Date.now().toString(36), random(), random(), random()].join('-');
      wx.setStorageSync(storageKey, requestId);
    }
  } catch (_) {
    return { ok: false, message: '暂时无法保存兑换进度，请检查小程序存储后重试' };
  }

  let result;
  try {
    result = await api.post('/' + role + '/redemptions', {
      address_id: addressId, items, request_id: requestId
    }, options);
  } catch (_) {
    return { ok: false, message: '暂未收到兑换结果，请重试确认' };
  }
  if (result.ok && (!result.data || typeof result.data.id !== 'string')) {
    return { ok: false, message: '暂未收到可核对的兑换单号，请重试确认' };
  }
  if (result.ok) {
    // A delayed response must not delete a later checkout's request ID.
    try {
      if (wx.getStorageSync(storageKey) === requestId) wx.removeStorageSync(storageKey);
    } catch (_) { /* A retained key can only replay this confirmed order. */ }
  }
  return result;
}

function finishRedemption(page, role, preferredDelta) {
  const pages = getCurrentPages();
  if (pages[pages.length - 1] !== page) return; // User already left while the request was in flight.
  page.setData({ submitted: true });
  const confirm = () => wx.showToast({ title: '兑换申请已提交', icon: 'success' });
  const returnToRewards = () => {
    const current = getCurrentPages();
    if (current[current.length - 1] !== page) return;
    const url = '/pages/' + role + '/rewards/index';
    wx.redirectTo({ url, success: confirm, fail: () => wx.reLaunch({ url, success: confirm }) });
  };
  if (pages.length === 1) {
    returnToRewards();
  } else {
    wx.navigateBack({ delta: Math.min(preferredDelta, pages.length - 1), success: confirm, fail: returnToRewards });
  }
}

module.exports = { submitRedemption, finishRedemption };
