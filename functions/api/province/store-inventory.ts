// ============================================================
// Province StoreInventory — 省代查看「下属门店」的质保码库存
// ------------------------------------------------------------
//   GET /api/province/store-inventory               → 门店列表（每家一行汇总）+ 全量汇总
//   GET /api/province/store-inventory?store_id=xxx  → 指定门店的码明细 + 该店汇总
//
// 口径（必须与 province/warranty-codes.ts 保持一致，勿另写一套）：
//   - warranty_codes.used_count / status 是**半维护冗余列，不可信**
//   - 一律用 warranty_records 实时聚合，只统计 pending/active/expired（draft/rejected/voided 不占额度）
//   - used_count 用 MIN(实际条数, usage_limit) 夹住，防止历史记录溢出
//   - 可用(available) = in_stock + partial_used（还能再登记的数量）
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryFirst, queryAll, getAuthUser } from '../_lib';
import { ok, error } from '../_middleware';

interface Env {
  DB: D1Database;
}

/** 每个码「实际被占用次数」的派生表 */
const USAGE_SUBQUERY = `SELECT warranty_code_id, COUNT(*) AS actual_used_count
                          FROM warranty_records
                         WHERE status IN ('pending', 'active', 'expired')
                         GROUP BY warranty_code_id`;

/**
 * 按归属组织聚合：合计 / 未用 / 部分使用 / 已用完 / 冻结作废。
 * 用 COUNT(CASE WHEN … THEN 1 END) 而不是 SUM(…)：MySQL 的 SUM 对整型返回 DECIMAL，
 * 经 mysql2 会变成字符串，前端比对/排序会出问题。
 */
function buildAggregateSql(ownerWhere: string, ownerParamCount: number): string {
  const placeholders = Array.from({ length: ownerParamCount }, () => '?').join(', ');
  return `SELECT wc.owner_org_id,
                 COUNT(*) AS total,
                 COUNT(CASE WHEN wc.status IN ('frozen','voided') THEN 1 END) AS frozen_voided,
                 COUNT(CASE WHEN wc.status NOT IN ('frozen','voided')
                             AND COALESCE(wu.actual_used_count, 0) = 0 THEN 1 END) AS in_stock,
                 COUNT(CASE WHEN wc.status NOT IN ('frozen','voided')
                             AND COALESCE(wu.actual_used_count, 0) > 0
                             AND COALESCE(wu.actual_used_count, 0) < wc.usage_limit THEN 1 END) AS partial_used,
                 COUNT(CASE WHEN wc.status NOT IN ('frozen','voided')
                             AND COALESCE(wu.actual_used_count, 0) >= wc.usage_limit THEN 1 END) AS exhausted
            FROM warranty_codes wc
            LEFT JOIN (${USAGE_SUBQUERY}) wu ON wu.warranty_code_id = wc.id
           WHERE ${ownerWhere}
           GROUP BY wc.owner_org_id`;
}

interface AggRow {
  owner_org_id: string;
  total: number;
  frozen_voided: number;
  in_stock: number;
  partial_used: number;
  exhausted: number;
}

/** 把聚合行规整成前端要的 6 个数字 */
function shapeCounts(row: AggRow | null | undefined) {
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const total = n(row?.total);
  const inStock = n(row?.in_stock);
  const partial = n(row?.partial_used);
  const exhausted = n(row?.exhausted);
  return {
    total,
    in_stock: inStock,
    partial_used: partial,
    exhausted,
    frozen_voided: n(row?.frozen_voided),
    available: inStock + partial, // 还能再登记的数量
  };
}

interface StoreRow {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  status: string;
  audit_status: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const url = new URL(context.request.url);
    const storeId = (url.searchParams.get('store_id') || '').trim();

