import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const args = process.argv.slice(2);
const sourcePath = args.find((arg) => !arg.startsWith('--'));
const apply = args.includes('--apply');

if (!sourcePath) {
  console.error('Usage: node scripts/import-legacy-warranty-delta.mjs <legacy-export.json> [--apply] [--batch-id=<id>] [--batch-name=<name>]');
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
  [/和光\s*70/i, 'WF-HG70'],
  [/和盾\s*70/i, 'WF-HD70'],
  [/WH[\s.-]*7\.?5|透明车衣\s*WH[\s.-]*7\.?5/i, 'WH-7.5'],
  [/和粹|全彩车衣|和膜和彩|黑金.*AMG/i, 'QCCY'],
];

function string(value) {
  return String(value ?? '').trim();
}

function cleanDate(value) {
  const match = string(value).match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/);
  return match ? `${match[1]} ${match[2] || '00:00:00'}` : null;
}

function addYears(dateTime, years) {
  const parsed = new Date(`${dateTime.replace(' ', 'T')}Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCFullYear(parsed.getUTCFullYear() + Number(years || 0));
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

function stableId(prefix, value) {
  return `${prefix}-${crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24)}`;
}

function pickSourceLabel(item) {
  const product = item?.inventoryInfo?.productInfo || {};
  return [
    product.productName?.label,
    product.productVersion?.label,
    product.productSpec?.label,
  ].map(string).filter(Boolean).join(' ');
}

function modelCodeFor(item) {
  const label = pickSourceLabel(item);
  const match = modelAliases.find(([pattern]) => pattern.test(label));
  return match?.[1] || null;
}

function statusFor(order) {
  return Number(order.status) === 2 ? 'active' : 'pending';
}

function codeStatus(usedCount, usageLimit) {
  if (usedCount >= usageLimit) return 'exhausted';
  if (usedCount > 0) return 'partial_used';
  return 'in_stock';
}

function sourceOrders(source) {
  const orders = source?.data?.content;
  if (!Array.isArray(orders)) throw new Error('Unsupported legacy export: expected data.content array');
  return orders;
}

function optionValue(name) {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length).trim() || null;
}

function batchMetadata(sourceText, orders) {
  const sourceDates = orders
    .map((order) => cleanDate(order.createTime))
    .filter(Boolean)
    .map((dateTime) => dateTime.slice(0, 10))
    .sort();
  const sourceFrom = sourceDates[0] || 'unknown';
  const sourceTo = sourceDates.at(-1) || sourceFrom;
  const compactRange = `${sourceFrom.replaceAll('-', '')}-${sourceTo.replaceAll('-', '')}`;
  const sourceHash = crypto.createHash('sha256').update(sourceText).digest('hex').slice(0, 12);

  return {
    id: optionValue('batch-id') || `legacy-warranty-delta-${compactRange}-${sourceHash}`,
    name: optionValue('batch-name') || `旧小程序后台质保增量（${sourceFrom} 至 ${sourceTo}）`,
    fileName: basename(sourcePath),
    sourceFrom,
    sourceTo,
    sourceHash,
  };
}

function sourceSnapshot(order, item, modelCode) {
  return JSON.stringify({
    source: 'legacy-mini-program',
    legacyOrderId: string(order.id),
    legacyOrderNo: string(order.warrantyCode),
    legacyItemId: string(item.id),
    reelNumber: string(item.reelNumber),
    sourceStatus: Number(order.status),
    productLabel: pickSourceLabel(item),
    mappedModelCode: modelCode,
    constructionSite: string(item.constructionSite) || null,
  });
}

function selectPoints(rules, modelId, createdAt) {
  const current = rules
    .filter((rule) => rule.product_model_id === modelId)
    .filter((rule) => {
      const effectiveFrom = cleanDate(rule.effective_from);
      return !effectiveFrom || effectiveFrom <= createdAt;
    })
    .filter((rule) => {
      const effectiveTo = cleanDate(rule.effective_to);
      return !effectiveTo || effectiveTo >= createdAt;
    })
    .sort((a, b) => String(cleanDate(b.effective_from)).localeCompare(String(cleanDate(a.effective_from))));
  return Number(current[0]?.points || 0);
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

async function rowsByIn(connection, sqlPrefix, values) {
  if (!values.length) return [];
  const [rows] = await connection.query(`${sqlPrefix} (${values.map(() => '?').join(', ')})`, values);
  return rows;
}

async function main() {
  const sourceText = readFileSync(sourcePath, 'utf8');
  const source = JSON.parse(sourceText);
  const orders = sourceOrders(source);
  const batch = batchMetadata(sourceText, orders);
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: 'Z',
    multipleStatements: false,
  });

  try {
    const [organizations] = await connection.query(
      "SELECT id, code, type, parent_id, name FROM organizations WHERE type IN ('HQ', 'PROVINCE', 'STORE')",
    );
    const [models] = await connection.query(
      `SELECT id, model_code, display_name, warranty_years, usage_limit
       FROM product_models
       WHERE status = 'active' OR model_code = 'WH-7.5'`,
    );
    const [pointsRules] = await connection.query(
      "SELECT product_model_id, points, effective_from, effective_to FROM points_rules WHERE status = 'active'",
    );

    const hq = organizations.find((organization) => organization.type === 'HQ');
    if (!hq) throw new Error('Target system has no HQ organization');
    const orgById = new Map(organizations.map((organization) => [organization.id, organization]));
    const storesByName = new Map(organizations.filter((organization) => organization.type === 'STORE').map((organization) => [organization.name, organization]));
    const provincesByName = new Map(organizations.filter((organization) => organization.type === 'PROVINCE').map((organization) => [organization.name, organization]));
    const modelsByCode = new Map(models.map((model) => [model.model_code, model]));

    const plans = [];
    const errors = [];
    const sourceStoreNames = new Set();
    const sourcePhones = new Set();
    const sourceCodes = new Set();
    const sourceRecordIds = new Set();
    let missingPlateCount = 0;

    for (const order of orders) {
      const storeName = string(order.customer?.customerName);
      const customerName = string(order.consumerName);
      const phone = string(order.phone);
      const items = Array.isArray(order.storeWarrantyOrderItemList) ? order.storeWarrantyOrderItemList : [];
      if (!storeName || !customerName || !phone || !items.length) {
        errors.push({ type: 'missing-required-source-fields', order: string(order.id) });
        continue;
      }
      sourceStoreNames.add(storeName);
      sourcePhones.add(phone);
      for (const item of items) {
        const reelNumber = string(item.reelNumber);
        const modelCode = modelCodeFor(item);
        const model = modelsByCode.get(modelCode);
        const recordId = stableId('legacy-warranty', `${order.id}:${item.id}`);
        const createdAt = cleanDate(order.createTime);
        const installationDate = cleanDate(item.constructionDate) || createdAt;
        if (!reelNumber || !model || !createdAt || !installationDate) {
          errors.push({ type: 'unmapped-or-invalid-item', order: string(order.id), item: string(item.id), modelCode, reelNumber: Boolean(reelNumber) });
          continue;
        }
        const plateNo = string(order.licensePlateNumber) || `旧系统未录入-${stableId('plate', order.id).slice(-8)}`;
        if (!string(order.licensePlateNumber)) missingPlateCount += 1;
        const warrantyYears = Number(item.qualityAssuranceYear || model.warranty_years || 0);
        if (!warrantyYears) {
          errors.push({ type: 'missing-warranty-years', order: string(order.id), item: string(item.id) });
          continue;
        }
        sourceCodes.add(reelNumber);
        sourceRecordIds.add(recordId);
        plans.push({
          order,
          item,
          recordId,
          storeName,
          customerName,
          phone,
          reelNumber,
          model,
          createdAt,
          installationDate,
          expiryDate: cleanDate(item.endDate) || addYears(installationDate, warrantyYears),
          warrantyYears,
          plateNo,
          sourceStatus: Number(order.status),
          status: statusFor(order),
          productLabel: pickSourceLabel(item),
        });
      }
    }

    if (errors.length) {
      throw new Error(`Preflight failed: ${errors.length} malformed/unmapped source rows (${JSON.stringify(countBy(errors.map((error) => error.type)))}).`);
    }

    const codeRows = await rowsByIn(connection,
      'SELECT id, code, product_model_id, owner_org_id, usage_limit, used_count, status FROM warranty_codes WHERE code IN',
      [...sourceCodes]);
    const existingCodes = new Map(codeRows.map((code) => [code.code, code]));
    const recordRows = await rowsByIn(connection,
      'SELECT id FROM warranty_records WHERE id IN',
      [...sourceRecordIds]);
    const existingRecordIds = new Set(recordRows.map((row) => row.id));
    const codeRecordRows = await rowsByIn(connection,
      `SELECT wr.id, wc.code, DATE_FORMAT(wr.created_at, '%Y-%m-%d %H:%i:%s') AS created_at_utc
       FROM warranty_records wr JOIN warranty_codes wc ON wc.id = wr.warranty_code_id WHERE wc.code IN`,
      [...sourceCodes]);
    const existingRecordByCodeAndTime = new Map(codeRecordRows.map((row) => [`${row.code}:${row.created_at_utc}`, row.id]));
    const customerRows = await rowsByIn(connection,
      'SELECT id, phone FROM customers WHERE phone IN',
      [...sourcePhones]);
    const customersByPhone = new Map(customerRows.map((customer) => [customer.phone, customer]));

    const prospectiveStores = new Map();
    const sourceCodeStore = new Map();
    for (const plan of plans) {
      let store = storesByName.get(plan.storeName);
      if (!store) {
        const existingCode = existingCodes.get(plan.reelNumber);
        const codeOwner = existingCode ? orgById.get(existingCode.owner_org_id) : null;
        // Some legacy provincial agents also acted as their own store. Keep the
        // roles distinct in the new model, while preserving the provincial parent.
        const province = provincesByName.get(plan.storeName)
          || organizations.find((organization) => organization.type === 'PROVINCE' && string(organization.name) === plan.storeName)
          || (codeOwner?.type === 'PROVINCE' && string(codeOwner.name) === plan.storeName ? codeOwner : null);
        store = {
          id: stableId('legacy-store', plan.storeName),
          code: `LEGACY-STORE-${stableId('code', plan.storeName).slice(-12).toUpperCase()}`,
          type: 'STORE',
          parent_id: province?.id || hq.id,
          name: plan.storeName,
          province_id: province?.id || null,
          isNew: true,
        };
        prospectiveStores.set(store.id, store);
        storesByName.set(plan.storeName, store);
      }
      plan.store = store;
      plan.provinceOrgId = store.province_id || (orgById.get(store.parent_id)?.type === 'PROVINCE' ? store.parent_id : null);
      const previousStore = sourceCodeStore.get(plan.reelNumber);
      if (previousStore && previousStore !== store.id) {
        throw new Error(`Preflight failed: warranty code ${plan.reelNumber} belongs to multiple legacy stores.`);
      }
      sourceCodeStore.set(plan.reelNumber, store.id);
      const code = existingCodes.get(plan.reelNumber);
      const owner = code ? orgById.get(code.owner_org_id) : null;
      const isProvinceSelfStore = code
        && owner?.type === 'PROVINCE'
        && string(owner.name) === plan.storeName
        && store.parent_id === owner.id;
      const canReassignUnusedCode = code
        && code.owner_org_id
        && code.owner_org_id !== store.id
        && Number(code.used_count || 0) === 0;
      if (code && (code.product_model_id !== plan.model.id || (code.owner_org_id && code.owner_org_id !== store.id && !isProvinceSelfStore && !canReassignUnusedCode))) {
        throw new Error(`Preflight failed: target warranty code conflict for ${plan.reelNumber} (targetModel=${code.product_model_id}, sourceModel=${plan.model.id}, targetOwner=${code.owner_org_id || 'none'}, sourceOwner=${store.id}).`);
      }
      plan.code = code ? {
        ...code,
        transferFromProvinceSelfStore: isProvinceSelfStore,
        reassignUnusedLegacyCode: canReassignUnusedCode,
      } : {
        id: stableId('legacy-code', plan.reelNumber),
        code: plan.reelNumber,
        product_model_id: plan.model.id,
        owner_org_id: store.id,
        usage_limit: Number(plan.model.usage_limit || 1),
        used_count: 0,
        isNew: true,
      };
      plan.existingRecordId = existingRecordIds.has(plan.recordId)
        ? plan.recordId
        : existingRecordByCodeAndTime.get(`${plan.reelNumber}:${plan.createdAt}`) || null;
    }

    const prospectiveCustomers = new Map();
    for (const plan of plans) {
      let customer = customersByPhone.get(plan.phone);
      if (!customer) {
        customer = { id: stableId('legacy-customer', plan.phone), phone: plan.phone, name: plan.customerName, isNew: true };
        prospectiveCustomers.set(customer.id, customer);
        customersByPhone.set(plan.phone, customer);
      }
      plan.customer = customer;
    }
    const existingVehicleRows = await rowsByIn(connection,
      'SELECT id, customer_id, plate_no, vin, brand, model FROM vehicles WHERE customer_id IN',
      [...new Set(plans.filter((plan) => !plan.customer.isNew).map((plan) => plan.customer.id))]);
    const vehiclesByCustomerPlate = new Map(existingVehicleRows.map((vehicle) => [`${vehicle.customer_id}:${vehicle.plate_no}`, vehicle]));
    const prospectiveVehicles = new Map();
    for (const plan of plans) {
      const customer = plan.customer;
      const vehicleKey = `${customer.id}:${plan.plateNo}`;
      let vehicle = vehiclesByCustomerPlate.get(vehicleKey) || prospectiveVehicles.get(vehicleKey);
      if (!vehicle) {
        vehicle = {
          id: stableId('legacy-vehicle', vehicleKey),
          customer_id: customer.id,
          plate_no: plan.plateNo,
          vin: string(plan.order.frameNumber) || null,
          brand: '旧系统未录入品牌',
          model: string(plan.order.vehicleModel) || '旧系统未录入车型',
          isNew: true,
        };
        prospectiveVehicles.set(vehicleKey, vehicle);
      }
      plan.vehicle = vehicle;
      plan.points = plan.status === 'active' ? selectPoints(pointsRules, plan.model.id, plan.createdAt) : 0;
    }

    const activeNewPlans = plans.filter((plan) => plan.status === 'active' && !plan.existingRecordId);
    const newCodeUsage = new Map();
    for (const plan of activeNewPlans) {
      newCodeUsage.set(plan.reelNumber, (newCodeUsage.get(plan.reelNumber) || 0) + 1);
    }
    for (const plan of plans) {
      const code = plan.code;
      const nextUsed = Number(code.used_count || 0) + (newCodeUsage.get(plan.reelNumber) || 0);
      if (nextUsed > Number(code.usage_limit || plan.model.usage_limit || 1)) {
        throw new Error(`Preflight failed: warranty code ${plan.reelNumber} would exceed its usage limit.`);
      }
    }

    const report = {
      mode: apply ? 'apply' : 'dry-run',
      batch,
      sourceOrders: orders.length,
      sourceItems: plans.length,
      targetExistingRecordsSkipped: plans.filter((plan) => plan.existingRecordId).length,
      targetNewRecords: plans.filter((plan) => !plan.existingRecordId).length,
      sourceActiveRecords: plans.filter((plan) => plan.status === 'active').length,
      sourcePendingManualReviewRecords: plans.filter((plan) => plan.status !== 'active').length,
      newActiveRecords: activeNewPlans.length,
      newPendingManualReviewRecords: plans.filter((plan) => plan.status !== 'active' && !plan.existingRecordId).length,
      uniqueWarrantyCodes: sourceCodes.size,
      newWarrantyCodes: [...new Set(plans.filter((plan) => plan.code.isNew).map((plan) => plan.reelNumber))].length,
      unusedWarrantyCodesReassignedToLegacyActualStore: [...new Set(plans
        .filter((plan) => plan.code.reassignUnusedLegacyCode)
        .map((plan) => plan.reelNumber))].length,
      newlyCreatedStores: prospectiveStores.size,
      newlyCreatedCustomers: prospectiveCustomers.size,
      newlyCreatedVehicles: prospectiveVehicles.size,
      missingPlatePlaceholders: missingPlateCount,
      pointsToAward: activeNewPlans.reduce((sum, plan) => sum + plan.points, 0),
      productModels: countBy(plans.map((plan) => plan.model.model_code)),
    };

    if (!apply) {
      console.log('HAMOREY_LEGACY_DELTA_DRY_RUN');
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    await connection.beginTransaction();
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await connection.query(
        `INSERT INTO import_batches (id, file_name, batch_name, total_rows, success_rows, error_rows, status, created_at)
         VALUES (?, ?, ?, ?, ?, 0, 'imported', ?)
         ON DUPLICATE KEY UPDATE total_rows = VALUES(total_rows), success_rows = VALUES(success_rows), error_rows = VALUES(error_rows), status = 'imported'`,
        [batch.id, batch.fileName, batch.name, plans.length, report.targetNewRecords, now],
      );
      for (const store of prospectiveStores.values()) {
        await connection.query(
          `INSERT IGNORE INTO organizations (id, code, type, parent_id, name, status, created_at, updated_at)
           VALUES (?, ?, 'STORE', ?, ?, 'active', ?, ?)`,
          [store.id, store.code, store.parent_id, store.name, now, now],
        );
      }
      for (const customer of prospectiveCustomers.values()) {
        await connection.query(
          `INSERT IGNORE INTO customers (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          [customer.id, customer.name, customer.phone, now, now],
        );
      }
      for (const vehicle of prospectiveVehicles.values()) {
        await connection.query(
          `INSERT IGNORE INTO vehicles (id, customer_id, plate_no, vin, brand, model, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [vehicle.id, vehicle.customer_id, vehicle.plate_no, vehicle.vin, vehicle.brand, vehicle.model, now, now],
        );
      }
      const uniqueCodes = new Map(plans.map((plan) => [plan.reelNumber, plan]));
      for (const plan of uniqueCodes.values()) {
        const code = plan.code;
        if (code.isNew) {
          await connection.query(
            `INSERT INTO warranty_codes (id, code, product_model_id, imported_product_name, batch_no, import_batch_id, owner_org_id, usage_limit, used_count, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'in_stock', ?)`,
            [code.id, code.code, code.product_model_id, plan.productLabel || plan.model.display_name, batch.name, batch.id, code.owner_org_id, code.usage_limit, now],
          );
          await connection.query(
            `INSERT IGNORE INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, reason, created_at)
             VALUES (?, ?, ?, ?, 'allocate', '旧小程序后台增量迁移', ?)`,
            [stableId('legacy-allocation', code.id), code.id, hq.id, code.owner_org_id, now],
          );
        } else if (!code.owner_org_id || code.transferFromProvinceSelfStore || code.reassignUnusedLegacyCode) {
          const previousOwnerId = code.owner_org_id || hq.id;
          await connection.query('UPDATE warranty_codes SET owner_org_id = ? WHERE id = ?', [plan.store.id, code.id]);
          await connection.query(
            `INSERT IGNORE INTO code_allocations (id, warranty_code_id, from_org_id, to_org_id, action, reason, created_at)
             VALUES (?, ?, ?, ?, 'allocate', ?, ?)`,
            [
              stableId('legacy-allocation', `${code.id}:${plan.store.id}`),
              code.id,
              previousOwnerId,
              plan.store.id,
              code.reassignUnusedLegacyCode ? '旧小程序后台实际门店归属校准' : '省代自营门店身份补齐（旧系统增量迁移）',
              now,
            ],
          );
        }
      }
      for (const plan of plans) {
        if (plan.existingRecordId) continue;
        const approvedAt = plan.status === 'active' ? plan.createdAt : null;
        await connection.query(
          `INSERT INTO warranty_records (
            id, certificate_no, warranty_code_id, vehicle_id, customer_id, customer_name_snapshot, customer_phone_snapshot,
            plate_no_snapshot, vin_snapshot, vehicle_brand_snapshot, vehicle_model_snapshot, store_id, store_name_snapshot,
            province_org_id, product_model_id, product_name_snapshot, product_model_snapshot, warranty_years_snapshot,
            installation_date, warranty_expiry_date, status, submitted_at, approved_at, store_points_awarded,
            province_points_awarded, created_at, updated_at
          ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          [
            plan.recordId, plan.code.id, plan.vehicle.id, plan.customer.id, plan.customerName, plan.phone,
            plan.plateNo, plan.vehicle.vin, plan.vehicle.brand, plan.vehicle.model, plan.store.id, plan.storeName,
            plan.provinceOrgId, plan.model.id, plan.productLabel || plan.model.display_name, plan.model.display_name,
            plan.warrantyYears, plan.installationDate, plan.expiryDate, plan.status, plan.createdAt, approvedAt,
            plan.points, plan.createdAt, plan.createdAt,
          ],
        );
        const action = plan.status === 'active' ? 'approve' : 'submit';
        const fromStatus = plan.status === 'active' ? 'pending' : 'draft';
        await connection.query(
          `INSERT IGNORE INTO warranty_audit_logs (id, warranty_record_id, action, from_status, to_status, note, snapshot_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            stableId('legacy-audit', plan.recordId), plan.recordId, action, fromStatus, plan.status,
            plan.status === 'active' ? '旧小程序后台已完成质保迁移' : '旧小程序后台状态异常，待人工复核',
            sourceSnapshot(plan.order, plan.item, plan.model.model_code), plan.createdAt,
          ],
        );
        if (plan.status === 'active' && plan.points) {
          await connection.query(
            `INSERT IGNORE INTO points_ledger (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, created_at)
             VALUES (?, ?, 'award', ?, 0, 'warranty', ?, '旧小程序后台增量质保积分迁移', ?)`,
            [stableId('legacy-points', plan.recordId), plan.store.id, plan.points, plan.recordId, plan.createdAt],
          );
        }
      }
      for (const plan of uniqueCodes.values()) {
        const code = plan.code;
        const increments = newCodeUsage.get(plan.reelNumber) || 0;
        if (!increments) continue;
        const used = Number(code.used_count || 0) + increments;
        await connection.query(
          'UPDATE warranty_codes SET used_count = ?, status = ? WHERE id = ?',
          [used, codeStatus(used, Number(code.usage_limit || plan.model.usage_limit || 1)), code.id],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    console.log('HAMOREY_LEGACY_DELTA_IMPORT_DONE');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
