/**
 * 小程序运行环境地址。
 * 开发版和体验版继续访问当前腾讯云 IP，避免备案审核期间影响联调；
 * 正式发布版在域名、HTTPS 和微信合法域名全部配置完成后自动使用正式 API。
 */

const INTERNAL_PREVIEW_API_BASE_URL = 'http://134.175.187.12/api';
const PRODUCTION_API_BASE_URL = 'https://api.hemoppf.cn/api';
// Keep this false until ICP, HTTPS and WeChat legal-domain validation are all complete.
const ENABLE_FORMAL_RELEASE_API = false;

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
  return getMiniProgramEnvVersion() === 'release' && ENABLE_FORMAL_RELEASE_API
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
