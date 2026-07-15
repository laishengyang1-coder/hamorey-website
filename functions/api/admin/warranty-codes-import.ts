// ============================================================
// POST /api/admin/warranty-codes/import — 质保码导入（预检+确认写入）
// 阶段1: { mode: 'check', rows: [...] } → 预检
// 阶段2: { mode: 'import', batch_name, rows: [...] } → 写入
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, batch, writeOperationLog , getAuthUser} from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

interface ImportRow {
  code: string;
  batch_no: string;
  model_code: string;
  product_name?: string;
}

interface CheckResult {
  total: number;
  valid: number;
  errors: Array<{ row: number; code: string; reason: string }>;
  errorFileKey?: string;
}

/** 预检：查重+查型号 */
async function checkRows(
  db: D1Database,
  rows: ImportRow[],
): Promise<CheckResult> {
  const errors: Array<{ row: number; code: string; reason: string }> = [];
  const codes = rows.map((r) => r.code);
  const modelCodes = [...new Set(rows.map((r) => r.model_code))];

  // 查询已存在的质保码
  const existing = await queryAll<{ code: string }>(
    db,
    `SELECT code FROM warranty_codes WHERE code IN (${codes.map(() => '?').join(',')})`,
    ...codes,
  );
  const existingSet = new Set(existing.map((e) => e.code));

  // 查询有效型号（同时按 model_code 和 display_name 匹配）
  const allModels = await queryAll<{ model_code: string; display_name: string; id: string }>(
    db,
    `SELECT id, model_code, display_name FROM product_models WHERE status = 'active'`,
  );
  // 构建匹配集合：型号编码和显示名称都能匹配
  const modelCodeSet = new Set(allModels.map((m) => m.model_code));
  const modelNameSet = new Set(allModels.map((m) => m.display_name));
  // 用于查找：用户填的值→实际的 model_code
  const nameToCode = new Map<string, string>();
  allModels.forEach((m) => {
    nameToCode.set(m.model_code, m.model_code);
    nameToCode.set(m.display_name, m.model_code);
  });

  // 逐行校验
  const codeDupCheck = new Set<string>();
  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    if (!row.code || !row.code.trim()) {
      errors.push({ row: rowNum, code: '', reason: '质保码为空' });
      return;
    }
    if (!row.batch_no || !row.batch_no.trim()) {
      errors.push({ row: rowNum, code: row.code, reason: '批次号为空' });
      return;
    }
    if (!row.model_code || !row.model_code.trim()) {
      errors.push({ row: rowNum, code: row.code, reason: '型号编码为空' });
      return;
    }
    if (codeDupCheck.has(row.code)) {
      errors.push({ row: rowNum, code: row.code, reason: '文件中重复' });
      return;
    }
    codeDupCheck.add(row.code);
    if (existingSet.has(row.code)) {
      errors.push({ row: rowNum, code: row.code, reason: '质保码已存在' });
      return;
    }
    if (!modelCodeSet.has(row.model_code) && !modelNameSet.has(row.model_code)) {
      errors.push({ row: rowNum, code: row.code, reason: `产品 "${row.model_code}" 不存在或已停用` });
      return;
    }
  });

  return {
    total: rows.length,
    valid: rows.length - errors.length,
    errors,
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      mode?: string;
      batch_name?: string;
      file_name?: string;
      rows?: ImportRow[];
    };

    if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
      return error('没有可导入的数据', 400);
    }

    const rows = body.rows;
    const user = getAuthUser(context.data);

    // === 阶段1：预检 ===
    if (body.mode === 'check' || !body.mode) {
      const result = await checkRows(context.env.DB, rows);

      // 如果有错误，生成错误清单
      if (result.errors.length > 0) {
        // 生成错误清单 CSV 内容
        const csvHeader = '行号,质保码,错误原因\n';
        const csvBody = result.errors
          .map((e) => `${e.row},${e.code},${e.reason}`)
          .join('\n');
        const csvContent = '\uFEFF' + csvHeader + csvBody; // BOM for Excel UTF-8

        const errorFileKey = `import-errors/${generateId()}.csv`;
        await context.env.R2.put(errorFileKey, csvContent, {
          httpMetadata: { contentType: 'text/csv; charset=utf-8' },
        });

        result.errorFileKey = errorFileKey;
      }

      return ok(result);
    }

    // === 阶段2：确认导入 ===
    if (body.mode === 'import') {
      // 再次预检确保数据有效
      const checkResult = await checkRows(context.env.DB, rows);
      if (checkResult.errors.length > 0) {
        return error('数据校验未通过，请修复错误后重新导入', 400, { errors: checkResult.errors });
      }

      // 查询型号 ID 映射（同时支持 model_code 和 display_name）
      const allModels = await queryAll<{ id: string; model_code: string; display_name: string; usage_limit: number | null }>(
        context.env.DB,
        `SELECT id, model_code, display_name, usage_limit FROM product_models WHERE status = 'active'`,
      );
      const modelMap = new Map<string, { id: string; usage_limit: number }>();
      allModels.forEach((m) => {
        const item = { id: m.id, usage_limit: Math.max(1, Number(m.usage_limit) || 1) };
        modelMap.set(m.model_code, item);
        modelMap.set(m.display_name, item);
      });

      // 事务写入
      const batchId = generateId();
      const importBatchId = generateId();
      const statements: Array<{ sql: string; params: unknown[] }> = [];

      // 1. 创建导入批次
      statements.push({
        sql: `INSERT INTO import_batches (id, file_name, batch_name, total_rows, success_rows, error_rows, status, created_by, created_at)
              VALUES (?, ?, ?, ?, ?, 0, 'imported', ?, datetime('now'))`,
        params: [importBatchId, body.file_name || 'unknown.xlsx', body.batch_name || batchId, rows.length, rows.length, user?.userId || null],
      });

      // 2. 批量插入质保码
      for (const row of rows) {
        const codeId = generateId();
        const model = modelMap.get(row.model_code);
        statements.push({
          sql: `INSERT INTO warranty_codes (id, code, product_model_id, imported_product_name, batch_no, import_batch_id, owner_org_id, usage_limit, used_count, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0, 'unallocated', datetime('now'))`,
          params: [codeId, row.code, model?.id, row.product_name || null, row.batch_no, importBatchId, model?.usage_limit || 1],
        });
      }

      await batch(context.env.DB, statements);

      await writeOperationLog(
        context.env.DB, user?.userId || null, 'import_warranty_codes',
        'warranty_codes', importBatchId,
        { batch_name: body.batch_name, total: rows.length },
        getClientIP(context.request),
      );

      return ok({ batchId: importBatchId, total: rows.length }, '导入成功');
    }

    return error('无效的操作模式', 400);
  } catch (err) {
    console.error('[admin/warranty-codes/import]', err);
    return error('导入失败', 500);
  }
};
