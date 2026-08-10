/**
 * 小程序运行环境地址。
 * 开发版、体验版和正式版统一使用 HTTPS 正式 API。
 * 微信真机不会接受裸 IP 作为合法 request/upload/download 域名。
 */

const PRODUCTION_API_BASE_URL = 'https://api.hemoppf.cn/api';
const INTERNAL_PREVIEW_API_BASE_URL = PRODUCTION_API_BASE_URL;
const ENABLE_FORMAL_RELEASE_API = true;
const PRODUCTION_API_ENVIRONMENTS = new Set(['develop', 'trial', 'release']);

function getMiniProgramEnvVersion() {
  try {
    const accountInfo = wx.getAccountInfoSync();
    return accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion
      ? accountInfo.miniProgram.envVersion
      : 'develop';
  } catch (_error) {
    return 'develop';
  }
}

function resolveApiBaseUrl() {
  return ENABLE_FORMAL_RELEASE_API && PRODUCTION_API_ENVIRONMENTS.has(getMiniProgramEnvVersion())
    ? PRODUCTION_API_BASE_URL
    : INTERNAL_PREVIEW_API_BASE_URL;
}

module.exports = {
  INTERNAL_PREVIEW_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  ENABLE_FORMAL_RELEASE_API,
  getMiniProgramEnvVersion,
  resolveApiBaseUrl,
};
