// ============================================================
// 和膜 HAMOREY — 示例门店数据
// V1 用于 UI 验收，正式数据待品牌方提供后替换
// ============================================================

import type { StoreAuthLevel } from '../types/enums';

export interface StoreConfig {
  id: string;
  public_name: string;
  auth_level: StoreAuthLevel;
  province: string;
  city: string;
  address: string;
  phone: string;
  business_hours: string;
  service_products: string;
  is_public: boolean;
  sort_order: number;
}

export const stores: StoreConfig[] = [
  {
    id: 'spp-gz001',
    public_name: '和膜·广州天河品牌灯塔店',
    auth_level: 'HEBC',
    province: '广东',
    city: '广州',
    address: '广州市天河区天河北路 233 号',
    phone: '020-88888001',
    business_hours: '09:00-18:00',
    service_products: '窗膜;隐形车衣;TPU改色;天窗冰甲',
    is_public: true,
    sort_order: 0,
  },
  {
    id: 'spp-gz002',
    public_name: '和膜·广州番禺标准服务中心',
    auth_level: 'HSS',
    province: '广东',
    city: '广州',
    address: '广州市番禺区市桥街光明北路 88 号',
    phone: '020-88888002',
    business_hours: '09:00-18:00',
    service_products: '窗膜;隐形车衣',
    is_public: true,
    sort_order: 1,
  },
  {
    id: 'spp-sz001',
    public_name: '和膜·深圳南山区域服务点',
    auth_level: 'Service_Point',
    province: '广东',
    city: '深圳',
    address: '深圳市南山区科技园南路 16 号',
    phone: '0755-88888003',
    business_hours: '10:00-19:00',
    service_products: '窗膜;天窗冰甲',
    is_public: true,
    sort_order: 2,
  },
];

/** 门店授权等级标签 */
export const AUTH_LEVEL_LABELS: Record<StoreAuthLevel, string> = {
  HEBC: '品牌灯塔店',
  HSS: '标准服务中心',
  Service_Point: '区域服务点',
};

/** 获取门店服务产品列表 */
export function getStoreProducts(store: StoreConfig): string[] {
  return store.service_products.split(';').filter(Boolean);
}

/** 按省份筛选门店 */
export function filterStoresByProvince(storeList: StoreConfig[], province: string): StoreConfig[] {
  return storeList.filter((s) => s.province === province);
}

/** 按城市筛选门店 */
export function filterStoresByCity(storeList: StoreConfig[], city: string): StoreConfig[] {
  return storeList.filter((s) => s.city === city);
}

/** 按关键词搜索门店 */
export function searchStores(storeList: StoreConfig[], keyword: string): StoreConfig[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return storeList;
  return storeList.filter(
    (s) =>
      s.public_name.toLowerCase().includes(kw) ||
      s.address.toLowerCase().includes(kw),
  );
}

/** 获取所有省份列表（去重） */
export function getProvinces(storeList: StoreConfig[]): string[] {
  return [...new Set(storeList.map((s) => s.province))].sort();
}

/** 获取指定省份下的城市列表（去重） */
export function getCitiesByProvince(storeList: StoreConfig[], province: string): string[] {
  return [...new Set(storeList.filter((s) => s.province === province).map((s) => s.city))].sort();
}
