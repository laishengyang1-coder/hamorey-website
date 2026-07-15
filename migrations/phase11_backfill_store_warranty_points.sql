-- Phase 11: Backfill store warranty points for historical active records.
-- Province/agent rebates are intentionally not backfilled here.
-- Safe to run repeatedly: idx_warranty_award_once prevents duplicate awards.

INSERT OR IGNORE INTO points_ledger (
  id,
  organization_id,
  change_type,
  points_change,
  frozen_change,
  related_type,
  related_id,
  reason,
  operator_user_id,
  created_at
)
SELECT
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-' ||
  lower(hex(randomblob(2))) || '-' ||
  lower(hex(randomblob(2))) || '-' ||
  lower(hex(randomblob(6))) AS id,
  wr.store_id AS organization_id,
  'award' AS change_type,
  pr.points AS points_change,
  0 AS frozen_change,
  'warranty' AS related_type,
  wr.id AS related_id,
  '历史质保积分补发: ' || COALESCE(wr.certificate_no, wc.code) AS reason,
  NULL AS operator_user_id,
  COALESCE(wr.approved_at, wr.submitted_at, wr.created_at, datetime('now')) AS created_at
FROM warranty_records wr
JOIN warranty_codes wc ON wc.id = wr.warranty_code_id
JOIN points_rules pr
  ON pr.product_model_id = wr.product_model_id
 AND pr.status = 'active'
 AND pr.effective_from <= datetime('now')
 AND (pr.effective_to IS NULL OR pr.effective_to >= datetime('now'))
WHERE wr.status = 'active'
  AND pr.points > 0
  AND NOT EXISTS (
    SELECT 1
    FROM points_ledger pl
    WHERE pl.organization_id = wr.store_id
      AND pl.related_type = 'warranty'
      AND pl.change_type = 'award'
      AND pl.related_id = wr.id
  );

UPDATE warranty_records
SET store_points_awarded = COALESCE((
  SELECT pr.points
  FROM points_rules pr
  WHERE pr.product_model_id = warranty_records.product_model_id
    AND pr.status = 'active'
    AND pr.effective_from <= datetime('now')
    AND (pr.effective_to IS NULL OR pr.effective_to >= datetime('now'))
  ORDER BY pr.effective_from DESC
  LIMIT 1
), 0)
WHERE status = 'active'
  AND COALESCE(store_points_awarded, 0) = 0;
