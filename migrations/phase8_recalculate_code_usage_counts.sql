-- ============================================================
-- Phase 8: Recalculate warranty-code usage counts from records.
-- Old imports stored film/PPF length in meters inside used_count. The
-- business unit is now "uses", so actual usage comes from warranty_records.
-- ============================================================

DROP TABLE IF EXISTS _phase8_code_usage_recalc;

CREATE TABLE _phase8_code_usage_recalc AS
SELECT
  wc.id,
  CASE
    WHEN p.category = 'window_film'
      AND (
        pm.model_code IN ('WF-HG70', 'WF-HD70', 'WF-HH70', 'WF-HZ75', 'WF-HY75')
        OR wc.imported_product_name LIKE '%70%'
        OR wc.imported_product_name LIKE '%75%'
      )
      THEN 36
    WHEN p.category = 'window_film' THEN 18
    ELSE 1
  END AS new_usage_limit,
  COALESCE((
    SELECT COUNT(*)
    FROM warranty_records wr
    WHERE wr.warranty_code_id = wc.id
      AND wr.status IN ('pending', 'active', 'expired')
  ), 0) AS actual_used_count
FROM warranty_codes wc
JOIN product_models pm ON pm.id = wc.product_model_id
JOIN products p ON p.id = pm.product_id;

UPDATE warranty_codes
SET usage_limit = (
      SELECT new_usage_limit
      FROM _phase8_code_usage_recalc r
      WHERE r.id = warranty_codes.id
    ),
    used_count = (
      SELECT MIN(actual_used_count, new_usage_limit)
      FROM _phase8_code_usage_recalc r
      WHERE r.id = warranty_codes.id
    ),
    status = CASE
      WHEN status IN ('frozen', 'voided') THEN status
      WHEN (
        SELECT actual_used_count
        FROM _phase8_code_usage_recalc r
        WHERE r.id = warranty_codes.id
      ) >= (
        SELECT new_usage_limit
        FROM _phase8_code_usage_recalc r
        WHERE r.id = warranty_codes.id
      ) THEN 'exhausted'
      WHEN (
        SELECT actual_used_count
        FROM _phase8_code_usage_recalc r
        WHERE r.id = warranty_codes.id
      ) > 0 THEN 'partial_used'
      WHEN owner_org_id IS NULL THEN 'unallocated'
      ELSE 'in_stock'
    END
WHERE id IN (SELECT id FROM _phase8_code_usage_recalc);

UPDATE product_models
SET usage_limit = CASE
      WHEN model_code IN ('WF-HG70', 'WF-HD70', 'WF-HH70', 'WF-HZ75', 'WF-HY75') THEN 36
      WHEN product_id = 'prod-wf' THEN 18
      ELSE 1
    END,
    updated_at = datetime('now');

DROP TABLE _phase8_code_usage_recalc;
