-- ============================================================
-- Phase 10: Update warranty-registration points by product model.
-- Product Management product models remain the source of truth.
-- ============================================================

UPDATE points_rules
SET points = CASE
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'window_film'
          AND pm.model_code IN ('WF-HG70', 'WF-HD70', 'WF-HH70', 'WF-HZ75', 'WF-HY75')
      ) THEN 50
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'window_film'
      ) THEN 25
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'ppf' AND pm.model_code IN ('HX8', 'HX9')
      ) THEN 80
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'ppf' AND pm.model_code IN ('HW8', 'HW9')
      ) THEN 100
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'ppf' AND (pm.model_code IN ('YM-8', 'HYM-MAT') OR pm.display_name LIKE '%和雅%')
      ) THEN 120
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'ppf' AND (pm.model_code = 'HY8' OR pm.display_name LIKE '%和御%')
      ) THEN 150
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'color_ppf'
      ) THEN 200
      WHEN product_model_id IN (
        SELECT pm.id
        FROM product_models pm
        JOIN products p ON p.id = pm.product_id
        WHERE p.category = 'sunroof_film'
      ) THEN 50
      ELSE points
    END,
    updated_at = datetime('now')
WHERE status = 'active'
  AND product_model_id IN (
    SELECT id FROM product_models WHERE status = 'active'
  );
