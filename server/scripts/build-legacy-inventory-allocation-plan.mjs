import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import * as XLSX from 'xlsx';

const args = process.argv.slice(2);
const sourceArg = args.find((arg) => !arg.startsWith('--'));

function option(name) {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || null;
}

function usage() {
  console.error([
    'Usage: node scripts/build-legacy-inventory-allocation-plan.mjs <inventory.xlsx|xls|csv|json>',
    '  [--output=plan.json] [--sheet=sheet-name]',
    '  [--target-org-id=id | --target-org-name=name]',
    '  [--cutoff=ISO-time] [--allow-partial-used]',
  ].join('\n'));
}

if (!sourceArg) {
  usage();
  process.exit(1);
}

const sourcePath = resolve(sourceArg);
if (!existsSync(sourcePath)) {
  console.error(`Inventory export not found: ${sourcePath}`);
  process.exit(1);
}

dotenv.config({ path: process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env' });
dotenv.config();

const requiredEnv = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing MySQL env: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const aliases = {
  code: ['质保码', '质保编码', '质保号', '卷轴号', '卷号', '膜卷码', '条码', 'reelnumber', 'warrantycode', 'code'],
  storeId: ['门店id', '客户id', '组织id', 'organizationid', 'orgid', 'storeid'],
  storeCode: ['门店编码', '客户编码', '组织编码', 'organizationcode', 'orgcode', 'storecode'],
  storeName: ['门店名称', '客户名称', '仓库名称', '所属客户', '所属门店', '客户', '门店', '仓库', 'customername', 'storename', 'organizationname'],
  phone: ['联系电话', '联系电话号码', '电话', '手机号', '手机号码', 'phone', 'mobile'],
  allocationId: ['划拨单号', '流转单号', '记录id', '调拨单号', 'allocationid', 'transferid'],
  allocatedAt: ['划拨时间', '流转时间', '调拨时间', '更新时间', 'allocatedat', 'transferredat', 'updatedat'],
};

function normalizeHeader(value) {
  return String(value ?? '').trim().replace(/[\s_\-]+/g, '').toLowerCase();
}

const normalizedAliases = Object.fromEntries(
  Object.entries(aliases).map(([key, values]) => [key, new Set(values.map(normalizeHeader))]),
);

function cleanText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function findValue(row, kind) {
  const wanted = normalizedAliases[kind];
  for (const [key, value] of Object.entries(row || {})) {
    if (wanted.has(normalizeHeader(key))) return cleanText(value);
  }
  return null;
}

function rowsFromJson(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  throw new Error('JSON export must be an array, rows array, data array, or data.content array.');
}

function readExport(filePath) {
  const extension = extname(filePath).toLowerCase();
  const raw = readFileSync(filePath);
  if (extension === '.json') {
    return { rows: rowsFromJson(JSON.parse(raw.toString('utf8'))), sheets: ['json'] };
  }
  if (!['.xlsx', '.xls', '.csv'].includes(extension)) {
    throw new Error(`Unsupported inventory export type: ${extension || '(none)'}`);
  }

  const workbook = XLSX.read(raw, { type: 'buffer', cellDates: true });
  const requestedSheet = option('sheet');
  if (requestedSheet && !workbook.SheetNames.includes(requestedSheet)) {
    throw new Error(`Sheet not found: ${requestedSheet}. Available: ${workbook.SheetNames.join(', ')}`);
  }
  const sheetNames = requestedSheet ? [requestedSheet] : workbook.SheetNames;
  const rows = sheetNames.flatMap((sheetName) => XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd hh:mm:ss',
  }));
  return { rows, sheets: sheetNames };
}

function addIndex(map, key, organization) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(organization);
  map.set(key, list);
}

function uniqueMatch(map, key) {
  const matches = key ? map.get(key) || [] : [];
  return matches.length === 1 ? matches[0] : null;
}

function describeRow(row, rowNumber) {
  return {
    row: rowNumber,
    code: findValue(row, 'code'),
    storeId: findValue(row, 'storeId'),
    storeCode: findValue(row, 'storeCode'),
    storeName: findValue(row, 'storeName'),
    phone: findValue(row, 'phone'),
  };
}

