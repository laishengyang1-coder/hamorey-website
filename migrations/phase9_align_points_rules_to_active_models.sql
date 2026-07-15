-- ============================================================
-- Phase 9: Align points rules with active product models.
-- Product Management is the source of truth for warranty product models.
-- ============================================================

UPDATE points_rules
SET status = 'inactive',
    updated_at = datetime('now')
WHERE product_model_id IN (
  SELECT pm.id
  FROM product_models pm
  WHERE pm.status <> 'active'
);

INSERT INTO points_rules (id, product_model_id, points, effective_from, effective_to, status, updated_by, updated_at)
SELECT
  'pr-' || pm.id,
  pm.id,
  100,
  '2026-07-14',
  NULL,
  'active',
  'user-hq-admin-001',
  datetime('now')
FROM product_models pm
WHERE pm.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM points_rules pr
    WHERE pr.product_model_id = pm.id
      AND pr.status = 'active'
  );
