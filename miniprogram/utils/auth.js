/**
 * 和膜 HAMOREY — 登录认证模块
 */

const api = require('./api');
const app = getApp();

/**
 * 密码登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{ok: boolean, data: any, message: string}>}
 */
async function login(username, password) {
  const res = await api.post('/auth/login', {
    username,
    password
  }, { auth: false, loading: true, loadingText: '登录中...' });

  if (res.ok && res.data && res.data.token) {
    const userInfo = res.data.user;
    app.setLoginState(res.data.token, userInfo);

    // 返回角色信息，供调用方判断跳转
    return {
      ok: true,
      data: {
        token: res.data.token,
        user: userInfo,
        role: userInfo.role
      },
      message: res.message
    };
  }

  return res;
}

/**
 * 获取当前用户信息
 * @returns {Promise<{ok: boolean, data: any, message: string}>}
 */
async function getMe() {
  const res = await api.get('/auth/me', {}, { loading: false });

  if (res.ok && res.data) {
    // 同步更新本地存储
    wx.setStorageSync('userInfo', res.data);
    if (app && app.globalData) {
      app.globalData.userInfo = res.data;
      app.globalData.role = res.data.role || '';
    }
  }

  return res;
}

/**
 * 退出登录
 */
function logout() {
  app.clearLoginState();
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!(app && app.globalData && app.globalData.isLoggedIn);
}

/**
 * 获取当前用户角色
 * @returns {string} 'store' | 'province' | ''
 */
function getRole() {
  return (app && app.globalData && app.globalData.role) || '';
}

/**
 * 获取当前用户信息
 * @returns {Object|null}
 */
function getUserInfo() {
  return (app && app.globalData && app.globalData.userInfo) || null;
}

module.exports = {
  login,
  getMe,
  logout,
  isLoggedIn,
  getRole,
  getUserInfo
};
