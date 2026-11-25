import { queryFirst } from './_lib';

// SQL 中 wc 指向卷码表；以实际占用次数计算余量，缓存状态只用于识别冻结/作废。
export const availableWarrantyCodeSql = `wc.status NOT IN ('frozen', 'voided')
  AND (SELECT COUNT(*) FROM warranty_records wr WHERE wr.warranty_code_id = wc.id
       AND wr.status IN ('pending', 'active', 'expired')) < wc.usage_limit`;
export function countAvailableWarrantyCodes(db: D1Database, orgId: string) {
  return queryFirst<{ cnt: number }>(db,
    `SELECT COUNT(*) AS cnt FROM warranty_codes wc
      WHERE wc.owner_org_id = ? AND ${availableWarrantyCodeSql}`,
    orgId,
  );
}
