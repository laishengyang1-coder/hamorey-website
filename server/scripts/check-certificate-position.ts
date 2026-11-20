// Run offline from the repository root: server/node_modules/.bin/tsx server/scripts/check-certificate-position.ts
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolveInstallPosition } from '../../functions/api/_install-position.ts';
import { buildCertificateSvg, type CertificateData } from '../../functions/api/_certificate.ts';
import { onRequestGet as publicDetails } from '../../functions/api/public/warranties.ts';
import { onRequestGet as publicSearch } from '../../functions/api/warranty-search.ts';

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE products (id TEXT, category TEXT);
  CREATE TABLE product_models (id TEXT, product_id TEXT, model_code TEXT, warranty_price_cents INTEGER);
  CREATE TABLE warranty_codes (id TEXT, code TEXT);
  CREATE TABLE warranty_records (
    id TEXT, certificate_no TEXT, warranty_code_id TEXT, product_model_id TEXT, product_name_snapshot TEXT,
    product_model_snapshot TEXT, warranty_years_snapshot INTEGER, installation_date TEXT, warranty_expiry_date TEXT,
    customer_name_snapshot TEXT, plate_no_snapshot TEXT, vin_snapshot TEXT, vehicle_brand_snapshot TEXT,
    vehicle_model_snapshot TEXT, store_name_snapshot TEXT, status TEXT
  );
  CREATE TABLE claim_parts (id TEXT, name TEXT, category TEXT, sort_order INTEGER);
  CREATE TABLE claim_prices (claim_part_id TEXT, product_model_id TEXT, price_cents INTEGER, status TEXT);
`);
const readOnlyDB = { prepare(sql: string) {
  const statement = db.prepare(sql);
  return { bind(...args: string[]) { return { all: async () => ({ results: statement.all(...args) }) }; } };
} };
const sharedMini = { exports: {} as { resolveInstallPosition: typeof resolveInstallPosition } };
runInNewContext(readFileSync(new URL('../../miniprogram/utils/install-position.js', import.meta.url), 'utf8'), { module: sharedMini });
const mini = { exports: {} as { installPosition(record?: object): string } };
runInNewContext(readFileSync(new URL('../../miniprogram/utils/warranty.js', import.meta.url), 'utf8'), {
  module: mini, require(id: string) { assert.equal(id, './install-position'); return sharedMini.exports; },
});
const cases = [
  ['混合旧快照', '和盾', 'ppf', '整车'],
  ['汽车膜', 'A', 'window_film', '车窗'],
  ['炫彩产品', 'B', 'prismatic_film', '车窗'],
  ['彩膜', 'C', 'color_ppf', '整车'],
  ['', '', 'sunroof_film', '天窗'],
  ['家居窗膜', '', 'architectural_film', '未注明'],
  ['兼容窗口', '和原75', '', '车窗'],
  ['和膜', 'WF-HZUN', '', '车窗'],
  ['炫彩', 'PRF-CQY', '', '车窗'],
  ['窗膜', '天窗冰甲 T2', '', '天窗'],
  ['', 'T1', '', '天窗'],
  ['TPU改色车衣', '苍穹青幻紫', '', '整车'],
  ['和真', 'HZ', '', '车窗'],
  ['和尊', 'HZ', '', '整车'],
  ['', 'WH7.5', '', '整车'],
  ['', 'HZ', '', '未注明'],
  ['', '', '', '未注明'],
] as const;

for (const [index, [name, model, category, expected]] of cases.entries()) {
  const id = String(index), code = 'TEST-CERT-' + id;
  if (category) {
    db.prepare('INSERT INTO products VALUES (?, ?)').run(id, category);
    db.prepare('INSERT INTO product_models VALUES (?, ?, ?, ?)').run(id, id, model, 0);
  }
  db.prepare('INSERT INTO warranty_codes VALUES (?, ?)').run(id, code);
  db.prepare("INSERT INTO warranty_records (id, certificate_no, warranty_code_id, product_model_id, product_name_snapshot, product_model_snapshot, status) VALUES (?, ?, ?, ?, ?, ?, 'active')")
    .run(id, code, id, id, name, model);

  const ctx = (query: string) => ({ request: new Request('https://example.test/' + query), env: { DB: readOnlyDB } });
  const detail = await publicDetails(ctx('?id=' + id) as never);
  const website = await publicSearch(ctx('?q=' + code) as never);
  assert.equal(detail.status, 200); assert.equal(website.status, 200);
  const [miniRow] = (await detail.json()).data.records;
  const [webRow] = (await website.json()).data.records;
  assert.equal(sharedMini.exports.resolveInstallPosition(name, model, category), expected, code);
  assert.equal(mini.exports.installPosition(miniRow), expected, code);
  assert.equal(webRow.install_position, expected, code);
  if (!category) {
    assert.equal(mini.exports.installPosition({ product_name_snapshot: name, product_model_snapshot: model }), expected);
    assert.equal(resolveInstallPosition(webRow.product_name, webRow.product_model), expected);
  }
  const svg = buildCertificateSvg({
    certificateNo: code, productName: name, productModel: model, productCategory: category,
    customerName: '', plateNo: '', vin: '', vehicleBrand: '', vehicleModel: '', storeName: '',
    installationDate: '2026-01-01', expiryDate: '2031-01-01', warrantyYears: 5,
  } satisfies CertificateData);
  assert.match(svg, new RegExp('>装贴部位</text><text [^>]+>' + expected + '</text>'));
}
db.close();
console.log(cases.length + ' synthetic warranty fixtures passed for website API, mini-program details and certificate SVG.');
