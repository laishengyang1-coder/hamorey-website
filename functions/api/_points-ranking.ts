import { queryAll } from './_lib';

interface RankedStore {
  org_id: string;
  name: string;
  province: string | null;
  city: string | null;
  count: number;
  position: number;
}

/** 前 20 家门店及指定门店的实际名次，共用同一次累计积分排序。 */
export function getNationalStoreRanking(db: D1Database, storeId: string | null = null) {
  return queryAll<RankedStore>(db,
    `WITH RECURSIVE excluded AS (
       SELECT id FROM organizations WHERE points_exempt = 1
       UNION ALL SELECT o.id FROM organizations o JOIN excluded e ON o.parent_id = e.id
     ), totals AS (
       SELECT o.id AS org_id, o.name, o.province, o.city, SUM(pl.points_change) AS count
       FROM organizations o JOIN points_ledger pl ON pl.organization_id = o.id
       WHERE o.type = 'STORE' AND pl.change_type IN ('award', 'adjust')
         AND o.id NOT IN (SELECT id FROM excluded)
       GROUP BY o.id
       HAVING SUM(pl.points_change) > 0
     ), ranked AS (
       SELECT totals.*, ROW_NUMBER() OVER (ORDER BY count DESC, name ASC, org_id ASC) AS position
       FROM totals
     )
     SELECT * FROM ranked WHERE position <= 20 OR org_id = ? ORDER BY position`,
    storeId,
  );
}
