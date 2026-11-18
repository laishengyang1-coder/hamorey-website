/**
 * 和膜 HAMOREY — 全国授权门店
 */
const api = require('../../../utils/api');

/**
 * 从地址中提取区/县级地名，用于统一门店展示名「和膜 HAMOREY（XX店）」
 * 先去掉省、市前缀，避免「广西壮族自治区」「广州市天河区」被截成「广西壮族自治」「广州市天河」。
 * e.g. "广州市天河区天河北路233号" → "天河"
 *      "广西壮族自治区南宁市青秀区民族大道" → "青秀"
 *      "清原满族自治县清原镇" → "清原"
 */
const CN = '[\\u4e00-\\u9fff]';
const DISTRICT_RE = new RegExp('^(' + CN + '{1,10}?)(新区|区|县|旗|市)');
const CITY_PREFIX_RE = new RegExp('^' + CN + '{2,10}?(自治州|地区|盟|市)(?=' + CN + ')');

/** 名称是否像一个正常的区县名 */
function cleanDistrict(name, suffix) {
  if (!name) return '';
  let n = name.replace(/(满族|回族|蒙古族|土家族|苗族|彝族|壮族|藏族|朝鲜族|哈尼族|傣族|白族|瑶族|侗族|畲族|锡伯族)?自治$/, '');
  if (!n || n.length > 4) return '';
  // 「高新区」「城区」等泛称区分不出门店位置，交给城市名兜底
  if (n === '高' || n === '城') return '';
  if (/(开发|管理|经济|技术|产业|工业|园|街道|小)$/.test(n)) return '';
  // 单字地名（如「城区」）保留后缀更易读
  return n.length === 1 ? n + suffix : n;
}

/** 城市字段兜底：「惠州市惠城区」→「惠城」，「汪清县」→「汪清」，「上饶市」→「上饶」 */
function shortCity(city) {
  if (!city) return '';
  const c = String(city).replace(/\s+/g, '');
  const m = c.match(new RegExp('^' + CN + '{2,10}?(市|州|盟|地区)(' + CN + '{1,8}?)(区|县|市|旗)$'));
  if (m) return cleanDistrict(m[2], m[3]) || c.slice(0, 2);
  return c.replace(/(市|县|地区|盟)$/, '');
}

function extractDistrict(address, province, city) {
  if (!address) return shortCity(city);
  let rest = String(address).replace(/[\s\-—,，.。:：]+/g, '');
  // 去掉接口给出的省、市全称
  [province, city].forEach((p) => {
    if (p && rest.indexOf(p) === 0) rest = rest.slice(p.length);
  });
  // 去掉地址里残留的省级前缀，以及城市字段缺「市」时残留的「市」
  rest = rest.replace(new RegExp('^' + CN + '{2,12}?(自治区|特别行政区|省)'), '').replace(/^市/, '');
  if (province) {
    const shortProv = String(province).replace(/(省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区)$/, '');
    if (shortProv && rest.indexOf(shortProv) === 0) rest = rest.slice(shortProv.length);
  }

  // 先尝试去掉「XX市」等地级前缀后匹配，失败再用原串匹配
  const candidates = [rest.replace(CITY_PREFIX_RE, ''), rest];
  for (let i = 0; i < candidates.length; i += 1) {
    const m = candidates[i].match(DISTRICT_RE);
    const name = m ? cleanDistrict(m[1], m[2]) : '';
    if (name) return name;
  }
  return shortCity(city);
}

Page({
  data: {
    stores: [],
    provinces: [],
    activeProvince: '',
    visibleCount: 0,
    loading: true,
    error: ''
  },

  onLoad() {
    this.fetchStores();
  },

  async fetchStores() {
    this.setData({ loading: true, error: '' });

    // 分页拉全：接口对 pageSize 有上限（当前 1000），不能靠一个大 pageSize 一次拿完。
    // 门店数继续增长时会自动翻页，直到取够 total 或某页返回不足一页为止。
    const PAGE_SIZE = 200;
    const MAX_PAGES = 50;
    let raw = [];
    let total = 0;
    let failed = '';

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await api.get('/stores', { pageSize: PAGE_SIZE, page }, { auth: false, loading: false });
      if (!res.ok) {
        failed = res.message || '加载失败';
        break;
      }
      const batch = (res.data && res.data.stores) ? res.data.stores : [];
      if (res.data && typeof res.data.total === 'number') total = res.data.total;
      raw = raw.concat(batch);
      if (batch.length < PAGE_SIZE || raw.length >= total) break;
    }

    // 一页都没拿到才算失败；已有部分数据时继续展示（避免少一家就整页报错）
    if (failed && raw.length === 0) {
      this.setData({ loading: false, error: failed });
      return;
    }

    // 统一门店展示名、去除电话
    const nameCount = {};
    const mapped = raw.map(s => {
      const area = extractDistrict(s.address, s.province, s.city) || '授权';
      nameCount[area] = (nameCount[area] || 0) + 1;
      const seq = nameCount[area];
      return {
        ...s,
        province: (s.province || '其他').trim(),
        display_name: '和膜 HAMOREY（' + area + (seq > 1 ? seq : '') + '店）',
        phone: ''  // 不展示电话
      };
    });

    // 按省份分组：保持省份首次出现顺序，同省门店相邻，避免省份标题重复出现
    const provinces = [];
    const groups = {};
    mapped.forEach(s => {
      if (!groups[s.province]) { groups[s.province] = []; provinces.push(s.province); }
      groups[s.province].push(s);
    });
    const list = [];
    provinces.forEach(p => { list.push(...groups[p]); });

    this.storeCountByProvince = {};
    provinces.forEach(p => { this.storeCountByProvince[p] = groups[p].length; });

    this.setData({ stores: list, provinces, activeProvince: '', visibleCount: list.length, loading: false });
  },

  filterProvince(e) {
    const p = e.currentTarget.dataset.province || '';
    const activeProvince = this.data.activeProvince === p ? '' : p;
    const visibleCount = activeProvince
      ? ((this.storeCountByProvince && this.storeCountByProvince[activeProvince]) || 0)
      : this.data.stores.length;
    this.setData({ activeProvince, visibleCount });
  },

  copyAddress(e) {
    const addr = e.currentTarget.dataset.address;
    if (!addr) return;
    wx.setClipboardData({
      data: addr,
      success: () => wx.showToast({ title: '地址已复制', icon: 'success' })
    });
  }
});
