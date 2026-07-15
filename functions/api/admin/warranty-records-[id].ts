// ============================================================
// GET  /api/admin/warranty-records/:id — 记录详情
// PUT  /api/admin/warranty-records/:id — 编辑记录（总部/省代均可）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, execute, batch, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

function extractId(pathname: string): string {
  const parts = pathname.split('/');
  const idx = parts.indexOf('warranty-records');
  return parts[idx + 1] || '';
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    if (user.role !== 'HQ_ADMIN' && user.role !== 'PROVINCE') return error('无权限访问', 403);

    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少记录 ID', 400);

    const record = await queryFirst(
      context.env.DB,
      `SELECT wr.*, wc.code AS warranty_code, pm.display_name AS model_name
       FROM warranty_records wr
       JOIN warranty_codes wc ON wr.warranty_code_id = wc.id
       JOIN product_models pm ON wr.product_model_id = pm.id
       WHERE wr.id = ?`,
      recordId,
    );
    if (!record) return error('记录不存在', 404);

    const photos = await queryAll(
      context.env.DB,
      `SELECT * FROM warranty_photos WHERE warranty_record_id = ? ORDER BY sort_order`,
      recordId,
    );

    return ok({ record, photos });
  } catch (err) {
    console.error('[admin/warranty-records GET]', err);
    return error('获取记录失败', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    if (user.role !== 'HQ_ADMIN' && user.role !== 'PROVINCE') return error('无权操作', 403);

    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少记录 ID', 400);

    const body = (await context.request.json()) as {
      customer_name?: string;
      customer_phone?: string;
      plate_no?: string;
      vin?: string;
      vehicle_brand?: string;
      vehicle_model?: string;
      installation_date?: string;
    };

    const updates: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Record<string, string> = {
      customer_name: 'customer_name_snapshot',
      customer_phone: 'customer_phone_snapshot',
      plate_no: 'plate_no_snapshot',
      vin: 'vin_snapshot',
      vehicle_brand: 'vehicle_brand_snapshot',
      vehicle_model: 'vehicle_model_snapshot',
      installation_date: 'installation_date',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key as keyof typeof body] !== undefined) {
        updates.push(`${col} = ?`);
        params.push(body[key as keyof typeof body]);
      }
    }

    if (updates.length === 0) return error('没有需要更新的字段', 400);

    updates.push("updated_at = datetime('now')");
    params.push(recordId);

    await execute(
      context.env.DB,
      `UPDATE warranty_records SET ${updates.join(', ')} WHERE id = ?`,
      ...params,
    );

    await writeOperationLog(
      context.env.DB,
      user.userId,
      'edit_warranty_record',
      'warranty_records',
      recordId,
      Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
      getClientIP(context.request),
    );

    return ok(null, '修改成功');
  } catch (err) {
    console.error('[admin/warranty-records PUT]', err);
    return error('修改记录失败', 500);
  }
};

// ============================================================
// DELETE /api/admin/warranty-records/:id — 彻底删除记录（仅总部）
// 级联清理：施工照片、证书文件、审核历史、发放积分流水，
// 回退质保码使用次数，并删除 R2 上的图片/证书对象。
// ============================================================
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    if (user.role !== 'HQ_ADMIN') return error('仅总部可删除质保记录', 403);

    const recordId = extractId(new URL(context.request.url).pathname);
    if (!recordId) return error('缺少记录 ID', 400);

    const record = await queryFirst<{
      id: string;
      warranty_code_id: string;
      status: string;
      certificate_no: string | null;
    }>(
      context.env.DB,
      `SELECT id, warranty_code_id, status, certificate_no FROM warranty_records WHERE id = ?`,
      recordId,
    );
    if (!record) return error('记录不存在', 404);

    // 收集需要从 R2 删除的对象键（照片原图/缩略图 + 证书文件）
    const photos = await queryAll<{ file_key: string; thumbnail_key: string | null }>(
      context.env.DB,
      `SELECT file_key, thumbnail_key FROM warranty_photos WHERE warranty_record_id = ?`,
      recordId,
    );
    const certFiles = await queryAll<{ file_key: string }>(
      context.env.DB,
      `SELECT file_key FROM certificate_files WHERE warranty_record_id = ?`,
      recordId,
    );

    const r2Keys = new Set<string>();
    for (const p of photos) {
      if (p.file_key) r2Keys.add(p.file_key);
      if (p.thumbnail_key) r2Keys.add(p.thumbnail_key);
    }
    for (const c of certFiles) {
      if (c.file_key) r2Keys.add(c.file_key);
    }

    // 数据库级联删除（同一批次，保证原子性）
    const statements: Array<{ sql: string; params: unknown[] }> = [
      { sql: `DELETE FROM warranty_photos WHERE warranty_record_id = ?`, params: [recordId] },
      { sql: `DELETE FROM certificate_files WHERE warranty_record_id = ?`, params: [recordId] },
      { sql: `DELETE FROM warranty_audit_logs WHERE warranty_record_id = ?`, params: [recordId] },
      // 回收该质保对应的积分发放流水，避免删除后积分仍残留
      {
        sql: `DELETE FROM points_ledger WHERE related_type = 'warranty' AND related_id = ?`,
        params: [recordId],
      },
    ];

    // 若记录曾审核通过（占用质保码次数），回退质保码使用次数与状态
    if (record.status === 'active' || record.status === 'expired') {
      statements.push({
        sql: `UPDATE warranty_codes
              SET used_count = MAX(0, used_count - 1),
                  status = CASE
                    WHEN MAX(0, used_count - 1) = 0 THEN 'in_stock'
                    WHEN MAX(0, used_count - 1) < usage_limit THEN 'partial_used'
                    ELSE 'exhausted'
                  END
              WHERE id = ?`,
        params: [record.warranty_code_id],
      });
    }

    // 最后删除主记录
    statements.push({ sql: `DELETE FROM warranty_records WHERE id = ?`, params: [recordId] });

    await batch(context.env.DB, statements);

    // 删除 R2 对象（尽力而为，失败不影响记录已删除的结果）
    if (r2Keys.size > 0 && context.env.R2) {
      try {
        await context.env.R2.delete([...r2Keys]);
      } catch (r2Err) {
        console.error('[admin/warranty-records DELETE] R2 cleanup failed', r2Err);
      }
    }

    await writeOperationLog(
      context.env.DB,
      user.userId,
      'delete_warranty_record',
      'warranty_records',
      recordId,
      {
        certificate_no: record.certificate_no,
        status: record.status,
        photos_removed: photos.length,
        certificates_removed: certFiles.length,
      },
      getClientIP(context.request),
    );

    return ok(null, '删除成功');
  } catch (err) {
    console.error('[admin/warranty-records DELETE]', err);
    return error('删除记录失败', 500);
  }
};