    // ---------- 模式二：某一家门店的码明细 ----------
    if (storeId) {
      // 归属校验：必须是本省代的下属门店（同 warranty-codes.ts 的做法）
      const store = await queryFirst<StoreRow>(
        context.env.DB,
        `SELECT id, code, name, city, status, audit_status
           FROM organizations
          WHERE id = ? AND parent_id = ? AND type = 'STORE'`,
        storeId, user.orgId,
      );
      if (!store) return error('该门店不属于当前省代，或不存在', 403);

      // ⚠️ 不能直接 Math.min(500, Math.max(1, Number(x)))：x 非数字时 Number 得 NaN，
      //    层层传递仍是 NaN，最终拼成 `LIMIT NaN` 让 SQL 报错、接口 500。
      const rawLimit = Number(url.searchParams.get('pageSize') || 500);
      const limit = Number.isFinite(rawLimit) ? Math.min(500, Math.max(1, Math.floor(rawLimit))) : 500;

      const [aggRow, items] = await Promise.all([
        queryFirst<AggRow>(
          context.env.DB,
          buildAggregateSql('wc.owner_org_id = ?', 1),
          storeId,
        ),
        queryAll<Record<string, unknown>>(
          context.env.DB,
          `SELECT codes.* FROM (
             SELECT wc.id, wc.code, wc.product_model_id, wc.imported_product_name,
                    wc.batch_no, wc.usage_limit,
                    MIN(COALESCE(wu.actual_used_count, 0), wc.usage_limit) AS used_count,
                    CASE
                      WHEN wc.status IN ('frozen', 'voided') THEN wc.status
                      WHEN COALESCE(wu.actual_used_count, 0) >= wc.usage_limit THEN 'exhausted'
                      WHEN COALESCE(wu.actual_used_count, 0) > 0 THEN 'partial_used'
                      ELSE 'in_stock'
                    END AS status,
                    wc.created_at,
                    pm.model_code,
                    pm.display_name AS model_name
               FROM warranty_codes wc
               JOIN product_models pm ON wc.product_model_id = pm.id
               LEFT JOIN (${USAGE_SUBQUERY}) wu ON wu.warranty_code_id = wc.id
              WHERE wc.owner_org_id = ?
           ) codes
           ORDER BY CASE codes.status
                      WHEN 'in_stock' THEN 0
                      WHEN 'partial_used' THEN 1
                      WHEN 'exhausted' THEN 2
                      ELSE 3
                    END,
                    codes.code
           LIMIT ?`,
          storeId, limit,
        ),
      ]);

      const summary = shapeCounts(aggRow);
      return ok({ store, summary, items, total: summary.total });
    }

    // ---------- 模式一：下属门店列表 ----------
    // 与「下属门店」页保持一致：只看 parent_id + type，不隐藏待审核/停用门店（列表里用状态标出）
    const stores = await queryAll<StoreRow>(
      context.env.DB,
      `SELECT id, code, name, city, status, audit_status
         FROM organizations
        WHERE parent_id = ? AND type = 'STORE'
        ORDER BY name`,
      user.orgId,
    );

    const aggRows = stores.length
      ? await queryAll<AggRow>(
          context.env.DB,
          buildAggregateSql(
            `wc.owner_org_id IN (SELECT id FROM organizations WHERE parent_id = ? AND type = 'STORE')`,
            1,
          ),
          user.orgId,
        )
      : [];

    const aggMap = new Map<string, AggRow>();
    for (const row of aggRows) aggMap.set(String(row.owner_org_id), row);

    const list = stores.map((s) => ({ ...s, ...shapeCounts(aggMap.get(s.id)) }));

    // 库存多的排前面；同数量按名称
    list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'zh-CN'));

    const summary = list.reduce(
      (acc, s) => {
        acc.total += s.total;
        acc.in_stock += s.in_stock;
        acc.partial_used += s.partial_used;
        acc.exhausted += s.exhausted;
        acc.frozen_voided += s.frozen_voided;
        acc.available += s.available;
        return acc;
      },
      { store_count: list.length, total: 0, in_stock: 0, partial_used: 0, exhausted: 0, frozen_voided: 0, available: 0 },
    );

    return ok({ summary, stores: list });
  } catch (err) {
    console.error('[province/store-inventory GET]', err);
    return error('获取门店库存失败', 500);
  }
};
