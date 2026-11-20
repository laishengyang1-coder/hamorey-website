import { pathToFileURL } from 'node:url';

export const SIDE_MODELS = Object.freeze([
  'WF-HD10', 'WF-HD35', 'WF-HG25', 'WF-HH15', 'WF-HH35',
  'WF-HY10', 'WF-HY35', 'WF-HZ15', 'WF-HZ35',
]);

const OLD_LIMIT = 15;
const NEW_LIMIT = 20;
const BATCH_SIZE = 100;
const CODE_STATUSES = new Set(['unallocated', 'in_stock', 'partial_used', 'exhausted', 'frozen', 'voided']);
const OCCUPIED = new Set(['pending', 'active', 'expired']);

class QuotaCheckError extends Error {}

function check(condition, message) {
  if (!condition) throw new QuotaCheckError(message);
}

function placeholders(rows) {
  return rows.map(() => '?').join(', ');
}

function batches(items) {
  const result = [];
  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    result.push(items.slice(start, start + BATCH_SIZE));
  }
  return result;
}

async function checkStorage(connection) {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME AS name, ENGINE AS engine FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('products', 'product_models', 'warranty_codes', 'warranty_records')`,
  );
  check(tables.length === 4 && tables.every(row => row.engine === 'InnoDB'),
    'All four business tables must use InnoDB.');

  // A keyed range read also protects empty ranges from new records under REPEATABLE READ.
  // Require an appropriate index instead of scanning and locking unrelated inventory.
  const [rows] = await connection.query(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, INDEX_NAME AS index_name
     FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND SEQ_IN_INDEX = 1
       AND ((TABLE_NAME = 'product_models' AND COLUMN_NAME = 'model_code')
         OR (TABLE_NAME = 'warranty_codes' AND COLUMN_NAME = 'product_model_id')
         OR (TABLE_NAME = 'warranty_records' AND COLUMN_NAME = 'warranty_code_id'))
     ORDER BY TABLE_NAME, NON_UNIQUE, INDEX_NAME`,
  );
  const indexes = new Map();
  for (const row of rows) {
    check(/^[A-Za-z0-9_$]+$/.test(row.index_name), 'Unexpected index identifier.');
    if (!indexes.has(row.table_name)) indexes.set(row.table_name, '`' + row.index_name + '`');
  }
  check(indexes.size === 3, 'Targeted model, inventory and record indexes are required.');
  return indexes;
}

async function getModels(connection, indexes, lock) {
  const models = [];
  for (const code of SIDE_MODELS) {
    const [rows] = await connection.execute(
      `SELECT pm.id, pm.model_code, pm.usage_limit
       FROM product_models pm FORCE INDEX (${indexes.get('product_models')})
       STRAIGHT_JOIN products p ON p.id = pm.product_id
       WHERE pm.model_code = ? AND pm.status = 'active' AND p.category = 'window_film'${lock}`, [code],
    );
    check(rows.length === 1 && rows[0].model_code === code, 'Expected exactly nine active, explicitly identified side-window models.');
    models.push(rows[0]);
  }
  return models;
}

async function getCandidates(connection, indexes, models, lock) {
  const codes = [];
  for (const model of models) {
    const [rows] = await connection.execute(
      `SELECT id, product_model_id, owner_org_id, status, used_count
       FROM warranty_codes FORCE INDEX (${indexes.get('warranty_codes')})
       WHERE product_model_id = ? AND usage_limit = ? ORDER BY id${lock}`, [model.id, OLD_LIMIT],
    );
    codes.push(...rows);
  }
  return codes;
}

async function getOccupiedCounts(connection, indexes, codes, apply) {
  const counts = new Map();
  const ids = codes.map(code => code.id).sort();
  for (const group of batches(ids)) {
    // Lock every status, including the indexed gap for a code without records. A rejected
    // record can become pending concurrently. No customer or vehicle fields are selected.
    const [rows] = await connection.execute(
      `SELECT warranty_code_id, status FROM warranty_records FORCE INDEX (${indexes.get('warranty_records')})
       WHERE warranty_code_id IN (${placeholders(group)})
       ORDER BY warranty_code_id, id${apply ? ' FOR SHARE' : ''}`, group,
    );
    for (const row of rows) {
      if (OCCUPIED.has(row.status)) counts.set(row.warranty_code_id, (counts.get(row.warranty_code_id) || 0) + 1);
    }
  }
  return counts;
}

function nextStatus(code, occupied) {
  check(CODE_STATUSES.has(code.status), 'Unexpected warranty-code status.');
  if (code.status === 'frozen' || code.status === 'voided') return code.status;
  if (occupied >= NEW_LIMIT) return 'exhausted';
  if (occupied > 0) return 'partial_used';
  return code.owner_org_id === null ? 'unallocated' : 'in_stock';
}

