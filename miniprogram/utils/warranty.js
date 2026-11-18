/**
 * 和膜 HAMOREY — 车主端质保展示辅助
 * 公开接口只返回 status = 'active' 的记录，是否仍在保障期需按到期日判断。
 */

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

// 窗膜产品名（与产品体系页一致）
const WINDOW_NAMES = ['和光', '和盾', '和护', '和真', '和原', '冷光紫', '苍穹青'];

/**
 * 装贴部位：后端暂无部位字段，按产品名称推断
 * 天窗膜 → 天窗；汽车窗膜 → 车窗；车衣 / 改色 → 整车
 */
function installPosition(record) {
  const name = `${(record && record.product_name_snapshot) || ''} ${(record && record.product_model_snapshot) || ''}`;
  if (/天窗|冰甲/.test(name)) return '天窗';
  if (/窗膜/.test(name) || WINDOW_NAMES.some((n) => name.indexOf(n) !== -1)) return '车窗';
  return '整车';
}

module.exports = { warrantyStatus, installPosition };