async function main() {
  const { rows, sheets } = readExport(sourcePath);
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: 'Z',
  });

  try {
    const [organizations] = await connection.execute(
      `SELECT id, code, name, province, city, phone
       FROM organizations
       WHERE type = 'STORE' AND status = 'active'`,
    );
    const byId = new Map(organizations.map((org) => [String(org.id), org]));
    const byCode = new Map();
    const byName = new Map();
    const byPhone = new Map();
    for (const org of organizations) {
      addIndex(byCode, normalizeName(org.code), org);
      addIndex(byName, normalizeName(org.name), org);
      addIndex(byPhone, normalizePhone(org.phone), org);
    }

    const targetOrgId = option('target-org-id');
    const targetOrgName = option('target-org-name');
    if (targetOrgId && targetOrgName) throw new Error('Use only one target organization override.');
    let fixedTarget = null;
    if (targetOrgId) fixedTarget = byId.get(targetOrgId) || null;
    if (targetOrgName) fixedTarget = uniqueMatch(byName, normalizeName(targetOrgName));
    if ((targetOrgId || targetOrgName) && !fixedTarget) {
      throw new Error(`Target store could not be uniquely matched: ${targetOrgId || targetOrgName}`);
    }

    const allocationsByCode = new Map();
    const unmatched = [];
    const conflicts = [];
    let emptyCodeRows = 0;
    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const code = findValue(row, 'code');
      if (!code) {
        emptyCodeRows += 1;
        continue;
      }

      const rowOrgId = findValue(row, 'storeId');
      const rowOrgCode = findValue(row, 'storeCode');
      const rowOrgName = findValue(row, 'storeName');
      const rowPhone = findValue(row, 'phone');
      const target = fixedTarget
        || byId.get(rowOrgId)
        || uniqueMatch(byCode, normalizeName(rowOrgCode))
        || uniqueMatch(byName, normalizeName(rowOrgName))
        || uniqueMatch(byPhone, normalizePhone(rowPhone));

      if (!target) {
        unmatched.push(describeRow(row, rowNumber));
        continue;
      }

      const allocation = {
        code,
        targetOrgId: String(target.id),
        legacyAllocationId: findValue(row, 'allocationId'),
        legacyAllocatedAt: findValue(row, 'allocatedAt'),
        allowUsedTransfer: args.includes('--allow-partial-used'),
      };
      const existing = allocationsByCode.get(code);
      if (existing && existing.targetOrgId !== allocation.targetOrgId) {
        conflicts.push({ code, firstTargetOrgId: existing.targetOrgId, conflictingTargetOrgId: allocation.targetOrgId, row: rowNumber });
        continue;
      }
      if (!existing) allocationsByCode.set(code, allocation);
    }

    if (unmatched.length || conflicts.length) {
      console.error('HAMOREY_LEGACY_INVENTORY_PLAN_BLOCKED');
      console.error(JSON.stringify({
        rows: rows.length,
        matchedCodes: allocationsByCode.size,
        emptyCodeRows,
        unmatchedCount: unmatched.length,
        conflictCount: conflicts.length,
        unmatchedSamples: unmatched.slice(0, 20),
        conflictSamples: conflicts.slice(0, 20),
      }, null, 2));
      process.exitCode = 2;
      return;
    }

    const sourceHash = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
    const defaultOutput = resolve(`${basename(sourcePath, extname(sourcePath))}.allocation-plan.json`);
    const outputPath = resolve(option('output') || defaultOutput);
    const plan = {
      schemaVersion: 1,
      source: {
        type: 'legacy-inventory-export',
        fileName: basename(sourcePath),
        sha256: sourceHash,
        sheetNames: sheets,
        rowCount: rows.length,
        generatedAt: new Date().toISOString(),
      },
      cutoff: option('cutoff') || new Date().toISOString(),
      organizations: [],
      allocations: [...allocationsByCode.values()],
    };
    writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

    console.log('HAMOREY_LEGACY_INVENTORY_PLAN_READY');
    console.log(JSON.stringify({
      output: outputPath,
      rows: rows.length,
      allocations: plan.allocations.length,
      emptyCodeRows,
      allowPartialUsed: args.includes('--allow-partial-used'),
    }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
