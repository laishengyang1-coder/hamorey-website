/**
 * 和膜 HAMOREY — API 通信层
 * 封装 wx.request，统一处理 Auth、错误、Loading
 */

const app = getApp();

/**
 * 获取 API 基础地址
 */
function getBaseUrl() {
  return (app && app.globalData && app.globalData.apiBaseUrl)
    || 'https://hemoppf.com/api';
}

/**
 * 获取 Token
 */
function getToken() {
  if (app && app.globalData && app.globalData.token) {
    return app.globalData.token;
  }
  return wx.getStorageSync('token') || '';
}

/**
 * 通用请求方法
 * @param {Object} options
 * @param {string} options.url        - 接口路径（不含 base）
 * @param {string} options.method     - HTTP 方法，默认 GET
 * @param {Object} options.data       - 请求参数（GET 时自动拼 query；POST/PUT 发 JSON body）
 * @param {boolean} options.auth      - 是否需要携带 Authorization，默认 true
 * @param {boolean} options.loading   - 是否显示 loading 遮罩，默认 false
 * @param {string} options.loadingText- loading 文案
 * @returns {Promise<{ok: boolean, data: any, message: string}>}
 */
function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    auth = true,
    loading = false,
    loadingText = '加载中...'
  } = options;

  if (loading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${url}`;

  return new Promise((resolve, reject) => {
    const reqOptions = {
      url: fullUrl,
      method,
      header: headers,
      dataType: 'json',
      success(res) {
        if (loading) wx.hideLoading();

        // HTTP 2xx 视为成功
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 后端统一返回 { ok: true, data: ..., message: ... }
          const body = res.data;
          if (body && body.ok !== false) {
            resolve({
              ok: true,
              data: body.data !== undefined ? body.data : body,
              message: body.message || ''
            });
          } else {
            resolve({
              ok: false,
              data: null,
              message: (body && body.message) || '请求失败'
            });
          }
        } else if (res.statusCode === 401) {
          // Token 失效，清除登录态
          if (app && app.clearLoginState) {
            app.clearLoginState();
          }
          wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          resolve({
            ok: false,
            data: null,
            message: '登录已过期'
          });
        } else {
          const msg = (res.data && res.data.message)
            || `请求失败（${res.statusCode}）`;
          resolve({
            ok: false,
            data: null,
            message: msg
          });
        }
      },
      fail(err) {
        if (loading) wx.hideLoading();
        resolve({
          ok: false,
          data: null,
          message: err.errMsg || '网络连接失败，请检查网络'
        });
      }
    };

    // GET 请求拼 query string
    if (method === 'GET' && data && Object.keys(data).length > 0) {
      const params = [];
      Object.keys(data).forEach((key) => {
        const val = data[key];
        if (val !== undefined && val !== null && val !== '') {
          params.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
        }
      });
      if (params.length > 0) {
        reqOptions.url += '?' + params.join('&');
      }
    } else if (data && Object.keys(data).length > 0) {
      reqOptions.data = data;
    }

    wx.request(reqOptions);
  });
}

/**
 * GET 请求
 */
function get(url, data = {}, opts = {}) {
  return request({ ...opts, url, method: 'GET', data });
}

/**
 * POST 请求
 */
function post(url, data = {}, opts = {}) {
  return request({ ...opts, url, method: 'POST', data });
}

/**
 * PUT 请求
 */
function put(url, data = {}, opts = {}) {
  return request({ ...opts, url, method: 'PUT', data });
}

/**
 * DELETE 请求
 */
function del(url, data = {}, opts = {}) {
  return request({ ...opts, url, method: 'DELETE', data });
}

/**
 * 上传文件（图片）
 * @param {string} filePath - 本地文件路径
 * @param {string} uploadUrl - 上传地址（从 upload-url 接口获取）
 * @returns {Promise<{ok: boolean, data: any, message: string}>}
 */
function upload(filePath, uploadUrl) {
  const token = getToken();

  return new Promise((resolve) => {
    wx.showLoading({ title: '上传中...', mask: true });

    wx.uploadFile({
      url: uploadUrl,
      filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        wx.hideLoading();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const body = JSON.parse(res.data);
            resolve({
              ok: true,
              data: body.data !== undefined ? body.data : body,
              message: body.message || ''
            });
          } catch (e) {
            resolve({ ok: true, data: { raw: res.data }, message: '' });
          }
        } else {
          resolve({ ok: false, data: null, message: '上传失败' });
        }
      },
      fail(err) {
        wx.hideLoading();
        resolve({
          ok: false,
          data: null,
          message: err.errMsg || '上传失败'
        });
      }
    });
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  upload
};
