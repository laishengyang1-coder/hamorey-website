// 开发预览可能不返回微信版本号，此时使用此包对应的上传版本。
const BUILD_VERSION = '2.42';
function displayVersion() {
  try {
    const { miniProgram } = wx.getAccountInfoSync();
    return 'v' + (miniProgram.version || BUILD_VERSION);
  } catch (_) {
    return 'v' + BUILD_VERSION;
  }
}

module.exports = { displayVersion };
