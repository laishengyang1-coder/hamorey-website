-- Support the legacy HAMOREY warranty inventory before importing historical data.
-- Safe to run repeatedly.

INSERT OR IGNORE INTO product_models (
    id, product_id, model_code, display_name,
    warranty_years, usage_limit, status, sort_order
) VALUES (
    'pm-cppf-hcui', 'prod-cppf', 'HCUI', '和粹改色车衣',
    10, 1, 'active', 0
);
