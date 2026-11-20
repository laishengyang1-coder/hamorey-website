// Run against a disposable MySQL 8 instance started with --skip-networking:
// node scripts/test-side-window-quota.mjs --socket /tmp/my-test-server/mysql.sock
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import mysql from 'mysql2/promise';
import { runQuotaChange } from './raise-side-window-quota.mjs';

const [option, socketPath, ...other] = process.argv.slice(2);
assert(option === '--socket' && socketPath && isAbsolute(socketPath) && !other.length,
  'Pass --socket with an absolute path to a disposable local MySQL socket.');
assert((await stat(socketPath)).isSocket(), 'The test requires a Unix socket.');
const socket = { socketPath, user: 'root', connectTimeout: 5000 };
const admin = await mysql.createConnection(socket);
const database = 'test_side_quota_' + randomBytes(9).toString('hex');
const connections = [];
let created = false;

// Independent expected catalogue, so dropping a model from the migration fails this test.
const sideModels = ['WF-HG25', 'WF-HD10', 'WF-HD35', 'WF-HH15', 'WF-HH35',
  'WF-HZ15', 'WF-HZ35', 'WF-HY10', 'WF-HY35'];
const first = sideModels[0];
const codes = [
  // id, owner, quota, cached approved uses, prior status, expected status at 20
  ['empty-unassigned', null, 15, 0, 'unallocated', 'unallocated'],
  ['empty-store', 'test-store', 15, 0, 'in_stock', 'in_stock'],
  ['empty-exhausted', null, 15, 0, 'exhausted', 'unallocated'],
  ['used-reopened', 'test-store', 15, 14, 'exhausted', 'partial_used'],
  ['pending-only', 'test-province', 15, 0, 'in_stock', 'partial_used'],
  ['history-19', 'test-province', 15, 15, 'exhausted', 'partial_used'],
  ['history-20', 'test-store', 15, 15, 'in_stock', 'exhausted'],
  ['history-21', 'test-store', 15, 15, 'exhausted', 'exhausted'],
  ['frozen-roll', 'test-province', 15, 2, 'frozen', 'frozen'],
  ['voided-roll', 'test-store', 15, 0, 'voided', 'voided'],
  ['race-last-place', 'test-store', 15, 15, 'exhausted', 'exhausted'],
  ['quota-1', 'test-store', 1, 0, 'in_stock', 'in_stock'],
  ['quota-18', 'test-store', 18, 0, 'in_stock', 'in_stock'],
  ['quota-20', 'test-store', 20, 0, 'in_stock', 'in_stock'],
  ['quota-26', 'test-store', 26, 0, 'in_stock', 'in_stock'],
];
// Span more than one inventory update and post-write verification batch.
for (let i = 0; i < 105; i++) {
  codes.push(['bulk-' + i, 'test-store', 15, 0, 'in_stock', 'in_stock']);
}
const targets = codes.filter((c) => c[2] === 15).length;

async function connectTest() {
  const db = await mysql.createConnection({ ...socket, database });
  connections.push(db);
  return db;
}

