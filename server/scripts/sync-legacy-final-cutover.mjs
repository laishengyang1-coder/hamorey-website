import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const args = process.argv.slice(2);
const apply = args.includes('--apply');

function option(name) {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length).trim() || null;
}

const paths = {
  customers: option('customers'),
  accounts: option('accounts'),
  inventory: option('inventory'),
  allocations: option('allocations'),
};

if (Object.values(paths).some((value) => !value)) {
  console.error([
    'Usage: node scripts/sync-legacy-final-cutover.mjs',
    '  --customers=<legacy-customers.json>',
    '  --accounts=<legacy-accounts.json>',
    '  --inventory=<legacy-current-inventory.json>',
    '  --allocations=<legacy-allocation-history.json>',
    '  [--apply]',
  ].join(' '));
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

const LEGACY_ROOT_AUTH_CODE = '1000_1537';
const LEGACY_ROOT_ID = 'da21fbb2-bc49-4883-9c5d-1e01793cb705';
const HQ_ID = 'org-hq-001';
const LEGACY_PARTY_ALIASES = new Map([
  ['aee1f0b6-c074-45b6-9978-94be7c9fb466', '23719484-265a-48c9-9365-59dd91c93e60'],
  ['88537727-1888-4609-88ec-8db9ccf7fee7', 'bf3ff2ef-f7e7-4a50-ae41-09b6620828dd'],
  ['6e318c0c-5370-4c8e-90a1-d63918d7cba7', '53fcb048-df05-4fab-bb9b-f284faf44f1b'],
]);
const DEFAULT_PASSWORD = 'hemo123456';
const CURRENT_INVENTORY_STATUS = 1;
const RELEVANT_BRANDS = new Set(['和膜', '和膜和彩']);
const LEGACY_HZUN_MODEL = {
  id: 'pm-legacy-wf-hzun',
  productId: 'prod-wf',
  modelCode: 'WF-HZUN',
  displayName: '和尊窗膜',
  warrantyYears: 15,
  usageLimit: 15,
};

const modelAliases = [
  [/和兴\s*HX8|HX8/i, 'HX8'],
  [/和兴\s*HX9|HX9/i, 'HX9'],
  [/和旺\s*HW8|HW8/i, 'HW8'],
  [/和旺\s*HW9|HW9/i, 'HW9'],
  [/和原\s*10/i, 'WF-HY10'],
  [/和原\s*35/i, 'WF-HY35'],
  [/和原\s*75/i, 'WF-HY75'],
  [/和真\s*15/i, 'WF-HZ15'],
  [/和真\s*35/i, 'WF-HZ35'],
  [/和真\s*75/i, 'WF-HZ75'],
  [/和护\s*15/i, 'WF-HH15'],
  [/和护\s*35/i, 'WF-HH25'],
  [/和护\s*70/i, 'WF-HH70'],
  [/和盾\s*10/i, 'WF-HD10'],
  [/和盾\s*35/i, 'WF-HD35'],
  [/和盾\s*70/i, 'WF-HD70'],
  [/和光\s*25/i, 'WF-HG25'],
  [/和光\s*70/i, 'WF-HG70'],
  [/和尊/i, 'WF-HZUN'],
  [/和雅\s*HYM|HYM/i, 'YM-8'],
  [/和御\s*HY8|HY8/i, 'HY8'],
  [/和粹|全彩车衣|和膜和彩|TPU|纳多灰|水晶/i, 'QCCY'],
];

function string(value) {
  return String(value ?? '').trim();
}

function nullable(value) {
  return string(value) || null;
}

function normalizeName(value) {
  return string(value)
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function normalizePhone(value) {
  return string(value).replace(/\D/g, '');
}

function cleanDate(value) {
  const match = string(value).match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/);
  return match ? `${match[1]} ${match[2] || '00:00:00'}` : null;
}

function stableId(prefix, value) {
  return `${prefix}-${crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24)}`;
}

function sourceRows(path) {
  const value = JSON.parse(readFileSync(path, 'utf8'));
  const rows = value?.rows || value?.data?.content || value?.data;
  if (!Array.isArray(rows)) throw new Error(`Unsupported legacy export: ${path}`);
  return rows;
}

function sourceHash() {
  const hash = crypto.createHash('sha256');
  for (const path of Object.values(paths)) hash.update(readFileSync(path));
  return hash.digest('hex');
}

function productLabel(row) {
  const product = row?.productInfo || row?.inventoryInfo?.productInfo || {};
  return [
    product.productName?.label,
    product.productVersion?.label,
    product.productSpec?.label,
  ].map(string).filter(Boolean).join(' ');
}

function productBrand(row) {
  return string(row?.productInfo?.productName?.label || row?.inventoryInfo?.productInfo?.productName?.label);
}

function modelCodeFor(row) {
  const label = productLabel(row);
  return modelAliases.find(([pattern]) => pattern.test(label))?.[1] || null;
}

function hashPassword(password) {
  const iterations = 100000;
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return `pbkdf2$${iterations}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

function nextStoreCode(usedCodes) {
  let number = 1;
  for (const code of usedCodes) {
    const match = String(code).match(/^MD-(\d+)$/);
    if (match) number = Math.max(number, Number(match[1]) + 1);
  }
  let code;
  do {
    code = `MD-${String(number).padStart(3, '0')}`;
    number += 1;
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
}

function inferCity(customer) {
  const text = `${string(customer.address)} ${string(customer.customerName)}`;
  const matches = [...text.matchAll(/([\u4e00-\u9fa5]{2,8}市)/g)].map((match) => match[1]);
  return matches[0] || null;
}

function latestInventoryRows(rows) {
  const selected = new Map();
  const latestUsed = new Map();
  const duplicates = [];
  for (const row of rows) {
    if (!RELEVANT_BRANDS.has(productBrand(row))) continue;
    const code = string(row.reelNumber);
    if (!code) continue;
    if (Number(row.status) === 3 && Number(row.warrantyTimes || 0) > 0) {
      const previous = latestUsed.get(code);
      if (!previous || (cleanDate(row.updateTime) || '') > (cleanDate(previous.updateTime) || '')) {
        latestUsed.set(code, row);
      }
      continue;
    }
    if (Number(row.status) !== CURRENT_INVENTORY_STATUS) continue;
    const previous = selected.get(code);
    if (!previous) {
      selected.set(code, row);
      continue;
    }
    duplicates.push({ code, keptCustomer: null, ignoredCustomer: null });
    const previousDate = cleanDate(previous.updateTime) || '';
    const currentDate = cleanDate(row.updateTime) || '';
    const keepCurrent = currentDate > previousDate
      || (currentDate === previousDate && Number(row.quantity || 0) > Number(previous.quantity || 0));
    const kept = keepCurrent ? row : previous;
    const ignored = keepCurrent ? previous : row;
    selected.set(code, kept);
    const duplicate = duplicates.at(-1);
    duplicate.keptCustomer = string(kept.customer?.customerName);
    duplicate.ignoredCustomer = string(ignored.customer?.customerName);
  }
  const staleActive = [];
  for (const [code, activeRow] of selected) {
    const usedRow = latestUsed.get(code);
    if (!usedRow || (cleanDate(usedRow.updateTime) || '') <= (cleanDate(activeRow.updateTime) || '')) continue;
    selected.set(code, usedRow);
    staleActive.push({
      code,
      staleOwner: string(activeRow.customer?.customerName),
      staleUpdatedAt: cleanDate(activeRow.updateTime),
      warrantyOwner: string(usedRow.customer?.customerName),
      warrantyUpdatedAt: cleanDate(usedRow.updateTime),
    });
  }
  return { rows: [...selected.values()], duplicates, staleActive };
}

function summaryTemplate(snapshotSha256) {
  return {
    mode: apply ? 'apply' : 'dry-run',
    snapshotSha256,
    organizations: { source: 0, created: 0, enriched: 0, unchanged: 0 },
    accounts: { source: 0, created: 0, existing: 0, unmatched: 0 },
    profiles: { created: 0, existing: 0 },
    inventory: {
      sourceRows: 0,
      activeRelevantRows: 0,
      uniqueCodes: 0,
      duplicateRowsIgnored: 0,
      createdCodes: 0,
      deferredUsedMissingCodes: 0,
      movedUnusedCodes: 0,
      alreadyAligned: 0,
      blockedUsedOrLocked: 0,
      staleActiveRowsSupersededByWarranty: 0,
    },
    allocations: {
      sourceDocuments: 0,
      sourceItems: 0,
      relevantItems: 0,
      inserted: 0,
      existing: 0,
      updatedHistoricalTime: 0,
      skippedMissingCode: 0,
      skippedUnresolvedParty: 0,
      skippedSelfTransfer: 0,
    },
    samples: {
      createdOrganizations: [],
      createdAccounts: [],
      movedCodes: [],
      deferredCodes: [],
      blockedCodes: [],
      unresolvedAllocations: [],
      duplicateInventory: [],
      staleActiveInventory: [],
    },
  };
}

async function main() {
  const legacyCustomers = sourceRows(paths.customers)
    .filter((row) => string(row.authCode) === LEGACY_ROOT_AUTH_CODE || string(row.authCode).startsWith(`${LEGACY_ROOT_AUTH_CODE}_`));
  const legacyAccounts = sourceRows(paths.accounts);
  const inventoryExport = sourceRows(paths.inventory);
  const allocationDocuments = sourceRows(paths.allocations);
  const snapshotSha256 = sourceHash();
  const report = summaryTemplate(snapshotSha256);
  report.organizations.source = legacyCustomers.length;
  report.accounts.source = legacyAccounts.length;
  report.inventory.sourceRows = inventoryExport.length;
  report.allocations.sourceDocuments = allocationDocuments.length;

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: 'Z',
  });

  try {
    const [organizations] = await connection.query(
      `SELECT id, code, type, parent_id, name, province, city, address, contact_name, phone,
              social_credit_code, legal_person, status
       FROM organizations`,
    );
    const [users] = await connection.query(
      'SELECT id, organization_id, username, role, status FROM users',
    );
    const [profiles] = await connection.query(
      'SELECT id, organization_id FROM store_public_profiles',
    );
    const [models] = await connection.query(
      'SELECT id, product_id, model_code, display_name, warranty_years, usage_limit, status FROM product_models',
    );

    const orgById = new Map(organizations.map((row) => [String(row.id), row]));
    const orgByNormalizedName = new Map();
    for (const row of organizations) {
      const key = normalizeName(row.name);
      const list = orgByNormalizedName.get(key) || [];
      list.push(row);
      orgByNormalizedName.set(key, list);
    }
    const userByOrgId = new Map(users.map((row) => [String(row.organization_id), row]));
    const userByUsername = new Map(users.map((row) => [String(row.username), row]));
    const profileOrgIds = new Set(profiles.map((row) => String(row.organization_id)));
    const modelByCode = new Map(models.map((row) => [String(row.model_code), row]));
    modelByCode.set(LEGACY_HZUN_MODEL.modelCode, {
      ...LEGACY_HZUN_MODEL,
      product_id: LEGACY_HZUN_MODEL.productId,
      model_code: LEGACY_HZUN_MODEL.modelCode,
      display_name: LEGACY_HZUN_MODEL.displayName,
      warranty_years: LEGACY_HZUN_MODEL.warrantyYears,
      usage_limit: LEGACY_HZUN_MODEL.usageLimit,
      status: 'inactive',
    });

    const hq = orgById.get(HQ_ID) || organizations.find((row) => row.type === 'HQ');
    if (!hq) throw new Error('Target HQ organization is missing.');

    const legacyCustomerById = new Map(legacyCustomers.map((row) => [String(row.id), row]));
    const legacyCustomerByName = new Map(legacyCustomers.map((row) => [normalizeName(row.customerName), row]));
    const legacyAccountByPhone = new Map();
    const legacyAccountByName = new Map();
    for (const account of legacyAccounts) {
      const phone = normalizePhone(account.phone);
      if (phone) legacyAccountByPhone.set(phone, account);
      legacyAccountByName.set(normalizeName(account.userName), account);
    }

    const directAgents = legacyCustomers.filter((row) => string(row.authCode).split('_').length === 3);
    const directAgentIds = new Set(directAgents.map((row) => String(row.id)));
    const targetOrgByLegacyId = new Map([[LEGACY_ROOT_ID, hq], [String(hq.id), hq]]);
    const plannedOrganizations = [];
    const enrichments = [];
    const usedOrgCodes = new Set(organizations.map((row) => String(row.code)));

    for (const customer of legacyCustomers) {
      if (String(customer.id) === LEGACY_ROOT_ID || string(customer.authCode) === LEGACY_ROOT_AUTH_CODE) {
        targetOrgByLegacyId.set(String(customer.id), hq);
        continue;
      }
      const sourceId = String(customer.id);
      let target = orgById.get(sourceId) || null;
      if (!target) {
        const sameNames = orgByNormalizedName.get(normalizeName(customer.customerName)) || [];
        if (sameNames.length === 1) target = sameNames[0];
      }
      const sourceType = directAgentIds.has(sourceId) ? 'PROVINCE' : 'STORE';
      if (target) {
        targetOrgByLegacyId.set(sourceId, target);
        const updates = {};
        const sourceFields = {
          address: nullable(customer.address),
          contact_name: nullable(customer.contactPerson || customer.legalPerson),
          phone: nullable(customer.contactPhone),
          social_credit_code: nullable(customer.socialCode),
          legal_person: nullable(customer.legalPerson),
        };
        for (const [field, value] of Object.entries(sourceFields)) {
          if (!nullable(target[field]) && value) updates[field] = value;
        }
        if (Object.keys(updates).length) {
          enrichments.push({ id: target.id, name: target.name, updates });
          report.organizations.enriched += 1;
        } else {
          report.organizations.unchanged += 1;
        }
        continue;
      }

      if (sourceType === 'PROVINCE') {
        throw new Error(`Missing target provincial agent requires manual mapping: ${customer.customerName} (${sourceId})`);
      }
      const authParts = string(customer.authCode).split('_');
      const parentCode = authParts.at(-2);
      const parentSource = directAgents.find((row) => String(row.customerCode) === parentCode);
      const parent = parentSource ? (orgById.get(String(parentSource.id)) || targetOrgByLegacyId.get(String(parentSource.id))) : null;
      if (!parent || parent.type !== 'PROVINCE') {
        throw new Error(`Cannot resolve provincial parent for ${customer.customerName} (${customer.authCode})`);
      }
      const account = legacyAccountByPhone.get(normalizePhone(customer.contactPhone || customer.contactPerson))
        || legacyAccountByName.get(normalizeName(customer.customerName));
      const planned = {
        id: sourceId,
        code: nextStoreCode(usedOrgCodes),
        type: 'STORE',
        parent_id: parent.id,
        name: string(customer.customerName),
        province: nullable(parent.province || parent.name),
        city: inferCity(customer),
        address: nullable(customer.address),
        contact_name: nullable(customer.contactPerson || account?.realName || customer.legalPerson),
        phone: nullable(customer.contactPhone || account?.phone),
        social_credit_code: nullable(customer.socialCode),
        legal_person: nullable(customer.legalPerson || account?.realName),
        status: Number(customer.status) === 1 ? 'active' : 'disabled',
      };
      plannedOrganizations.push(planned);
      targetOrgByLegacyId.set(sourceId, planned);
      report.organizations.created += 1;
      if (report.samples.createdOrganizations.length < 10) {
        report.samples.createdOrganizations.push({ id: planned.id, code: planned.code, name: planned.name, parent: parent.name });
      }
    }

    const allTargetOrganizations = [...organizations, ...plannedOrganizations];
    for (const planned of plannedOrganizations) orgById.set(String(planned.id), planned);

    const accountPlans = [];
    for (const customer of legacyCustomers) {
      if (string(customer.authCode) === LEGACY_ROOT_AUTH_CODE) continue;
      const target = targetOrgByLegacyId.get(String(customer.id));
      if (!target || !['PROVINCE', 'STORE'].includes(target.type)) continue;
      if (userByOrgId.has(String(target.id))) {
        report.accounts.existing += 1;
        continue;
      }
      const account = legacyAccountByPhone.get(normalizePhone(customer.contactPhone || customer.contactPerson))
        || legacyAccountByName.get(normalizeName(customer.customerName));
      if (!account || !normalizePhone(account.phone)) {
        report.accounts.unmatched += 1;
        continue;
      }
      const username = normalizePhone(account.phone);
      const usernameOwner = userByUsername.get(username);
      if (usernameOwner && String(usernameOwner.organization_id) !== String(target.id)) {
        throw new Error(`Username ${username} already belongs to another organization.`);
      }
      const plan = {
        id: stableId('legacy-user', `${target.id}:${account.id}`),
        organizationId: target.id,
        username,
        passwordHash: hashPassword(DEFAULT_PASSWORD),
        role: target.type === 'PROVINCE' ? 'PROVINCE' : 'STORE',
        status: account.locked ? 'locked' : 'active',
        sourceCreatedAt: cleanDate(account.createTime),
      };
      accountPlans.push(plan);
      userByOrgId.set(String(target.id), plan);
      userByUsername.set(username, plan);
      report.accounts.created += 1;
      if (report.samples.createdAccounts.length < 10) {
        report.samples.createdAccounts.push({ organization: target.name, username, status: plan.status });
      }
    }

    const profilePlans = [];
    for (const organization of allTargetOrganizations.filter((row) => row.type === 'STORE')) {
      if (profileOrgIds.has(String(organization.id))) {
        report.profiles.existing += 1;
        continue;
      }
      profilePlans.push(organization);
      profileOrgIds.add(String(organization.id));
      report.profiles.created += 1;
    }

    function currentOwnerFor(sourceCustomerId) {
      const sourceId = String(sourceCustomerId || '');
      if (!sourceId) return null;
      if (sourceId === LEGACY_ROOT_ID) return hq;
      const direct = targetOrgByLegacyId.get(sourceId) || orgById.get(sourceId);
      if (!direct) return null;
      if (direct.type !== 'PROVINCE') return direct;
      const source = legacyCustomerById.get(sourceId);
      const sameNameStores = allTargetOrganizations.filter((row) =>
        row.type === 'STORE'
        && String(row.parent_id) === String(direct.id)
        && normalizeName(row.name) === normalizeName(source?.customerName || direct.name));
      return sameNameStores.length === 1 ? sameNameStores[0] : direct;
    }

    function historicalParty(sourceParty) {
      const sourceId = String(sourceParty?.id || '');
      if (!sourceId) return null;
      if (sourceId === LEGACY_ROOT_ID) return hq;
      const aliasTargetId = LEGACY_PARTY_ALIASES.get(sourceId);
      if (aliasTargetId) return orgById.get(aliasTargetId) || null;
      return targetOrgByLegacyId.get(sourceId) || orgById.get(sourceId) || null;
    }

    const { rows: activeInventoryRows, duplicates, staleActive } = latestInventoryRows(inventoryExport);
    report.inventory.activeRelevantRows = activeInventoryRows.length + duplicates.length;
    report.inventory.uniqueCodes = activeInventoryRows.length;
    report.inventory.duplicateRowsIgnored = duplicates.length;
    report.inventory.staleActiveRowsSupersededByWarranty = staleActive.length;
    report.samples.duplicateInventory = duplicates.slice(0, 10);
    report.samples.staleActiveInventory = staleActive.slice(0, 20);

    const inventoryCodes = activeInventoryRows.map((row) => string(row.reelNumber));
    const [existingCodeRows] = inventoryCodes.length
      ? await connection.query(
        `SELECT wc.id, wc.code, wc.product_model_id, wc.owner_org_id, wc.usage_limit, wc.used_count, wc.status,
                COUNT(wr.id) AS warranty_record_count
         FROM warranty_codes wc
         LEFT JOIN warranty_records wr ON wr.warranty_code_id = wc.id
         WHERE wc.code IN (${inventoryCodes.map(() => '?').join(',')})
         GROUP BY wc.id, wc.code, wc.product_model_id, wc.owner_org_id, wc.usage_limit, wc.used_count, wc.status`,
        inventoryCodes,
      )
      : [[]];
    const existingCodeByCode = new Map(existingCodeRows.map((row) => [String(row.code), row]));
    const inventoryPlans = [];
    const blocked = [];
    const unmappedInventory = [];

    for (const row of activeInventoryRows) {
      const code = string(row.reelNumber);
      const targetOwner = currentOwnerFor(row.customer?.id);
      if (!targetOwner) {
        blocked.push({ code, reason: 'unresolved-current-owner', sourceOwner: string(row.customer?.customerName) });
        continue;
      }
      const existing = existingCodeByCode.get(code);
      if (!existing) {
        if (Number(row.warrantyTimes || 0) > 0) {
          report.inventory.deferredUsedMissingCodes += 1;
          if (report.samples.deferredCodes.length < 10) {
            report.samples.deferredCodes.push({ code, owner: targetOwner.name, warrantyTimes: Number(row.warrantyTimes || 0) });
          }
          continue;
        }
        const modelCode = modelCodeFor(row);
        const model = modelByCode.get(modelCode);
        if (!model) {
          unmappedInventory.push({ code, label: productLabel(row), modelCode });
          continue;
        }
        inventoryPlans.push({
          type: 'create',
          id: stableId('legacy-code', code),
          code,
          model,
          owner: targetOwner,
          label: productLabel(row),
          usageLimit: Number(row.qualityAssurancefrequency || model.usage_limit || 1),
          createdAt: cleanDate(row.updateTime),
        });
        report.inventory.createdCodes += 1;
        continue;
      }
      if (String(existing.owner_org_id || '') === String(targetOwner.id)) {
        report.inventory.alreadyAligned += 1;
        continue;
      }
      const usedCount = Number(existing.used_count || 0);
      const recordCount = Number(existing.warranty_record_count || 0);
      if (existing.status !== 'in_stock' || usedCount !== 0 || recordCount !== 0) {
        blocked.push({
          code,
          reason: 'used-or-locked-code-owner-conflict',
          status: existing.status,
          usedCount,
          warrantyRecords: recordCount,
          targetOwner: targetOwner.name,
        });
        continue;
      }
      inventoryPlans.push({
        type: 'move',
        code,
        id: existing.id,
        fromOrgId: existing.owner_org_id,
        owner: targetOwner,
        sourceUpdatedAt: cleanDate(row.updateTime),
      });
      report.inventory.movedUnusedCodes += 1;
      if (report.samples.movedCodes.length < 10) {
        report.samples.movedCodes.push({ code, fromOrgId: existing.owner_org_id, to: targetOwner.name });
      }
    }

    report.inventory.blockedUsedOrLocked = blocked.length;
    report.samples.blockedCodes = blocked.slice(0, 20);
    if (unmappedInventory.length) {
      throw new Error(`Unmapped active inventory models: ${JSON.stringify(unmappedInventory.slice(0, 20))}`);
    }
    if (blocked.length) {
      console.error('HAMOREY_FINAL_CUTOVER_BLOCKED');
      console.error(JSON.stringify(report, null, 2));
      process.exitCode = 2;
      return;
    }

    const plannedCodeByCode = new Map(inventoryPlans.filter((plan) => plan.type === 'create').map((plan) => [plan.code, plan]));
    const allocationItems = [];
    for (const document of allocationDocuments) {
      const items = Array.isArray(document.inventoryInfoList) ? document.inventoryInfoList : [];
      report.allocations.sourceItems += items.length;
      for (const item of items) {
        if (!RELEVANT_BRANDS.has(productBrand(item))) continue;
        report.allocations.relevantItems += 1;
        allocationItems.push({ document, item, code: string(item.reelNumber) });
      }
    }

    const historyCodes = [...new Set(allocationItems.map((row) => row.code).filter(Boolean))];
    const [historyCodeRows] = historyCodes.length
      ? await connection.query(
        `SELECT id, code FROM warranty_codes WHERE code IN (${historyCodes.map(() => '?').join(',')})`,
        historyCodes,
      )
      : [[]];
    const historyCodeByCode = new Map(historyCodeRows.map((row) => [String(row.code), row]));
    for (const [code, plan] of plannedCodeByCode) historyCodeByCode.set(code, plan);

    const [existingLegacyAllocations] = await connection.query(
      `SELECT ca.id, wc.code, ca.from_org_id, ca.to_org_id, ca.reason,
              DATE_FORMAT(ca.created_at, '%Y-%m-%d %H:%i:%s') AS created_at_utc
       FROM code_allocations ca
       JOIN warranty_codes wc ON wc.id = ca.warranty_code_id
       WHERE ca.reason LIKE '同步旧系统库存划拨 %'`,
    );
    const existingAllocationBySourceAndCode = new Map();
    for (const row of existingLegacyAllocations) {
      const sourceId = string(row.reason).match(/同步旧系统库存划拨\s+([^\s]+)/)?.[1];
      if (sourceId) existingAllocationBySourceAndCode.set(`${sourceId}:${row.code}`, row);
    }

    const allocationPlans = [];
    for (const { document, item, code } of allocationItems) {
      if (!code) continue;
      const warrantyCode = historyCodeByCode.get(code);
      if (!warrantyCode) {
        report.allocations.skippedMissingCode += 1;
        continue;
      }
      const from = historicalParty(document.sourceCustomer);
      const to = historicalParty(document.targetCustomer);
      if (!from || !to) {
        report.allocations.skippedUnresolvedParty += 1;
        if (report.samples.unresolvedAllocations.length < 20) {
          report.samples.unresolvedAllocations.push({
            allocationId: string(document.id),
            code,
            from: string(document.sourceCustomer?.customerName),
            to: string(document.targetCustomer?.customerName),
          });
        }
        continue;
      }
      if (String(from.id) === String(to.id)) {
        report.allocations.skippedSelfTransfer += 1;
        continue;
      }
      const sourceId = string(document.id);
      const createdAt = cleanDate(document.createTime);
      const existing = existingAllocationBySourceAndCode.get(`${sourceId}:${code}`);
      if (existing) {
        report.allocations.existing += 1;
        if (createdAt && cleanDate(existing.created_at_utc) !== createdAt) {
          allocationPlans.push({ type: 'update-time', id: existing.id, createdAt });
          report.allocations.updatedHistoricalTime += 1;
        }
        continue;
      }
      allocationPlans.push({
        type: 'insert',
        id: stableId('legacy-flow', `${sourceId}:${item.id || code}`),
        warrantyCodeId: warrantyCode.id,
        fromOrgId: from.id,
        toOrgId: to.id,
        reason: `同步旧系统库存划拨 ${sourceId} ${createdAt || ''}`.trim(),
        createdAt,
      });
      report.allocations.inserted += 1;
    }

    if (!apply) {
      console.log('HAMOREY_FINAL_CUTOVER_DRY_RUN');
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    await connection.beginTransaction();
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await connection.query(
        `INSERT INTO product_models
         (id, product_id, model_code, display_name, warranty_years, warranty_price_cents, usage_limit, status, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 'inactive', 99, ?, ?)
         ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), warranty_years = VALUES(warranty_years),
           usage_limit = VALUES(usage_limit), status = 'inactive', updated_at = VALUES(updated_at)`,
        [
          LEGACY_HZUN_MODEL.id,
          LEGACY_HZUN_MODEL.productId,
          LEGACY_HZUN_MODEL.modelCode,
          LEGACY_HZUN_MODEL.displayName,
          LEGACY_HZUN_MODEL.warrantyYears,
          LEGACY_HZUN_MODEL.usageLimit,
          now,
          now,
        ],
      );

      for (const organization of plannedOrganizations) {
        await connection.query(
          `INSERT INTO organizations
           (id, code, type, parent_id, name, province, city, address, contact_name, phone,
            social_credit_code, legal_person, status, audit_status, created_by, created_at, updated_at)
           VALUES (?, ?, 'STORE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NULL, ?, ?)`,
          [
            organization.id,
            organization.code,
            organization.parent_id,
            organization.name,
            organization.province,
            organization.city,
            organization.address,
            organization.contact_name,
            organization.phone,
            organization.social_credit_code,
            organization.legal_person,
            organization.status,
            now,
            now,
          ],
        );
      }

      for (const enrichment of enrichments) {
        const fields = Object.keys(enrichment.updates);
        if (!fields.length) continue;
        await connection.query(
          `UPDATE organizations SET ${fields.map((field) => `${field} = COALESCE(NULLIF(${field}, ''), ?)`).join(', ')}, updated_at = ? WHERE id = ?`,
          [...fields.map((field) => enrichment.updates[field]), now, enrichment.id],
        );
      }

      for (const account of accountPlans) {
        await connection.query(
          `INSERT INTO users
           (id, organization_id, username, password_hash, role, status, last_login_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
          [
            account.id,
            account.organizationId,
            account.username,
            account.passwordHash,
            account.role,
            account.status,
            account.sourceCreatedAt || now,
            now,
          ],
        );
      }

      for (const organization of profilePlans) {
        await connection.query(
          `INSERT INTO store_public_profiles
           (id, organization_id, public_name, auth_level, province, city, address, phone,
            is_public, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, 'Service_Point', ?, ?, ?, ?, 1, 0, ?, ?)`,
          [
            stableId('legacy-profile', organization.id),
            organization.id,
            organization.name,
            nullable(organization.province),
            nullable(organization.city),
            nullable(organization.address),
            nullable(organization.phone),
            now,
            now,
          ],
        );
      }

      const inventoryBatchId = `legacy-final-inventory-${snapshotSha256.slice(0, 12)}`;
      await connection.query(
        `INSERT INTO import_batches
         (id, file_name, batch_name, total_rows, success_rows, error_rows, status, created_at)
         VALUES (?, ?, '旧小程序后台最终库存切换', ?, ?, ?, 'imported', ?)
         ON DUPLICATE KEY UPDATE total_rows = VALUES(total_rows), success_rows = VALUES(success_rows),
           error_rows = VALUES(error_rows), status = 'imported'`,
        [
          inventoryBatchId,
          paths.inventory.split('/').at(-1),
          report.inventory.uniqueCodes,
          report.inventory.createdCodes + report.inventory.movedUnusedCodes + report.inventory.alreadyAligned,
          report.inventory.deferredUsedMissingCodes,
          now,
        ],
      );

      for (const plan of inventoryPlans) {
        if (plan.type === 'create') {
          await connection.query(
            `INSERT INTO warranty_codes
             (id, code, product_model_id, imported_product_name, batch_no, import_batch_id, owner_org_id,
              usage_limit, used_count, status, created_at)
             VALUES (?, ?, ?, ?, '旧小程序后台最终库存切换', ?, ?, ?, 0, 'in_stock', ?)`,
            [
              plan.id,
              plan.code,
              plan.model.id,
              plan.label || plan.model.display_name,
              inventoryBatchId,
              plan.owner.id,
              plan.usageLimit,
              plan.createdAt || now,
            ],
          );
          continue;
        }
        const [lockRows] = await connection.query(
          `SELECT id, owner_org_id, used_count, status
           FROM warranty_codes
           WHERE id = ?
           FOR UPDATE`,
          [plan.id],
        );
        const locked = lockRows[0];
        const [[recordCountRow]] = await connection.query(
          'SELECT COUNT(*) AS warranty_record_count FROM warranty_records WHERE warranty_code_id = ?',
          [plan.id],
        );
        if (!locked || locked.status !== 'in_stock' || Number(locked.used_count) !== 0 || Number(recordCountRow.warranty_record_count) !== 0) {
          throw new Error(`Concurrent change blocked inventory owner update for ${plan.code}.`);
        }
        await connection.query('UPDATE warranty_codes SET owner_org_id = ? WHERE id = ?', [plan.owner.id, plan.id]);
      }

      for (const plan of allocationPlans) {
        if (plan.type === 'update-time') {
          await connection.query('UPDATE code_allocations SET created_at = ? WHERE id = ?', [plan.createdAt, plan.id]);
          continue;
        }
        await connection.query(
          `INSERT IGNORE INTO code_allocations
           (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, reason, created_at)
           VALUES (?, ?, ?, ?, 'allocate', NULL, ?, ?)`,
          [plan.id, plan.warrantyCodeId, plan.fromOrgId, plan.toOrgId, plan.reason, plan.createdAt || now],
        );
      }

      await connection.query(
        `INSERT INTO operation_logs
         (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
         VALUES (?, NULL, 'legacy_final_cutover_sync', 'system', NULL, ?, 'server-migration', ?)`,
        [stableId('operation', `${snapshotSha256}:${now}`), JSON.stringify(report), now],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log('HAMOREY_FINAL_CUTOVER_APPLIED');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
