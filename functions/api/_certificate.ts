// ============================================================
// Lightweight Chinese PDF certificate generator.
// Uses the standard STSong CID font so Workers do not need a large font asset.
// ============================================================

interface CertificateData {
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
}

function utf16Hex(value: string): string {
  const normalized = value.replace(/[\r\n]+/g, ' ').replace(/[·•]/g, ' ').slice(0, 100);
  let result = '';
  for (let i = 0; i < normalized.length; i++) {
    result += normalized.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  }
  return result;
}

function textLine(text: string, x: number, y: number, size: number, font = 'F1'): string {
  const encoded = font === 'F2'
    ? `(${text.replace(/([\\()])/g, '\\$1')})`
    : `<${utf16Hex(text)}>`;
  return `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm ${encoded} Tj ET`;
}

function fieldLine(label: string, value: string, y: number): string[] {
  const normalized = value.replace(/[·•]/g, ' ');
  const valueFont = /^[\x20-\x7E]+$/.test(normalized) ? 'F2' : 'F1';
  return [
    textLine(`${label}：`, 50, y, 12),
    textLine(normalized, 155, y, 12, valueFont),
  ];
}

export function createCertificatePdf(data: CertificateData): Uint8Array {
  const lines = [
    ['证书编号', data.certificateNo],
    ['车主姓名', data.customerName],
    ['车牌号', data.plateNo],
    ['车架号 VIN', data.vin || '-'],
    ['车辆品牌', data.vehicleBrand],
    ['车辆型号', data.vehicleModel],
    ['产品名称', data.productName],
    ['产品型号', data.productModel],
    ['施工门店', data.storeName],
    ['施工日期', data.installationDate],
    ['质保到期', data.expiryDate],
    ['质保年限', `${data.warrantyYears} 年`],
  ];

  const content: string[] = [
    'q 1 1 1 rg 0 0 595 842 re f Q',
    '0 0 0 rg 0 0 0 RG',
    textLine('和膜', 50, 790, 24),
    textLine('HAMOREY', 115, 790, 24, 'F2'),
    textLine('整车质保证书', 50, 752, 18),
    '0.75 w 50 730 m 545 730 l S',
  ];
  lines.forEach(([label, value], index) => {
    content.push(...fieldLine(label, String(value), 695 - index * 28));
  });
  content.push(textLine('本证书由和膜 HAMOREY 官方签发，可通过 hemoppf.com 查询真伪。', 50, 335, 10));

  const stream = content.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 7 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [6 0 R] >>',
    '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
