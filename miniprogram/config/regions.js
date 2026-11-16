/**
 * 中国省级行政区（官方全称）— 与网页端 src/shared/constants/regions.ts 保持一致
 * 统一用全称（省 / 自治区 / 直辖市 / 特别行政区），禁止简称。
 */
const PROVINCES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省',
  '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
  '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省',
  '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区'
];

/** 把历史简称归一到官方全称 */
function normalizeProvince(input) {
  const v = String(input || '').trim();
  if (!v) return '';
  if (PROVINCES.indexOf(v) >= 0) return v;
  const bare = v.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔)$/g, '');
  const hit = PROVINCES.find(function (p) {
    return p.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔)$/g, '') === bare;
  });
  return hit || v;
}

module.exports = { PROVINCES, normalizeProvince };
