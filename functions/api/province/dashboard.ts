// ============================================================
// GET /api/province/dashboard — 省代数据看板
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst , getAuthUser} from '../_lib';
import { ok, error } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    const db = context.env.DB;
    const orgId = user.orgId;

    const [storeCount, codeCount, recordCount, pendingCount, points] = await Promise.all([
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM organizations WHERE parent_id = ? AND type = 'STORE'`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_codes WHERE owner_org_id = ? AND status IN ('in_stock','partial_used')`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE province_org_id = ? AND status NOT IN ('draft')`, orgId),
      queryFirst<{ cnt: number }>(db, `SELECT COUNT(*) AS cnt FROM warranty_records WHERE province_org_id = ? AND status = 'pending'`, orgId),
      queryFirst<{ available: number; frozen: number }>(db,
        `SELECT COALESCE(SUM(CASE WHEN change_type IN ('award','adjust','release') THEN points_change WHEN change_type IN ('deduct','revoke') THEN -points_change ELSE 0 END),0) AS available, COALESCE(SUM(CASE WHEN change_type='freeze' THEN frozen_change WHEN change_type IN ('release','deduct') THEN -frozen_change ELSE 0 END),0) AS frozen FROM points_ledger WHERE organization_id = ?`, orgId),
    ]);

    return ok({
      storeCount: storeCount?.cnt ?? 0,
      codeCount: codeCount?.cnt ?? 0,
      recordCount: recordCount?.cnt ?? 0,
      pendingCount: pendingCount?.cnt ?? 0,
      availablePoints: points?.available ?? 0,
      frozenPoints: points?.frozen ?? 0,
    });
  } catch (err) {
    console.error('[province/dashboard GET]', err);
    return error('获取看板数据失败', 500);
  }
};
