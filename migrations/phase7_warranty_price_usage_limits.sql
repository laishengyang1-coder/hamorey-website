-- ============================================================
-- Phase 7: Product warranty prices and model-level usage limits.
-- Product models own the consumer-facing warranty price and the
-- default usage limit used when importing new warranty codes.
-- ============================================================

ALTER TABLE product_models ADD COLUMN warranty_price_cents INTEGER;

UPDATE product_models
SET usage_limit = CASE model_code
  WHEN 'WF-HG70' THEN 36
  WHEN 'WF-HG25' THEN 18
  WHEN 'WF-HD70' THEN 36
  WHEN 'WF-HD10' THEN 18
  WHEN 'WF-HD35' THEN 18
  WHEN 'WF-HH70' THEN 36
  WHEN 'WF-HH15' THEN 18
  WHEN 'WF-HH25' THEN 18
  WHEN 'WF-HZ75' THEN 36
  WHEN 'WF-HZ15' THEN 18
  WHEN 'WF-HZ35' THEN 18
  WHEN 'WF-HY75' THEN 36
  WHEN 'WF-HY10' THEN 18
  WHEN 'WF-HY35' THEN 18
  ELSE 1
END,
warranty_price_cents = CASE model_code
  WHEN 'WF-HG70' THEN 1680000
  WHEN 'WF-HG25' THEN 1580000
  WHEN 'WF-HD70' THEN 498000
  WHEN 'WF-HD10' THEN 498000
  WHEN 'WF-HD35' THEN 498000
  WHEN 'WF-HH70' THEN 368000
  WHEN 'WF-HH15' THEN 368000
  WHEN 'WF-HH25' THEN 368000
  WHEN 'WF-HZ75' THEN 228000
  WHEN 'WF-HZ15' THEN 228000
  WHEN 'WF-HZ35' THEN 228000
  WHEN 'WF-HY75' THEN 135000
  WHEN 'WF-HY10' THEN 135000
  WHEN 'WF-HY35' THEN 135000
  WHEN 'AURIS-DS' THEN 1680000
  WHEN 'FORTEX-AR' THEN 498000
  WHEN 'LUMIS-UV' THEN 368000
  WHEN 'NEX5-CL' THEN 228000
  WHEN 'PUREX-OG' THEN 135000
  WHEN 'HY8' THEN 1480000
  WHEN 'HW8' THEN 880000
  WHEN 'HW9' THEN 980000
  WHEN 'HX8' THEN 580000
  WHEN 'HX9' THEN 680000
  WHEN 'HYM-MAT' THEN 1280000
  WHEN 'HCUI' THEN 1280000
  WHEN 'T1' THEN 500000
  WHEN 'T2' THEN 500000
  ELSE warranty_price_cents
END,
updated_at = datetime('now');

UPDATE warranty_codes
SET usage_limit = COALESCE((
      SELECT pm.usage_limit
      FROM product_models pm
      WHERE pm.id = warranty_codes.product_model_id
    ), usage_limit),
    used_count = MAX(used_count, (
      SELECT COUNT(*)
      FROM warranty_records wr
      WHERE wr.warranty_code_id = warranty_codes.id
        AND wr.status IN ('pending', 'active', 'expired')
    )),
    status = CASE
      WHEN status IN ('frozen', 'voided') THEN status
      WHEN MAX(used_count, (
        SELECT COUNT(*)
        FROM warranty_records wr
        WHERE wr.warranty_code_id = warranty_codes.id
          AND wr.status IN ('pending', 'active', 'expired')
      )) >= COALESCE((
        SELECT pm.usage_limit
        FROM product_models pm
        WHERE pm.id = warranty_codes.product_model_id
      ), usage_limit) THEN 'exhausted'
      WHEN MAX(used_count, (
        SELECT COUNT(*)
        FROM warranty_records wr
        WHERE wr.warranty_code_id = warranty_codes.id
          AND wr.status IN ('pending', 'active', 'expired')
      )) > 0 THEN 'partial_used'
      WHEN owner_org_id IS NULL THEN 'unallocated'
      ELSE 'in_stock'
    END;

UPDATE system_settings
SET value = '36',
    description = '窗膜前挡质保码默认使用次数上限',
    updated_at = datetime('now')
WHERE key = 'window_film_usage_limit';
