import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const args = process.argv.slice(2);
const dumpPath = args.find((arg) => !arg.startsWith('--'));
const reset = args.includes('--reset');

if (!dumpPath) {
  console.error('Usage: node scripts/import-d1-to-mysql.mjs <cloudflare-d1-dump.sql> [--reset]');
  process.exit(1);
}

dotenv.config({ path: process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env' });
dotenv.config();

const requiredEnv = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing MySQL env: ${missing.join(', ')}`);
  process.exit(1);
}

function sqliteJson(sqlitePath, sql) {
  // Warranty-code inventory can exceed Node's default 1 MB child-process buffer.
  const output = execFileSync('sqlite3', ['-json', sqlitePath, sql], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
  return output ? JSON.parse(output) : [];
}

function quoteIdent(identifier) {
  return `\`${String(identifier).replaceAll('`', '``')}\``;
}

function isLongTextColumn(name) {
  return /(address|reason|description|content|message|metadata|payload|snapshot|remark|note|json|url|file_key|thumbnail_key|user_agent|error)/i.test(name);
}

function columnType(table, column) {
  const name = column.name;
  const rawType = String(column.type || '').toLowerCase();

  if (column.pk || name === 'id' || /(^|_)(id|code|token|username|phone|status|type|role|category|model_code|batch_no)$/.test(name)) {
    return 'VARCHAR(191)';
  }
  if (/(^|_)(at|date)$/.test(name) || /(_at|_date|expires_at|effective_from|effective_to)$/.test(name)) {
    return 'DATETIME';
  }
  if (rawType.includes('int') || /(count|limit|rows|order|points|years|cents|quantity|ratio|visible|enabled|default|awarded|balance)$/.test(name)) {
    return 'INT';
  }
  if (rawType.includes('real') || rawType.includes('double') || rawType.includes('float')) {
    return 'DOUBLE';
  }
  if (rawType.includes('text') || isLongTextColumn(name)) {
    return 'TEXT';
  }
  return 'VARCHAR(255)';
}

function defaultClause(column) {
  const raw = column.dflt_value;
  if (raw == null) return '';
  const value = String(raw);
  if (/datetime\('now'\)/i.test(value)) return ' DEFAULT CURRENT_TIMESTAMP';
  if (/^\(?CURRENT_TIMESTAMP\)?$/i.test(value)) return ' DEFAULT CURRENT_TIMESTAMP';
  if (/^\(?NULL\)?$/i.test(value)) return ' DEFAULT NULL';
  if (/^\(?-?\d+\)?$/.test(value)) return ` DEFAULT ${value.replace(/[()]/g, '')}`;
  if (/^'.*'$/.test(value)) return ` DEFAULT ${value}`;
  return '';
}

function createTableSql(table, columns) {
  const columnSql = columns.map((column) => {
    const pieces = [
      quoteIdent(column.name),
      columnType(table, column),
      column.notnull || column.pk ? 'NOT NULL' : 'NULL',
      defaultClause(column),
    ].filter(Boolean);
    return `  ${pieces.join(' ')}`;
  });
  const pkColumns = columns.filter((column) => column.pk).sort((a, b) => a.pk - b.pk);
  if (pkColumns.length) {
    columnSql.push(`  PRIMARY KEY (${pkColumns.map((column) => quoteIdent(column.name)).join(', ')})`);
  }
  return `CREATE TABLE IF NOT EXISTS ${quoteIdent(table)} (\n${columnSql.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
}

function normalizeDateTime(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z?$/);
  if (!match) return value;
  return `${match[1]} ${match[2]}`;
}

function sqlLiteral(value, mysqlType) {
  if (value == null) return null;
  if (mysqlType === 'DATETIME' && value === '') return null;
  if (mysqlType === 'DATETIME') return normalizeDateTime(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

async function insertRows(connection, table, tableColumns, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const typeByColumn = new Map(tableColumns.map((column) => [column.name, columnType(table, column)]));
  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const placeholders = batch.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const values = batch.flatMap((row) => columns.map((column) => sqlLiteral(row[column], typeByColumn.get(column))));
    await connection.query(
      `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${placeholders}`,
      values,
    );
  }
}

async function createIndexes(connection, sqlitePath, table) {
  const indexes = sqliteJson(sqlitePath, `PRAGMA index_list(${quoteIdent(table)});`);
  for (const index of indexes) {
    if (index.origin === 'pk') continue;
    const columns = sqliteJson(sqlitePath, `PRAGMA index_info(${quoteIdent(index.name)});`);
    if (!columns.length || columns.some((column) => !column.name)) continue;
    const unique = index.unique ? 'UNIQUE ' : '';
    const indexName = `idx_${table}_${columns.map((column) => column.name).join('_')}`.slice(0, 60);
    await connection.query(
      `CREATE ${unique}INDEX ${quoteIdent(indexName)} ON ${quoteIdent(table)} (${columns.map((column) => quoteIdent(column.name)).join(', ')})`,
    ).catch((error) => {
      if (!/Duplicate key name/i.test(error.message)) throw error;
    });
  }
}

async function main() {
  execFileSync('sqlite3', ['--version'], { stdio: 'ignore' });

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'hamorey-d1-'));
  const sqlitePath = path.join(tempDir, 'cloudflare-d1.sqlite');
  try {
    const dump = readFileSync(dumpPath, 'utf8');
    writeFileSync(path.join(tempDir, 'dump.sql'), dump);
    execFileSync('sqlite3', [sqlitePath], { input: dump, stdio: ['pipe', 'ignore', 'inherit'] });

    const tables = sqliteJson(sqlitePath, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid;")
      .map((row) => row.name);

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      multipleStatements: false,
      timezone: 'Z',
    });

    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      if (reset) {
        for (const table of [...tables].reverse()) {
          await connection.query(`DROP TABLE IF EXISTS ${quoteIdent(table)}`);
        }
      }

      const tableColumns = new Map();
      for (const table of tables) {
        const columns = sqliteJson(sqlitePath, `PRAGMA table_info(${quoteIdent(table)});`);
        tableColumns.set(table, columns);
        await connection.query(createTableSql(table, columns));
      }

      for (const table of tables) {
        const rows = sqliteJson(sqlitePath, `SELECT * FROM ${quoteIdent(table)};`);
        await insertRows(connection, table, tableColumns.get(table) || [], rows);
      }

      for (const table of tables) {
        await createIndexes(connection, sqlitePath, table);
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log('HAMOREY_D1_MYSQL_IMPORT_DONE');
      for (const table of tables) {
        const [[row]] = await connection.query(`SELECT COUNT(*) AS count FROM ${quoteIdent(table)}`);
        console.log(`${table}: ${row.count}`);
      }
    } finally {
      await connection.end();
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  if (error?.code === 'ENOENT') {
    console.error('sqlite3 is required. Install it first: sudo apt-get install -y sqlite3');
  } else {
    console.error(error);
  }
  process.exit(1);
});
