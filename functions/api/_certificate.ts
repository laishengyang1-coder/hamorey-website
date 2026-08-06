// ============================================================
// 和膜 HAMOREY — 质保证书长图生成器（SVG → PNG）
// 参考 shark 质保卡设计：品牌头 + 产品卡 + 商品/车主/施工信息
// + 部位价值参考表 + 质保须知 + 除外情形 + 印章 + 服务信息
// 依赖：sharp（Node native，server 运行时加载；中文字体 fonts-noto-cjk）
// ============================================================

export interface PartPriceItem {
  name: string;
  priceCents: number;
}

export interface CertificateData {
  certificateNo: string;
  customerName: string;
  plateNo: string;
  vin: string;
  vehicleBrand: string;
  vehicleModel: string;
  productName: string;
  productModel: string;
  storeName: string;
  installationDate: string;
  expiryDate: string;
  warrantyYears: number;
  issueDate?: string;
  warrantyCode?: string;
  warrantyPriceCents?: number | null;
  partPrices?: PartPriceItem[];
}

const FONT = "'Noto Sans CJK SC','Noto Sans SC','WenQuanYi Zen Hei',sans-serif";
const BRAND = '#5C1A1A';
const GOLD = '#C8A96E';
const INK = '#1A1412';
const MUTED = '#736F6D';
const FAINT = '#9E9A98';
const BG_ALT = '#F5EDE9';
const BORDER = '#E8DDD8';
const W = 800;
const PAD = 30;

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(s: string): string {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtPrice(cents?: number | null): string {
  if (cents == null) return '-';
  return `¥${Math.round(cents / 100).toLocaleString('zh-CN')}`;
}

function buildSvg(data: CertificateData, sealBase64?: string | null): string {
  const parts: string[] = [];
  let y = 0;

  // ---- 品牌头 ----
  const HEADER_H = 110;
  parts.push(`<rect x="0" y="0" width="${W}" height="${HEADER_H}" fill="${BRAND}"/>`);
  parts.push(`<text x="${PAD}" y="48" font-family="${FONT}" font-size="30" font-weight="700" fill="#FFFFFF">和膜 HAMOREY</text>`);
  parts.push(`<text x="${PAD}" y="78" font-family="${FONT}" font-size="14" fill="#E8D5C5">汽车膜品质保障 · 电子质保证书</text>`);
  parts.push(`<text x="${W - PAD}" y="48" font-family="${FONT}" font-size="13" fill="${GOLD}" text-anchor="end" letter-spacing="2">WARRANTY CERTIFICATE</text>`);
  y = HEADER_H + 22;

  // ---- 产品卡 ----
  const PROD_H = 90;
  parts.push(`<rect x="${PAD}" y="${y}" width="${W - 2 * PAD}" height="${PROD_H}" rx="8" fill="${BG_ALT}"/>`);
  parts.push(`<text x="${PAD + 20}" y="${y + 36}" font-family="${FONT}" font-size="20" font-weight="700" fill="${BRAND}">${esc(data.productName)}</text>`);
  parts.push(`<text x="${PAD + 20}" y="${y + 64}" font-family="${FONT}" font-size="14" fill="${MUTED}">${esc(data.productModel)}</text>`);
  parts.push(`<text x="${W - PAD - 20}" y="${y + 32}" font-family="${FONT}" font-size="11" fill="${FAINT}" text-anchor="end">质保编码</text>`);
  parts.push(`<text x="${W - PAD - 20}" y="${y + 58}" font-family="${FONT}" font-size="15" font-weight="700" fill="${BRAND}" text-anchor="end">${esc(data.certificateNo)}</text>`);
  y += PROD_H + 24;

  // ---- 信息分组辅助 ----
  function section(title: string, rows: Array<[string, string]>, rowH = 30): void {
    parts.push(`<text x="${PAD}" y="${y + 4}" font-family="${FONT}" font-size="15" font-weight="700" fill="${BRAND}">${esc(title)}</text>`);
    y += 16;
    const cardH = rows.length * rowH + 14;
    parts.push(`<rect x="${PAD}" y="${y}" width="${W - 2 * PAD}" height="${cardH}" rx="6" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1"/>`);
    rows.forEach(([k, v], i) => {
      const ry = y + 22 + i * rowH;
      parts.push(`<text x="${PAD + 16}" y="${ry}" font-family="${FONT}" font-size="13" fill="${MUTED}">${esc(k)}</text>`);
      parts.push(`<text x="${PAD + 140}" y="${ry}" font-family="${FONT}" font-size="13" fill="${INK}">${esc(v)}</text>`);
    });
    y += cardH + 20;
  }

  // ---- 商品信息 ----
  section('商品信息', [
    ['车膜卷号', data.warrantyCode || '-'],
    ['型号规格', `${data.productName} ${data.productModel}`],
    ['装贴部位', '整车'],
    ['官方指导价', fmtPrice(data.warrantyPriceCents)],
    ['质保期限', `${data.warrantyYears} 年（${fmtDate(data.installationDate)} 至 ${fmtDate(data.expiryDate)}）`],
  ]);

  // ---- 车主信息 ----
  section('车主信息', [
    ['车主姓名', data.customerName || '-'],
    ['品牌车型', `${data.vehicleBrand || '-'} ${data.vehicleModel || ''}`],
    ['车牌号码', data.plateNo || '-'],
    ['车架号码', data.vin || '-'],
  ]);

  // ---- 施工信息 ----
  section('施工信息', [
    ['施工日期', fmtDate(data.installationDate)],
    ['质保录入单位', data.storeName || '-'],
  ]);

  // ---- 常见部位价值参考表 ----
  if (data.partPrices && data.partPrices.length > 0) {
    parts.push(`<text x="${PAD}" y="${y + 4}" font-family="${FONT}" font-size="15" font-weight="700" fill="${BRAND}">常见部位价值参考</text>`);
    parts.push(`<text x="${W - PAD}" y="${y + 4}" font-family="${FONT}" font-size="10" fill="${FAINT}" text-anchor="end">部位占比及价值仅供参考，以实际安装部位为准</text>`);
    y += 16;
    const items = data.partPrices;
    const colCount = 2;
    const rowCount = Math.ceil(items.length / colCount);
    const rowH = 28;
    const colW = (W - 2 * PAD) / colCount;
    const tableH = (rowCount + 1) * rowH;
    parts.push(`<rect x="${PAD}" y="${y}" width="${W - 2 * PAD}" height="${tableH}" rx="6" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1"/>`);
    for (let c = 0; c < colCount; c++) {
      const cx = PAD + c * colW;
      parts.push(`<text x="${cx + 16}" y="${y + 19}" font-family="${FONT}" font-size="12" font-weight="700" fill="${BRAND}">部位</text>`);
      parts.push(`<text x="${cx + colW - 16}" y="${y + 19}" font-family="${FONT}" font-size="12" font-weight="700" fill="${BRAND}" text-anchor="end">价值</text>`);
    }
    parts.push(`<line x1="${PAD}" y1="${y + rowH}" x2="${W - PAD}" y2="${y + rowH}" stroke="${BORDER}" stroke-width="1"/>`);
    items.forEach((item, i) => {
      const c = i % colCount;
      const r = Math.floor(i / colCount);
      const cx = PAD + c * colW;
      const ry = y + 19 + (r + 1) * rowH;
      parts.push(`<text x="${cx + 16}" y="${ry}" font-family="${FONT}" font-size="12" fill="${INK}">${esc(item.name)}</text>`);
      parts.push(`<text x="${cx + colW - 16}" y="${ry}" font-family="${FONT}" font-size="12" fill="${MUTED}" text-anchor="end">${fmtPrice(item.priceCents)}</text>`);
    });
    y += tableH + 20;
  }

  // ---- 质保须知 ----
  parts.push(`<text x="${PAD}" y="${y + 4}" font-family="${FONT}" font-size="15" font-weight="700" fill="${BRAND}">质保须知</text>`);
  y += 20;
  const notices = [
    '1. 本质保仅对和膜品牌正品汽车膜产品有效，质保期内出现非人为质量问题可享免费维修或更换。',
    '2. 质保服务须通过和膜官方渠道或授权施工门店申请，请妥善保存本质保凭证。',
  ];
  notices.forEach((t) => {
    parts.push(`<text x="${PAD}" y="${y + 16}" font-family="${FONT}" font-size="11" fill="${MUTED}">${esc(t)}</text>`);
    y += 22;
  });
  y += 8;

  // ---- 除外情形 ----
  parts.push(`<text x="${PAD}" y="${y + 4}" font-family="${FONT}" font-size="15" font-weight="700" fill="${BRAND}">质保范围除外情形</text>`);
  y += 20;
  const exclusions = [
    '• 因交通事故、碰撞、划伤等外力导致的损坏；',
    '• 因非授权门店施工或施工技术不当导致的问题；',
    '• 因特殊漆面（哑光、电镀漆等）或使用环境异常导致的异常；',
    '• 因未按产品使用说明维护保养导致的损坏。',
  ];
  exclusions.forEach((t) => {
    parts.push(`<text x="${PAD}" y="${y + 16}" font-family="${FONT}" font-size="11" fill="${MUTED}">${esc(t)}</text>`);
    y += 22;
  });
  y += 12;

  // ---- 印章（右下角）----
  if (sealBase64) {
    const sealSize = 100;
    parts.push(`<image x="${W - PAD - sealSize}" y="${y - sealSize - 6}" width="${sealSize}" height="${sealSize}" href="data:image/jpeg;base64,${sealBase64}" opacity="0.92"/>`);
  }

  // ---- 底部 ----
  y += 6;
  const FOOTER_H = 52;
  parts.push(`<rect x="0" y="${y}" width="${W}" height="${FOOTER_H}" fill="${BRAND}"/>`);
  parts.push(`<text x="${PAD}" y="${y + 22}" font-family="${FONT}" font-size="12" fill="#FFFFFF">服务电话：400-888-0000</text>`);
  parts.push(`<text x="${PAD}" y="${y + 40}" font-family="${FONT}" font-size="10" fill="#E8D5C5">质保卡生成于 ${esc(new Date().toLocaleString('zh-CN'))}</text>`);
  parts.push(`<text x="${W - PAD}" y="${y + 30}" font-family="${FONT}" font-size="11" fill="${GOLD}" text-anchor="end">和膜品牌运营中心</text>`);
  y += FOOTER_H;

  const totalH = y + 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}"><rect width="${W}" height="${totalH}" fill="#FFFFFF"/>${parts.join('')}</svg>`;
}

/**
 * 生成质保证书长图 PNG
 * 依赖 sharp（Node native 模块）+ 系统中文字体（fonts-noto-cjk）
 */
export async function createCertificateImage(data: CertificateData, sealJpeg?: Uint8Array | null): Promise<Uint8Array> {
  // @ts-ignore - sharp 是 Node native 模块，在 server 运行时加载（functions tsconfig 为 Workers 环境）
  const sharp = (await import('sharp')).default as typeof import('sharp');
  const sealBase64 = sealJpeg ? Buffer.from(sealJpeg as Uint8Array).toString('base64') : null;
  const svg = buildSvg(data, sealBase64);
  const png = await sharp(Buffer.from(svg, 'utf-8')).png().toBuffer();
  return new Uint8Array(png);
}
