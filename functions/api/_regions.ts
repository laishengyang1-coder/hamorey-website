// ============================================================
// 中国省级行政区（官方全称）— 后端校验用
// 与前端 src/shared/constants/regions.ts、miniprogram/config/regions.js 保持一致
// 作用：① 建店时校验省份是否合法 ② 把历史简称（河北/江苏/内蒙古…）归一到全称
// ============================================================

export const PROVINCES: readonly string[] = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省',
  '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
  '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省',
  '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区',
];

const SUFFIX = /(省|市|自治区|特别行政区|壮族|回族|维吾尔)$/g;

/** 简称 / 别名 → 官方全称；无法识别时原样返回（用于兼容旧客户端） */
export function normalizeProvince(input: string | null | undefined): string {
  const v = (input || '').trim();
  if (!v) return '';
  if (PROVINCES.includes(v)) return v;
  const bare = v.replace(SUFFIX, '');
  const hit = PROVINCES.find((p) => p.replace(SUFFIX, '') === bare);
  return hit || v;
}

/** 是否是合法省份全称 */
export function isProvinceFullName(input: string | null | undefined): boolean {
  return PROVINCES.includes((input || '').trim());
}
