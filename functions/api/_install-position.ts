// 旧证书可能只有产品名和型号快照；能查到目录分类时以分类为准。
export function resolveInstallPosition(
  productName?: string | null,
  productModel?: string | null,
  category?: string | null
): string {
  switch (category) {
    case 'sunroof_film': return '天窗';
    case 'window_film':
    case 'prismatic_film': return '车窗';
    case 'ppf':
    case 'color_ppf': return '整车';
    case 'architectural_film': return '未注明';
  }

  const name = [productName, productModel].filter(Boolean).join(' ').trim();
  if (/建筑|家居膜/.test(name)) return '未注明';
  if (/天窗|冰甲|\bT[12]\b/i.test(name)) return '天窗';
  if (/车衣|改色|漆面保护膜|和膜和彩/.test(name)) return '整车';
  if (/窗膜|和光|和盾|和护|和真|和原|冷光紫|苍穹青/.test(name)
      || /\b(?:WF-[A-Z0-9]+|PRF-(?:LGZ|CQY)|AURIS|FORTEX|LUMIS|NEX5|PUREX)\b/i.test(name)) return '车窗';
  if (/和御|和旺|和兴|和雅|和鼎|和尊|和粹|和彩/.test(name)
      || /\b(?:PPF|HY8|H[WX][89]|YM-8|HYM-MAT|HCZY|HCUI|QCCY|WH[678]\.5|K[678]5|TPU-[0-9A-Z]+)\b/i.test(name)) return '整车';
  return '未注明';
}