async function seed(db) {
  await db.query(`CREATE TABLE products (
    id VARCHAR(40) PRIMARY KEY, category VARCHAR(32) NOT NULL, status VARCHAR(16) NOT NULL
  ) ENGINE=InnoDB`);
  await db.query(`CREATE TABLE product_models (
    id VARCHAR(40) PRIMARY KEY, product_id VARCHAR(40) NOT NULL,
    model_code VARCHAR(40) NOT NULL UNIQUE, display_name VARCHAR(60), status VARCHAR(16) NOT NULL,
    usage_limit INT NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (product_id)
  ) ENGINE=InnoDB`);
  await db.query(`CREATE TABLE warranty_codes (
    id VARCHAR(40) PRIMARY KEY, code VARCHAR(60) UNIQUE, product_model_id VARCHAR(40) NOT NULL,
    usage_limit INT NOT NULL, owner_org_id VARCHAR(40), used_count INT NOT NULL,
    status VARCHAR(24) NOT NULL, INDEX (product_model_id)
  ) ENGINE=InnoDB`);
  await db.query(`CREATE TABLE warranty_records (
    id VARCHAR(60) PRIMARY KEY, warranty_code_id VARCHAR(40) NOT NULL, status VARCHAR(24) NOT NULL,
    INDEX (warranty_code_id)
  ) ENGINE=InnoDB`);
  await db.query("INSERT INTO products VALUES ('film','window_film','active'), ('wrap','color_ppf','active')");
  for (const [i, code] of sideModels.entries()) {
    await db.execute("INSERT INTO product_models (id,model_code,product_id,status,usage_limit) VALUES (?,?, 'film','active',?)",
      [code, code, i === 8 ? 20 : 15]);
  }
  for (const [code, product, state, limit] of [
    ['WF-HG70', 'film', 'active', 30], ['WF-HZUN', 'film', 'inactive', 15],
    ['WF-UNKNOWN15', 'film', 'active', 15], ['WRAP-15', 'wrap', 'active', 15],
  ]) {
    await db.execute('INSERT INTO product_models (id,model_code,product_id,status,usage_limit) VALUES (?,?,?,?,?)',
      [code, code, product, state, limit]);
    await db.execute("INSERT INTO warranty_codes VALUES (?,?,?,15,'unrelated-org',0,'in_stock')",
      ['excluded-' + code, 'roll-' + code, code]);
  }
  for (const [i, [id, owner, limit, cached, status]] of codes.entries()) {
    await db.execute('INSERT INTO warranty_codes VALUES (?,?,?,?,?,?,?)',
      [id, 'synthetic-' + id, sideModels[i % sideModels.length], limit, owner, cached, status]);
  }
  for (const [code, active, pending, expired, rejected, voided] of [
    ['used-reopened', 11, 1, 3, 1, 1], ['pending-only', 0, 1, 0, 1, 1],
    ['history-19', 12, 4, 3, 2, 2], ['history-20', 12, 5, 3, 2, 1],
    ['history-21', 12, 6, 3, 0, 1], ['frozen-roll', 1, 2, 1, 1, 0],
    ['empty-store', 0, 0, 0, 4, 1], ['race-last-place', 12, 4, 3, 0, 0],
  ]) {
    let sequence = 0;
    for (const [status, count] of Object.entries({ active, pending, expired, rejected, voided })) {
      for (let i = 0; i < count; i++) {
        await db.execute('INSERT INTO warranty_records VALUES (?,?,?)', [code + '-' + ++sequence, code, status]);
      }
    }
  }
}

async function rows(db, table) {
  const [result] = await db.query('SELECT * FROM ' + table + ' ORDER BY id');
  return result;
}

async function snapshot(db) {
  return {
    models: await rows(db, 'product_models'),
    codes: await rows(db, 'warranty_codes'),
    records: await rows(db, 'warranty_records'),
  };
}

