// Run with server/node_modules/.bin/tsx server/scripts/test-certificate-recovery.ts /absolute/local/mysql.sock
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { createD1Database } from '../src/adapters/d1';
import { issueQueuedCertificate, validInstallDate, warrantyExpiry } from '../../functions/api/_certificate-workflow';
import { onRequestPut as adminEdit } from '../../functions/api/admin/warranty-records-[id]';
import { onRequestPut as provinceEdit } from '../../functions/api/province/warranty-records-[id]';
import { onRequestPost as approve } from '../../functions/api/admin/reviews-[id]';
import { onRequestGet as download } from '../../functions/api/public/certificates';
import { runAutoApprove } from '../src/auto-approve';
import { recoverCertificates } from '../src/certificate-recovery';

const [, , socketPath, childDatabase] = process.argv;
assert(isAbsolute(socketPath) && (await stat(socketPath)).isSocket(), 'Requires an isolated local MySQL socket');
const database = childDatabase || 'test_certificate_' + randomUUID().replaceAll('-', '');
assert(/^test_certificate_[a-f0-9]{32}$/.test(database));
const options = {socketPath, user:'root', timezone:'Z'};
const instance = mysql.createPool({...options, database});
const DB = createD1Database(instance);
const files = new Map<string, Buffer>();
let failCos = false;
const R2 = {
  async put(key: string, body: Uint8Array) {
    if (failCos) throw new Error('simulated COS 451');
    files.set(key, Buffer.from(body));
    return { key };
  },
  async get(key: string) {
    return files.has(key) ? {body: files.get(key),httpMetadata:{contentType:'image/png'}} : null;
  },
};
const env = { DB, R2 } as any;
async function sql(s: string, args: unknown[] = []) {
  const [rows] = await instance.query(s, args);
  return rows as any[];
}
async function count(table: string) { return Number((await sql('SELECT COUNT(*) n FROM ' + table))[0].n); }
async function main() {
  if (childDatabase) {
    const result = await issueQueuedCertificate(env, 'w1', async data => {
      await sql("INSERT INTO image_calls (payload) VALUES (?)", [JSON.stringify(data)]);
      await new Promise(resolve => setTimeout(resolve, 80));
      return Buffer.from('test image');
    });
    console.log(result ? 'published' : 'skipped');
    return;
  }
  const admin = await mysql.createConnection(options);
  await admin.query('CREATE DATABASE ' + database + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  try {
    for (const schema of [
      `CREATE TABLE warranty_records (
        id VARCHAR(191) PRIMARY KEY, status VARCHAR(32), certificate_no VARCHAR(128), product_model_id VARCHAR(60),
        warranty_code_id VARCHAR(60), store_id VARCHAR(60),province_org_id VARCHAR(60),approved_by VARCHAR(60),
        installation_date DATETIME, warranty_expiry_date DATETIME, approved_at DATETIME, created_at DATETIME,
        updated_at DATETIME, customer_name_snapshot VARCHAR(60), customer_phone_snapshot VARCHAR(60),
        plate_no_snapshot VARCHAR(60), vin_snapshot VARCHAR(60), vehicle_brand_snapshot VARCHAR(60),
        vehicle_model_snapshot VARCHAR(60), product_name_snapshot VARCHAR(60), product_model_snapshot VARCHAR(60),
        store_name_snapshot VARCHAR(60), warranty_years_snapshot INT, store_points_awarded INT, province_points_awarded INT)`,
      `CREATE TABLE certificate_files (id VARCHAR(191) PRIMARY KEY,warranty_record_id VARCHAR(191),file_key VARCHAR(255),
        file_url VARCHAR(255),version INT,generated_by VARCHAR(60),created_at DATETIME)`,
      `CREATE TABLE operation_logs (id VARCHAR(191) PRIMARY KEY,user_id VARCHAR(60),action VARCHAR(60),target_type VARCHAR(60),
        target_id VARCHAR(60),detail_json TEXT,ip_address VARCHAR(60),created_at DATETIME)`,
      `CREATE TABLE warranty_audit_logs (id VARCHAR(191) PRIMARY KEY,warranty_record_id VARCHAR(60),action VARCHAR(60),
        from_status VARCHAR(60),to_status VARCHAR(60),note TEXT,operator_user_id VARCHAR(60),created_at DATETIME)`,
      `CREATE TABLE points_ledger (id VARCHAR(191) PRIMARY KEY,organization_id VARCHAR(60),change_type VARCHAR(60),
        points_change INT,frozen_change INT,related_type VARCHAR(60),related_id VARCHAR(60),reason TEXT,
        operator_user_id VARCHAR(60), created_at DATETIME)`,
      'CREATE TABLE warranty_codes (id VARCHAR(60) PRIMARY KEY,code VARCHAR(60),status VARCHAR(60),usage_limit INT,used_count INT)',
      'CREATE TABLE products (id VARCHAR(60) PRIMARY KEY,category VARCHAR(60))',
      'CREATE TABLE product_models (id VARCHAR(60) PRIMARY KEY,product_id VARCHAR(60),warranty_price_cents INT)',
      'CREATE TABLE claim_parts (id VARCHAR(60),name VARCHAR(60),category VARCHAR(60),sort_order INT)',
      'CREATE TABLE claim_prices (product_model_id VARCHAR(60),claim_part_id VARCHAR(60),price_cents INT,status VARCHAR(60))',
      'CREATE TABLE organizations (id VARCHAR(60) PRIMARY KEY, parent_id VARCHAR(60),points_exempt INT)',
      'CREATE TABLE points_rules (product_model_id VARCHAR(60),points INT,status VARCHAR(60), effective_from DATETIME,effective_to DATETIME)',
      'CREATE TABLE rebate_rules (product_model_id VARCHAR(60),is_global INT,rebate_ratio DOUBLE,status VARCHAR(60),effective_from DATETIME,effective_to DATETIME)',
      'CREATE TABLE image_calls (payload TEXT)',
    ]) await sql(schema);
    const migration = await readFile(new URL('../../migrations/phase18_certificate_jobs.mysql.sql', import.meta.url), 'utf8');
    await sql(migration);
    await sql(migration);
    for (const statement of [
      "INSERT INTO products VALUES ('p','ppf')", "INSERT INTO product_models VALUES ('m','p',168050)",
      "INSERT INTO warranty_codes VALUES ('c','TEST-ROLL','partial_used',20,18)",
      "INSERT INTO organizations VALUES ('store','province',0), ('province',NULL,0)",
      "INSERT INTO points_rules VALUES ('m',10,'active','2020-01-01',NULL)",
      "INSERT INTO rebate_rules VALUES ('m',0,0.1,'active','2020-01-01',NULL)",
      `INSERT INTO warranty_records (id,status,product_model_id,warranty_code_id,store_id,province_org_id,installation_date,
        created_at,warranty_years_snapshot,customer_name_snapshot,customer_phone_snapshot,store_name_snapshot,
        vehicle_brand_snapshot,vehicle_model_snapshot,product_name_snapshot,product_model_snapshot)
        VALUES ('w1','pending','m','c','store','province','2024-02-29','2025-01-01',2,'测试','','测试门店','测试','测试','测试产品','测试型号')`,
    ]) await sql(statement);
    const user = { role:'HQ_ADMIN', userId:'adm', orgId:'hq' };
    function context(path: string, body: object, actor = user) {
      return { request: new Request('http://localhost/api/'+path,{method:'POST',body:JSON.stringify(body)}), env,
        data:{currentUser:actor} } as any;
    }
    async function publicCert() {
      const no = (await sql("SELECT certificate_no FROM warranty_records"))[0].certificate_no;
      return await download(context('public/certificates/'+no+'/download',{})) as Response;
    }
    assert(!validInstallDate('2026-02-30'));
    assert.equal(warrantyExpiry('2024-02-29',2),'2026-03-01');
    failCos = true;
    const req = () => approve(context('admin/reviews/w1/approve',{}));
    await Promise.all([req(), req(), runAutoApprove(env)]);
    assert.equal(await count('warranty_audit_logs'),1);
    assert.equal(await count('points_ledger'),2);
    assert.deepEqual((await sql('SELECT used_count,status FROM warranty_codes'))[0],{used_count:19,status:'partial_used'});
    assert.equal(await count('certificate_files'),0);
    assert.equal((await sql('SELECT attempts FROM certificate_jobs'))[0].attempts,1);
    assert.equal((await publicCert()).status,503);
    assert.equal((await sql("SELECT COUNT(*) n FROM operation_logs WHERE action='certificate_retry_alert'"))[0].n,1);
    const no = (await sql('SELECT certificate_no FROM warranty_records'))[0].certificate_no;
    await recoverCertificates(env); // not due yet
    assert.equal((await sql('SELECT attempts FROM certificate_jobs'))[0].attempts,1);
    failCos = false;
    await sql('UPDATE certificate_jobs SET next_attempt_at=NOW()');
    await recoverCertificates(env);
    assert.equal(await count('certificate_jobs'),0);
    const initial = await publicCert();
    assert.equal(initial.status,200);
    assert.equal(Buffer.from(await initial.arrayBuffer()).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const foreign = { role:'PROVINCE', userId:'pv', orgId:'another' };
    assert.equal((await provinceEdit(context('province/warranty-records/w1',{installation_date:'2025-05-06'},foreign))).status,404);
    assert.equal((await adminEdit(context('admin/warranty-records/w1',{installation_date:'2025-02-30'}))).status,400);
    await adminEdit(context('admin/warranty-records/w1',{customer_phone:'fixture',installation_date:'2024-02-29T00:00:00.000Z'}));
    assert.equal(await count('certificate_files'),1);
    failCos = true;
    const goodProvince = {...foreign,orgId:'province'};
    const edit = await provinceEdit(context('province/warranty-records/w1',{installation_date:'2025-05-06'},goodProvince));
    assert.equal((await edit.json() as any).data.certificatePending,true);
    assert.equal((await publicCert()).status,503);
    assert.equal((await sql("SELECT DATE_FORMAT(warranty_expiry_date,'%Y-%m-%d') d FROM warranty_records"))[0].d,'2027-05-06');
    assert.equal(await count('certificate_files'),1);
    await sql("UPDATE certificate_jobs SET next_attempt_at=NOW()");
    const tsx = fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url));
    const children = await Promise.all(Array.from({length:4},() =>
      promisify(execFile)(process.execPath,[tsx,fileURLToPath(import.meta.url),socketPath,database])));
    assert.equal(children.filter(child => child.stdout.includes('published')).length,1);
    assert.equal(await count('image_calls'),1);
    const payload = JSON.parse((await sql('SELECT payload FROM image_calls'))[0].payload);
    assert.equal(payload.certificateNo,no);
    assert.equal(payload.installationDate,'2025-05-06');
    assert.equal(payload.expiryDate,'2027-05-06');
    const approvedDay = (await sql("SELECT DATE_FORMAT(approved_at,'%Y-%m-%d') day FROM warranty_records"))[0].day;
    assert.equal(payload.issueDate,approvedDay);
    assert.equal(payload.warrantyPriceCents,168050);
    assert.deepEqual((await sql('SELECT version FROM certificate_files ORDER BY version')).map(r=>r.version),[1,2]);
    assert.equal(await count('points_ledger'),2);
    assert.equal(await count('certificate_jobs'),0);

    // A failed database index write after object upload retries the same immutable key.
    failCos = false;
    await sql("CREATE TRIGGER deny_index BEFORE INSERT ON certificate_files FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test interruption'");
    const interrupted = await adminEdit(context('admin/warranty-records/w1',{plate_no:'测试更新'}));
    assert.equal((await interrupted.json() as any).data.certificatePending,true);
    const orphanKey = [...files.keys()].at(-1);
    assert.equal(await count('certificate_files'),2);
    assert.equal(await count('certificate_jobs'),1);
    await sql('DROP TRIGGER deny_index');
    await recoverCertificates(env);
    assert.equal((await sql('SELECT file_key FROM certificate_files WHERE version=3'))[0].file_key,orphanKey);
    assert.equal(await count('certificate_jobs'),0);
    assert.equal((await publicCert()).status,200);
    await sql('DELETE FROM certificate_files'); // Simulate a pre-migration interrupted approval with no job.
    await recoverCertificates(env);
    assert.equal(await count('certificate_files'),1);
    assert.equal(await count('points_ledger'),2);
    assert.equal(await count('warranty_audit_logs'),1);
    assert.equal((await sql('SELECT certificate_no FROM warranty_records'))[0].certificate_no,no);
    console.log('PASS MySQL: concurrent approval and quota, storage failure and backoff, actual PNG download, scoped edits, four-process signing, interrupted indexing, legacy recovery');
  } finally {
    await admin.query('DROP DATABASE ' + database);
    await admin.end();
  }
}
try { await main(); } finally { await instance.end(); }
