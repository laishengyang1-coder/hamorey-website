-- ============================================================
-- Phase 6: Align window-film catalog with the retail-store price sheet.
-- Adds concrete front-windshield and side-window models and removes
-- irrelevant non-window claim parts from window-film pricing.
-- ============================================================

INSERT OR IGNORE INTO product_models (
  id, product_id, model_code, display_name, warranty_years, usage_limit, status, sort_order
) VALUES
  ('pm-wf-hg70', 'prod-wf', 'WF-HG70', '和光70', 10, 36, 'active', 0),
  ('pm-wf-hg25', 'prod-wf', 'WF-HG25', '和光25', 10, 18, 'active', 1),
  ('pm-wf-hd70', 'prod-wf', 'WF-HD70', '和盾70', 10, 36, 'active', 2),
  ('pm-wf-hd10', 'prod-wf', 'WF-HD10', '和盾10', 10, 18, 'active', 3),
  ('pm-wf-hd35', 'prod-wf', 'WF-HD35', '和盾35', 10, 18, 'active', 4),
  ('pm-wf-hh70', 'prod-wf', 'WF-HH70', '和护70', 8, 36, 'active', 5),
  ('pm-wf-hh15', 'prod-wf', 'WF-HH15', '和护15', 8, 18, 'active', 6),
  ('pm-wf-hh25', 'prod-wf', 'WF-HH25', '和护25', 8, 18, 'active', 7),
  ('pm-wf-hz75', 'prod-wf', 'WF-HZ75', '和真75', 8, 36, 'active', 8),
  ('pm-wf-hz15', 'prod-wf', 'WF-HZ15', '和真15', 8, 18, 'active', 9),
  ('pm-wf-hz35', 'prod-wf', 'WF-HZ35', '和真35', 8, 18, 'active', 10),
  ('pm-wf-hy75', 'prod-wf', 'WF-HY75', '和原75', 5, 36, 'active', 11),
  ('pm-wf-hy10', 'prod-wf', 'WF-HY10', '和原10', 5, 18, 'active', 12),
  ('pm-wf-hy35', 'prod-wf', 'WF-HY35', '和原35', 5, 18, 'active', 13);

UPDATE product_models
SET status = 'active',
    updated_at = datetime('now')
WHERE model_code IN (
  'WF-HG70', 'WF-HG25', 'WF-HD70', 'WF-HD10', 'WF-HD35',
  'WF-HH70', 'WF-HH15', 'WF-HH25', 'WF-HZ75', 'WF-HZ15',
  'WF-HZ35', 'WF-HY75', 'WF-HY10', 'WF-HY35'
);

-- Keep historical coarse model rows for referential safety, but hide them from active management.
UPDATE product_models
SET status = 'inactive',
    updated_at = datetime('now')
WHERE id IN ('pm-wf-auris', 'pm-wf-fortex', 'pm-wf-lumis', 'pm-wf-nex5', 'pm-wf-purex');

UPDATE warranty_codes
SET product_model_id = CASE
  WHEN imported_product_name LIKE '%和光70%' THEN 'pm-wf-hg70'
  WHEN imported_product_name LIKE '%和光25%' THEN 'pm-wf-hg25'
  WHEN imported_product_name LIKE '%和盾70%' THEN 'pm-wf-hd70'
  WHEN imported_product_name LIKE '%和盾10%' THEN 'pm-wf-hd10'
  WHEN imported_product_name LIKE '%和盾35%' THEN 'pm-wf-hd35'
  WHEN imported_product_name LIKE '%和护70%' THEN 'pm-wf-hh70'
  WHEN imported_product_name LIKE '%和护15%' THEN 'pm-wf-hh15'
  WHEN imported_product_name LIKE '%和护25%' THEN 'pm-wf-hh25'
  WHEN imported_product_name LIKE '%和真75%' THEN 'pm-wf-hz75'
  WHEN imported_product_name LIKE '%和真15%' THEN 'pm-wf-hz15'
  WHEN imported_product_name LIKE '%和真35%' THEN 'pm-wf-hz35'
  WHEN imported_product_name LIKE '%和原75%' THEN 'pm-wf-hy75'
  WHEN imported_product_name LIKE '%和原10%' THEN 'pm-wf-hy10'
  WHEN imported_product_name LIKE '%和原35%' THEN 'pm-wf-hy35'
  ELSE product_model_id
END
WHERE imported_product_name LIKE '和膜/%';

UPDATE warranty_records
SET product_model_id = (
      SELECT wc.product_model_id FROM warranty_codes wc WHERE wc.id = warranty_records.warranty_code_id
    ),
    product_model_snapshot = (
      SELECT pm.display_name
      FROM warranty_codes wc
      JOIN product_models pm ON pm.id = wc.product_model_id
      WHERE wc.id = warranty_records.warranty_code_id
    ),
    warranty_years_snapshot = COALESCE((
      SELECT pm.warranty_years
      FROM warranty_codes wc
      JOIN product_models pm ON pm.id = wc.product_model_id
      WHERE wc.id = warranty_records.warranty_code_id
    ), warranty_years_snapshot),
    updated_at = datetime('now')
WHERE warranty_code_id IN (
  SELECT wc.id
  FROM warranty_codes wc
  JOIN product_models pm ON pm.id = wc.product_model_id
  JOIN products p ON p.id = pm.product_id
  WHERE p.category = 'window_film'
);

DELETE FROM claim_prices
WHERE product_model_id IN (
  SELECT pm.id
  FROM product_models pm
  JOIN products p ON p.id = pm.product_id
  WHERE p.category = 'window_film'
);

INSERT OR IGNORE INTO claim_prices (
  id, product_model_id, claim_part_id, price_cents, effective_from, effective_to, status, updated_by, updated_at
) VALUES
  ('cp-wf-hg70-front', 'pm-wf-hg70', 'cp-wf-front', 1680000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hg25-side', 'pm-wf-hg25', 'cp-wf-side', 1580000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hd70-front', 'pm-wf-hd70', 'cp-wf-front', 498000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hd10-side', 'pm-wf-hd10', 'cp-wf-side', 498000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hd35-side', 'pm-wf-hd35', 'cp-wf-side', 498000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hh70-front', 'pm-wf-hh70', 'cp-wf-front', 368000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hh15-side', 'pm-wf-hh15', 'cp-wf-side', 368000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hh25-side', 'pm-wf-hh25', 'cp-wf-side', 368000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hz75-front', 'pm-wf-hz75', 'cp-wf-front', 228000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hz15-side', 'pm-wf-hz15', 'cp-wf-side', 228000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hz35-side', 'pm-wf-hz35', 'cp-wf-side', 228000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hy75-front', 'pm-wf-hy75', 'cp-wf-front', 135000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hy10-side', 'pm-wf-hy10', 'cp-wf-side', 135000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now')),
  ('cp-wf-hy35-side', 'pm-wf-hy35', 'cp-wf-side', 135000, '2026-06-09', NULL, 'active', 'user-hq-admin-001', datetime('now'));