try {
  const [[info]] = await admin.query('SELECT @@skip_networking AS offline, VERSION() AS version');
  assert.equal(Number(info.offline), 1, 'Use an isolated instance started with --skip-networking.');
  await admin.query('CREATE DATABASE ' + database);
  created = true;
  const a = await connectTest();
  const b = await connectTest();
  const liveWrite = await connectTest();
  await seed(a);
  const before = await snapshot(a);
  const preview = await runQuotaChange(a);
  assert.equal(preview.modelsChanged, 8);
  assert.equal(preview.codesChanged, targets);
  assert.deepEqual(await snapshot(a), before, 'Dry-run must leave every table unchanged');
  assert(!JSON.stringify(preview).includes('test-store') && !JSON.stringify(preview).includes('synthetic-'));

  await a.query(`CREATE TRIGGER stop_update BEFORE UPDATE ON warranty_codes FOR EACH ROW
    BEGIN IF OLD.id = 'voided-roll' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Injected test failure'; END IF; END`);
  await assert.rejects(runQuotaChange(a, { apply: true }));
  assert.deepEqual(await snapshot(b), before, 'All changes, including model defaults, must roll back together');
  await a.query('DROP TRIGGER stop_update');

  // A previously submitted twentieth registration is still uncommitted. The migration must see
  // its final committed state, including when two operators start the same migration together.
  await liveWrite.beginTransaction();
  await liveWrite.query("INSERT INTO warranty_records VALUES ('pending-during-change','race-last-place','pending')");
  const migrations = Promise.all([
    runQuotaChange(a, { apply: true }),
    runQuotaChange(b, { apply: true }),
  ]);
  const commitPending = new Promise((resolve) => setTimeout(resolve, 150)).then(() => liveWrite.commit());
  const [outcomes] = await Promise.all([migrations, commitPending]);
  assert.deepEqual(outcomes.map((x) => x.modelsChanged).sort((x, y) => x - y), [0, 8]);
  assert.deepEqual(outcomes.map((x) => x.codesChanged).sort((x, y) => x - y), [0, targets]);
  const after = await snapshot(a);
  for (const prior of before.models) {
    const updated = after.models.find((model) => model.id === prior.id);
    if (!sideModels.includes(prior.model_code) || prior.usage_limit === 20) assert.deepEqual(updated, prior);
    else assert.deepEqual({ ...updated, updated_at: prior.updated_at }, { ...prior, usage_limit: 20 });
  }
  for (const prior of before.codes) {
    const tested = codes.find(([id]) => id === prior.id);
    const expected = tested && prior.usage_limit === 15 ? { ...prior, usage_limit: 20, status: tested[5] } : prior;
    assert.deepEqual(after.codes.find((code) => code.id === prior.id), expected);
  }
  assert.deepEqual(after.records.filter((r) => r.id !== 'pending-during-change'), before.records);
  assert.equal(after.records.length, before.records.length + 1);
  const twice = await runQuotaChange(a, { apply: true });
  assert.equal(twice.modelsChanged, 0);
  assert.equal(twice.codesChanged, 0);
  assert.deepEqual(await snapshot(a), after, 'Idempotent retry must make no writes');

  await a.execute('UPDATE product_models SET usage_limit = 18 WHERE model_code = ?', [first]);
  await a.execute("INSERT INTO warranty_codes VALUES ('late-import','late-synthetic',?,15,NULL,0,'unallocated')", [first]);
  const lateImport = await runQuotaChange(a, { apply: true });
  assert.equal(lateImport.modelsChanged, 0);
  assert.equal(lateImport.codesChanged, 1);
  const [[customModel]] = await a.execute('SELECT usage_limit FROM product_models WHERE model_code = ?', [first]);
  assert.equal(customModel.usage_limit, 18);
  const [[lateCode]] = await a.query("SELECT usage_limit FROM warranty_codes WHERE id = 'late-import'");
  assert.equal(lateCode.usage_limit, 20);

  // The same stable catalogue identifier attached to the wrong product category must fail closed.
  await a.execute("UPDATE product_models SET product_id = 'wrap', usage_limit = 15 WHERE model_code = ?", [first]);
  const wrongCategory = await snapshot(a);
  await assert.rejects(runQuotaChange(a, { apply: true }));
  assert.deepEqual(await snapshot(a), wrongCategory);
  console.log('PASS MySQL ' + info.version + ': read-only preview, rollback, concurrent registration and two applies, ' +
    '9 side models, scope exclusions, boundaries at 19/20/21, frozen and voided states, history preservation, and zero-write retry.');
} finally {
  try {
    for (const connection of connections) await connection.end();
    if (created) await admin.query('DROP DATABASE ' + database);
  } finally {
    await admin.end();
  }
}
