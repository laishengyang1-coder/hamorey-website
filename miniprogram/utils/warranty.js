/**
 * 和膜 HAMOREY — 车主端质保展示辅助
 * 公开接口只返回 status = 'active' 的记录，是否仍在保障期需按到期日判断。
 */

const { resolveInstallPosition } = require('./install-position');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 质保状态：到期日（YYYY-MM-DD）早于今天 → 已过保，否则保障中
 * @returns {{ text: string, tag: string, expired: boolean }}
 */
function warrantyStatus(record) {
  const status = record && record.status;
  if (status && status !== 'active') {
    return { text: '已失效', tag: 'tag-expired', expired: true };
  }
  const expiry = String((record && record.warranty_expiry_date) || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(expiry) && expiry < todayStr()) {
    return { text: '已过保', tag: 'tag-expired', expired: true };
  }
  return { text: '保障中', tag: 'tag-success', expired: false };
}

function installPosition(record) {
  if (!record) return resolveInstallPosition();
  return record.install_position || resolveInstallPosition(
    record.product_name_snapshot, record.product_model_snapshot, record.product_category
  );
}

module.exports = { warrantyStatus, installPosition };
