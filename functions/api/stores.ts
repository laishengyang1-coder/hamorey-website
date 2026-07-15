// ============================================================
// 和膜 HAMOREY — 门店查询 API
// GET /api/stores?province=&city=&keyword=&level=&page=1&pageSize=20
// 从 D1 store_public_profiles 表读取公开门店
// V1 本地开发无 D1 时回退到配置文件数据
// ============================================================

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

interface StoreRow {
  id: string;
  organization_id: string;
  public_name: string;
  auth_level: string;
  province: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  business_hours: string | null;
  service_products: string | null;
  image_file_key: string | null;
  is_public: number;
  sort_order: number;
}

// === 本地回退数据（D1 未绑定时使用） ===
const FALLBACK_STORES: StoreRow[] = [
  {
    id: 'spp-gz001',
    organization_id: 'org-store-gz001',
    public_name: '和膜·广州天河品牌灯塔店',
    auth_level: 'HEBC',
    province: '广东',
    city: '广州',
    address: '广州市天河区天河北路 233 号',
    phone: '020-88888001',
    business_hours: '09:00-18:00',
    service_products: '窗膜;隐形车衣;TPU改色;天窗冰甲',
    image_file_key: null,
    is_public: 1,
    sort_order: 0,
  },
  {
    id: 'spp-gz002',
    organization_id: 'org-store-gz002',
    public_name: '和膜·广州番禺标准服务中心',
    auth_level: 'HSS',
    province: '广东',
    city: '广州',
    address: '广州市番禺区市桥街光明北路 88 号',
    phone: '020-88888002',
    business_hours: '09:00-18:00',
    service_products: '窗膜;隐形车衣',
    image_file_key: null,
    is_public: 1,
    sort_order: 1,
  },
  {
    id: 'spp-sz001',
    organization_id: 'org-store-sz001',
    public_name: '和膜·深圳南山区域服务点',
    auth_level: 'Service_Point',
    province: '广东',
    city: '深圳',
    address: '深圳市南山区科技园南路 16 号',
    phone: '0755-88888003',
    business_hours: '10:00-19:00',
    service_products: '窗膜;天窗冰甲',
    image_file_key: null,
    is_public: 1,
    sort_order: 2,
  },
];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const province = url.searchParams.get('province') || '';
  const city = url.searchParams.get('city') || '';
  const keyword = url.searchParams.get('keyword') || '';
  const level = url.searchParams.get('level') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));

  let stores: StoreRow[] = [];

  if (env.DB) {
    // 从 D1 查询
    let sql = `SELECT * FROM store_public_profiles WHERE is_public = 1`;
    const params: unknown[] = [];

    if (province) {
      sql += ` AND province = ?`;
      params.push(province);
    }
    if (city) {
      sql += ` AND city = ?`;
      params.push(city);
    }
    if (keyword) {
      sql += ` AND (public_name LIKE ? ESCAPE '\\' OR address LIKE ? ESCAPE '\\')`;
      const kw = `%${escapeLike(keyword)}%`;
      params.push(kw, kw);
    }
    if (level) {
      sql += ` AND auth_level = ?`;
      params.push(level);
    }

    sql += ` ORDER BY sort_order ASC, created_at DESC`;

    try {
      const stmt = env.DB.prepare(sql).bind(...params);
      const result = await stmt.all<StoreRow>();
      stores = result.results ?? [];
    } catch (err) {
      console.error('[stores] DB error:', err);
      stores = FALLBACK_STORES;
    }
  } else {
    // 本地回退：使用静态数据
    stores = FALLBACK_STORES.filter((s) => {
      if (province && s.province !== province) return false;
      if (city && s.city !== city) return false;
      if (level && s.auth_level !== level) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (
          !s.public_name.toLowerCase().includes(kw) &&
          !s.address?.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }

  // 分页
  const total = stores.length;
  const offset = (page - 1) * pageSize;
  const pagedStores = stores.slice(offset, offset + pageSize);

  return jsonResponse({
    code: 'OK',
    message: '',
    data: {
      stores: pagedStores,
      total,
      page,
      pageSize,
    },
  });
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
