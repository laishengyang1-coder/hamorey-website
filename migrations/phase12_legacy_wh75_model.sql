-- Preserve the exact product identity for four historical WH-7.5 warranties.
-- It stays inactive so it does not appear as a current sellable model.

INSERT OR IGNORE INTO product_models (
  id, product_id, model_code, display_name,
  warranty_years, usage_limit, status, sort_order
) VALUES (
  'pm-legacy-wh75', 'prod-ppf', 'WH-7.5', '和膜 透明车衣 WH-7.5',
  6, 1, 'inactive', 99
);
