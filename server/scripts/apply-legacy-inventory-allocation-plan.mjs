import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const args = process.argv.slice(2);
const planPath = args.find((arg) => !arg.startsWith('--'));
const apply = args.includes('--apply');

if (!planPath) {
  console.error('Usage: node scripts/apply-legacy-inventory-allocation-plan.mjs <plan.json> [--apply]');
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

const mutableStatuses = new Set(['unallocated', 'in_stock', 'partial_used']);

function fail(message) {
  throw new Error(message);
}

function asOptionalString(value) {
  if (value == null || value === '') return null;
  return String(value);
}

function readPlan(filePath) {
  const plan = JSON.parse(readFileSync(filePath, 'utf8'));
  if (plan?.schemaVersion !== 1) fail('Unsupported inventory allocation plan schema.');
  if (!Array.isArray(plan.organizations) || !Array.isArray(plan.allocations)) {
    fail('Plan must contain organizations and allocations arrays.');
  }

  const orgIds = new Set();
  const orgCodes = new Set();
  for (const org of plan.organizations) {
    if (!org?.id || !org?.code || !org?.name || !['STORE', 'PROVINCE'].includes(org?.type)) {
      fail(`Invalid organization in plan: ${JSON.stringify(org)}`);
    }
    if (orgIds.has(org.id)) fail(`Duplicate organization id in plan: ${org.id}`);
    if (orgCodes.has(org.code)) fail(`Duplicate organization code in plan: ${org.code}`);
    orgIds.add(org.id);
    orgCodes.add(org.code);
  }

  const allocationCodes = new Set();
  for (const allocation of plan.allocations) {
    if (!allocation?.code || !allocation?.targetOrgId) {
      fail(`Invalid allocation in plan: ${JSON.stringify(allocation)}`);
    }
    if (allocationCodes.has(allocation.code)) fail(`Duplicate warranty code in plan: ${allocation.code}`);
    allocationCodes.add(allocation.code);
  }
  return plan;
}

async function getOrganization(connection, id) {
  const [rows] = await connection.execute(
    `SELECT id, code, type, parent_id, name, province, city, status
     FROM organizations WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function ensureOrganizations(connection, organizations, { mutate }) {
  let createdOrganizations = 0;
  let createdProfiles = 0;
  const plannedById = new Map(organizations.map((org) => [org.id, org]));

  for (const org of organizations) {
    const [sameCodeRows] = await connection.execute('SELECT id FROM organizations WHERE code = ?', [org.code]);
    if (sameCodeRows.length && sameCodeRows[0].id !== org.id) {
      fail(`Organization code ${org.code} already belongs to ${sameCodeRows[0].id}.`);
    }

    const existing = await getOrganization(connection, org.id);
    if (existing) {
      if (existing.type !== org.type || existing.name !== org.name) {
        fail(`Organization ${org.id} does not match the migration plan.`);
      }
    } else {
      const parentExists = !org.parentId
        || plannedById.has(org.parentId)
        || await getOrganization(connection, org.parentId);
      if (!parentExists) fail(`Parent organization is missing for ${org.name}: ${org.parentId}`);
      createdOrganizations += 1;
      if (mutate) {
        await connection.execute(
          `INSERT INTO organizations
           (id, code, type, parent_id, name, province, city, contact_name, phone, status, created_by, created_at, updated_at, address, social_credit_code, legal_person)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, NOW(), NOW(), ?, ?, ?)`,
          [
            org.id,
            org.code,
            org.type,
            asOptionalString(org.parentId),
            org.name,
            asOptionalString(org.province),
            asOptionalString(org.city),
            asOptionalString(org.contactName),
            asOptionalString(org.phone),
            asOptionalString(org.address),
            asOptionalString(org.socialCreditCode),
            asOptionalString(org.legalPerson),
          ],
        );
      }
    }

    if (org.type !== 'STORE') continue;
    const [profileRows] = await connection.execute(
      'SELECT id FROM store_public_profiles WHERE organization_id = ?',
      [org.id],
    );
    if (!profileRows.length) {
      createdProfiles += 1;
      if (mutate) {
        await connection.execute(
          `INSERT INTO store_public_profiles
           (id, organization_id, public_name, auth_level, province, city, address, phone, is_public, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, 'Service_Point', ?, ?, ?, ?, 1, 0, NOW(), NOW())`,
          [
            org.profileId || `legacy-profile-${org.id}`,
            org.id,
            org.name,
            asOptionalString(org.province),
            asOptionalString(org.city),
            asOptionalString(org.address),
            asOptionalString(org.phone),
          ],
        );
      }
    }
  }

  return { createdOrganizations, createdProfiles };
}

async function getTarget(connection, targetOrgId, plannedById) {
  const planned = plannedById.get(targetOrgId);
  if (planned) return { ...planned, status: 'active' };
  return getOrganization(connection, targetOrgId);
}

async function evaluateAllocation(connection, allocation, plannedById, { lock }) {
  const target = await getTarget(connection, allocation.targetOrgId, plannedById);
  if (!target || target.type !== 'STORE' || target.status !== 'active') {
    fail(`Allocation target must be an active STORE: ${allocation.targetOrgId} (${allocation.code})`);
  }

  const suffix = lock ? ' FOR UPDATE' : '';
  const [codeRows] = await connection.execute(
    `SELECT id, code, owner_org_id, usage_limit, used_count, status
     FROM warranty_codes WHERE code = ?${suffix}`,
    [allocation.code],
  );
  const code = codeRows[0];
  if (!code) return { type: 'missingCode', code: allocation.code };

  const [usageRows] = await connection.execute(
    `SELECT COUNT(*) AS actual_used_count
     FROM warranty_records
     WHERE warranty_code_id = ? AND status IN ('pending', 'active', 'expired')`,
    [code.id],
  );
  const actualUsed = Number(usageRows[0]?.actual_used_count || 0);
  if (code.owner_org_id === allocation.targetOrgId) {
    return { type: 'alreadyAligned', code: allocation.code, warrantyCodeId: code.id };
  }
  if (!mutableStatuses.has(code.status)) {
    return { type: 'lockedStatus', code: allocation.code, status: code.status, actualUsed };
  }
  if (actualUsed > 0 || Number(code.used_count) > 0) {
    return { type: 'usedCode', code: allocation.code, status: code.status, actualUsed, usedCount: Number(code.used_count) };
  }
  return {
    type: 'move',
    code: allocation.code,
    warrantyCodeId: code.id,
    fromOrgId: code.owner_org_id,
    targetOrgId: allocation.targetOrgId,
  };
}

function emptySummary() {
  return {
    moved: 0,
    alreadyAligned: 0,
    missingCode: 0,
    usedCode: 0,
    lockedStatus: 0,
    createdOrganizations: 0,
    createdProfiles: 0,
    samples: [],
  };
}

function recordResult(summary, result) {
  if (result.type === 'move') {
    summary.moved += 1;
  } else {
    summary[result.type] += 1;
  }
  if (result.type !== 'move' && summary.samples.length < 10) summary.samples.push(result);
}

async function main() {
  const plan = readPlan(planPath);
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: 'Z',
  });

  try {
    const summary = emptySummary();
    const plannedById = new Map(plan.organizations.map((org) => [org.id, org]));
    await connection.beginTransaction();
    try {
      const created = await ensureOrganizations(connection, plan.organizations, { mutate: apply });
      summary.createdOrganizations = created.createdOrganizations;
      summary.createdProfiles = created.createdProfiles;

      for (const allocation of plan.allocations) {
        const result = await evaluateAllocation(connection, allocation, plannedById, { lock: apply });
        recordResult(summary, result);
        if (!apply || result.type !== 'move') continue;

        const reason = `同步旧系统库存划拨 ${allocation.legacyAllocationId || ''} ${allocation.legacyAllocatedAt || ''}`.trim();
        await connection.execute(
          `UPDATE warranty_codes SET owner_org_id = ?, status = 'in_stock', used_count = 0 WHERE id = ?`,
          [result.targetOrgId, result.warrantyCodeId],
        );
        await connection.execute(
          `INSERT INTO code_allocations
           (id, warranty_code_id, from_org_id, to_org_id, action, operator_user_id, reason, created_at)
           VALUES (?, ?, ?, ?, 'allocate', NULL, ?, NOW())`,
          [randomUUID(), result.warrantyCodeId, result.fromOrgId, result.targetOrgId, reason],
        );
      }

      if (apply) {
        await connection.execute(
          `INSERT INTO operation_logs
           (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
           VALUES (?, NULL, 'sync_legacy_inventory_allocations', 'warranty_codes', NULL, ?, 'server-migration', NOW())`,
          [randomUUID(), JSON.stringify({ source: plan.source || 'legacy', cutoff: plan.cutoff || null, ...summary })],
        );
        await connection.commit();
      } else {
        await connection.rollback();
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log(`HAMOREY_LEGACY_INVENTORY_${apply ? 'SYNC_DONE' : 'DRY_RUN'}`);
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', source: plan.source || null, cutoff: plan.cutoff || null, ...summary }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
