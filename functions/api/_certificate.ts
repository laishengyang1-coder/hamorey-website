// ============================================================
// Lightweight Chinese PDF certificate generator. (v2 高端版)
// 纯手写 PDF 1.4，零第三方依赖（Workers/Node 均可运行）。
// 支持：中英双语、品牌色排版、JPEG 印章嵌入（DCTDecode）。
// ============================================================

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
}

// ---- 颜色（0-1）----
const BURGUNDY: [number, number, number] = [0.361, 0.102, 0.102]; // #5C1A1A
const GOLD: [number, number, number] = [0.784, 0.663, 0.431]; // #C8A96E
const INK: [number, number, number] = [0.14, 0.11, 0.10]; // 正文深灰
const MUTED: [number, number, number] = [0.45, 0.42, 0.40]; // 副文本灰
const FAINT: [number, number, number] = [0.62, 0.60, 0.58]; // 浅灰英文

function rgb([r, g, b]: [number, number, number], stroke = false): string {
  return `${r} ${g} ${b} ${stroke ? 'RG' : 'rg'}`;
}

function utf16Hex(value: string): string {
  const normalized = String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[·•]/g, ' ').slice(0, 100);
  let result = '';
  for (let i = 0; i < normalized.length; i++) {
    result += normalized.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  }
  return result;
}

function escAscii(text: string): string {
  return text.replace(/([\\()])/g, '\\$1');
}

// font: F1 中文(STSong) / F2 英文(Helvetica) / F3 英文粗体(Helvetica-Bold)
function textLine(text: string, x: number, y: number, size: number, font = 'F1', color: [number, number, number] = INK): string {
  const encoded = font === 'F1' ? `<${utf16Hex(text)}>` : `(${escAscii(text)})`;
  return `${rgb(color)} BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm ${encoded} Tj ET`;
}

function isAscii(s: string): boolean {
  return /^[\x20-\x7E]+$/.test(s);
}

function normalizeDate(value: string): string {
  const v = String(value ?? '').trim();
  if (!v) return '-';
  // ISO 格式截取日期部分
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return v.slice(0, 16);
}

// 绘制字段行：中文 label（深灰）+ 英文 label（浅灰）| 值
function fieldRow(labelCn: string, labelEn: string, value: string, y: number): string[] {
  const normalized = String(value ?? '-').replace(/[·•]/g, ' ').slice(0, 60);
  const valueFont = isAscii(normalized) ? 'F2' : 'F1';
  return [
    textLine(labelCn, 44, y, 10, 'F1', MUTED),
    textLine(labelEn, 44, y - 11, 7.5, 'F2', FAINT),
    textLine(normalized, 205, y - 5, 10.5, valueFont, INK),
    // 底部细分隔线
    `${rgb(GOLD, true)} 0.3 w 44 ${y - 17} m 551 ${y - 17} l S`,
  ];
}

