-- Compatibility catalog row for legacy window-film inventory still in circulation.
INSERT INTO product_models (
  id, product_id, model_code, display_name, warranty_years,
  warranty_price_cents, usage_limit, status, sort_order, created_at, updated_at
) VALUES (
  'pm-legacy-wf-hzun', 'prod-wf', 'WF-HZUN', '和尊窗膜', 15,
  NULL, 15, 'inactive', 99, datetime('now'), datetime('now')
)
ON CONFLICT(model_code) DO UPDATE SET
  display_name = excluded.display_name,
  warranty_years = excluded.warranty_years,
  usage_limit = excluded.usage_limit,
  status = 'inactive',
  updated_at = datetime('now');
