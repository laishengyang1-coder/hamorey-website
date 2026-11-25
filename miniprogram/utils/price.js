// 金额以整数分传输，显示时保留实际有值的角、分。
function formatYuan(cents) {
  return String(Number(cents) / 100);
}

function formatWarrantyPrice(cents, grouped = false) {
  if (cents === null || cents === undefined || cents === '') return '--';
  const amount = grouped ? (Number(cents) / 100).toLocaleString('zh-CN') : formatYuan(cents);
  return `¥${amount}`;
}

module.exports = { formatYuan, formatWarrantyPrice };