export function createCertificatePdf(data: CertificateData, sealJpeg?: Uint8Array | null): Uint8Array {
  const install = normalizeDate(data.installationDate);
  const expiry = normalizeDate(data.expiryDate);
  const issue = normalizeDate(data.issueDate || data.installationDate);

  const content: string[] = [];

  // ---- 金色外框（证书感）----
  content.push(`${rgb(GOLD, true)} 1.4 w 22 22 551 798 re S`);
  content.push(`${rgb(GOLD, true)} 0.5 w 28 28 539 786 re S`);

  // ---- 顶部品牌色块 ----
  content.push(`q ${rgb(BURGUNDY)} 40 758 515 52 re f Q`);
  // 品牌名（白）
  content.push(textLine('和膜', 60, 782, 21, 'F1', [1, 1, 1]));
  content.push(textLine('HAMOREY', 128, 782, 21, 'F3', [1, 1, 1]));
  // 右侧标题（白，右对齐手算位置）
  content.push(textLine('整车质保证书', 436, 790, 12, 'F1', [1, 1, 1]));
  content.push(textLine('WARRANTY CERTIFICATE', 436, 774, 8, 'F3', [0.95, 0.85, 0.72]));

  // ---- 证书编号 ----
  content.push(textLine('证书编号 Certificate No.', 44, 726, 9, 'F1', MUTED));
  content.push(textLine(data.certificateNo, 44, 702, 17, 'F3', BURGUNDY));
  content.push(`${rgb(GOLD, true)} 1.4 w 44 690 m 551 690 l S`);

  // ---- 字段区（中英双语）----
  const rows: Array<[string, string, string]> = [
    ['车主姓名', 'Owner Name', data.customerName],
    ['车牌号', 'License Plate No.', data.plateNo],
    ['车架号', 'VIN', data.vin || '-'],
    ['车辆品牌', 'Vehicle Brand', data.vehicleBrand],
    ['车辆型号', 'Vehicle Model', data.vehicleModel],
    ['产品名称', 'Product Name', data.productName],
    ['产品型号', 'Product Model', data.productModel],
    ['施工门店', 'Service Store', data.storeName],
    ['施工日期', 'Installation Date', install],
    ['质保到期', 'Warranty Expiry', expiry],
    ['质保年限', 'Warranty Period', `${data.warrantyYears} 年`],
  ];
  let y = 664;
  rows.forEach(([cn, en, val]) => {
    content.push(...fieldRow(cn, en, val, y));
    y -= 34;
  });

  // ---- 底部声明（中英双语）----
  content.push(textLine('本证书由和膜 HAMOREY 官方签发，可通过 hemoppf.cn 查询真伪。', 44, 236, 9, 'F1', MUTED));
  content.push(textLine('This certificate is officially issued by HAMOREY. Verify at www.hemoppf.cn.', 44, 222, 8, 'F2', FAINT));

  // ---- 签发信息（左下）----
  content.push(textLine('签发单位：和膜品牌运营中心', 44, 188, 9.5, 'F1', INK));
  content.push(textLine('Issued by HAMOREY Brand Operation Center', 44, 174, 7.5, 'F2', FAINT));
  content.push(textLine(`签发日期：${issue}`, 44, 156, 9.5, 'F1', INK));
  content.push(textLine(`Issue Date: ${issue}`, 44, 142, 7.5, 'F2', FAINT));

  // ---- 印章（右下，半透明）----
  const hasSeal = !!sealJpeg && sealJpeg.length > 0;
  if (hasSeal) {
    content.push('/GS1 gs q 118 0 0 116 392 88 cm /Im1 Do Q');
  }

  const streamText = content.join('\n');

  // ---- 组装 PDF 对象（字节级组装，偏移按字节；Uint8Array 兼容 Workers/Node）----
  const encoder = new TextEncoder();
  const sealW = sealJpeg ? 500 : 0;
  const sealH = sealJpeg ? 491 : 0;
  const imageObjId = 9;
  const extGStateId = 10;

  const textObjects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 7 0 R /F3 8 0 R >> /XObject << /Im1 ${imageObjId} 0 R >> /ExtGState << /GS1 ${extGStateId} 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${encoder.encode(streamText).length} >>\nstream\n${streamText}\nendstream`,
    '<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [6 0 R] >>',
    '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];

  const parts: Uint8Array[] = [encoder.encode('%PDF-1.4\n')];
  const offsets: number[] = [0];
  let pos = parts[0].length;

  const pushPart = (buf: Uint8Array) => { parts.push(buf); pos += buf.length; };

  // 对象 1-8（文本）
  textObjects.forEach((obj, i) => {
    const id = i + 1;
    offsets.push(pos);
    pushPart(encoder.encode(`${id} 0 obj\n${obj}\nendobj\n`));
  });

  // 对象 9：印章图片（JPEG 二进制，DCTDecode）
  if (hasSeal) {
    offsets.push(pos);
    pushPart(encoder.encode(`${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${sealW} /Height ${sealH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${sealJpeg!.length} >>\nstream\n`));
    pushPart(sealJpeg as Uint8Array);
    pushPart(encoder.encode('\nendstream\nendobj\n'));
  } else {
    offsets.push(pos);
    pushPart(encoder.encode(`${imageObjId} 0 obj\n<< >>\nendobj\n`));
  }

  // 对象 10：透明度
  offsets.push(pos);
  pushPart(encoder.encode(`${extGStateId} 0 obj\n<< /Type /ExtGState /ca 0.92 /CA 0.92 >>\nendobj\n`));

  const totalObjects = extGStateId;
  const xrefOffset = pos;
  let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjects; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pushPart(encoder.encode(xref));
  pushPart(encoder.encode(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));

  // 拼接全部字节
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}