async function writeAndVerify(connection, models, codes) {
  for (const model of models) {
    const [result] = await connection.execute(
      'UPDATE product_models SET usage_limit = ?, updated_at = NOW() WHERE id = ? AND usage_limit = ?',
      [NEW_LIMIT, model.id, OLD_LIMIT],
    );
    check(result.affectedRows === 1, 'Model write count changed.');
  }

  for (const status of CODE_STATUSES) {
    const matching = codes.filter(code => code.next_status === status);
    for (const group of batches(matching)) {
      const [result] = await connection.execute(
        `UPDATE warranty_codes SET usage_limit = ?, status = ?
         WHERE usage_limit = ? AND id IN (${placeholders(group)})`,
        [NEW_LIMIT, status, OLD_LIMIT, ...group.map(code => code.id)],
      );
      check(result.affectedRows === group.length, 'Inventory write count changed.');
    }
  }

  if (models.length) {
    const [rows] = await connection.execute(
      `SELECT id, usage_limit FROM product_models WHERE id IN (${placeholders(models)}) FOR UPDATE`,
      models.map(model => model.id),
    );
    check(rows.length === models.length && rows.every(row => Number(row.usage_limit) === NEW_LIMIT),
      'Model verification failed.');
  }
  for (const group of batches(codes)) {
    const [after] = await connection.execute(
      `SELECT id, product_model_id, usage_limit, used_count, owner_org_id, status FROM warranty_codes
       WHERE id IN (${placeholders(group)}) FOR UPDATE`, group.map(code => code.id),
    );
    const byId = new Map(after.map(code => [code.id, code]));
    check(after.length === group.length && group.every(before => {
      const row = byId.get(before.id);
      return row && Number(row.usage_limit) === NEW_LIMIT && row.status === before.next_status
        && row.used_count === before.used_count && row.owner_org_id === before.owner_org_id
        && row.product_model_id === before.product_model_id;
    }), 'Inventory quota, status, cache or ownership verification failed.');
  }
}

// The caller supplies a dedicated, idle mysql2 connection. Dry runs use a read-only snapshot.
// Keep the transaction short and coordinate with imports which might have already read the old model default.
export async function runQuotaChange(connection, { apply = false } = {}) {
  check(typeof apply === 'boolean', 'apply must be a boolean.');
  const indexes = await checkStorage(connection);
  await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await connection.query(apply ? 'START TRANSACTION READ WRITE' : 'START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  try {
    const lock = apply ? ' FOR UPDATE' : '';
    const models = await getModels(connection, indexes, lock);
    const candidates = await getCandidates(connection, indexes, models, lock);
    const counts = await getOccupiedCounts(connection, indexes, candidates, apply);
    const changedModels = models.filter(model => Number(model.usage_limit) === OLD_LIMIT);
    const summary = {
      mode: apply ? 'apply' : 'dry-run',
      modelsScanned: models.length,
      modelsChanged: changedModels.length,
      modelDefaultsAlready20: models.filter(model => Number(model.usage_limit) === NEW_LIMIT).length,
      otherModelDefaultsPreserved: models.filter(model => ![OLD_LIMIT, NEW_LIMIT].includes(Number(model.usage_limit))).length,
      codesChanged: candidates.length,
      statesChanged: 0,
      frozenPreserved: 0,
      voidedPreserved: 0,
      occupiedAtLeast20: 0,
      cacheDiffersFromOccupied: 0,
    };
    for (const code of candidates) {
      const occupied = counts.get(code.id) || 0;
      code.next_status = nextStatus(code, occupied);
      if (code.next_status !== code.status) summary.statesChanged++;
      if (code.status === 'frozen') summary.frozenPreserved++;
      if (code.status === 'voided') summary.voidedPreserved++;
      if (occupied >= NEW_LIMIT) summary.occupiedAtLeast20++;
      if (Number(code.used_count) !== occupied) summary.cacheDiffersFromOccupied++;
    }
    if (apply) {
      await writeAndVerify(connection, changedModels, candidates);
      await connection.commit();
    } else {
      await connection.rollback();
    }
    return summary;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('node scripts/raise-side-window-quota.mjs [--apply]   (default: read-only preview)');
    return;
  }
  check(args.length === 0 || (args.length === 1 && args[0] === '--apply'), 'Unknown arguments. Use --help.');
  const { default: dotenv } = await import('dotenv');
  const { default: mysql } = await import('mysql2/promise');
  dotenv.config({ path: process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env' });
  const env = process.env;
  check(['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'].every(key => env[key]),
    'Required MySQL environment configuration is missing.');
  const connection = await mysql.createConnection({
    host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT), user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE, timezone: 'Z',
  });
  try {
    const result = await runQuotaChange(connection, { apply: args.includes('--apply') });
    console.log(JSON.stringify(result));
  } finally {
    await connection.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    // Driver messages can include SQL parameters, host names or account identifiers.
    const reason = error instanceof QuotaCheckError ? error.message : (error.code || 'DATABASE_ERROR');
    console.error('Side-window quota operation did not finish cleanly. Verify with a fresh dry run.', reason);
    process.exitCode = 1;
  });
}
