-- ============================================================
-- 批量补录「部位报价」(claim_prices)
-- 目标库：生产 D1 (hemoppf.com 线上库)
-- 执行（务必 --remote，不要 --local）：
--   wrangler d1 execute hamorey-db --remote -y --file=./scripts/batch-claim-prices.sql
-- ============================================================
-- 规则（按产品分类匹配对应部位）：
--   price_cents     = 100000  （= 1000 元，单位：分）
--   effective_from  = '2026-07-14'
--   effective_to    = NULL
--   status          = 'active'
--   updated_by      = 'user-hq-admin-001'  （生产库真实存在的 HQ 管理员用户，满足 updated_by 外键约束）
--   updated_at      = datetime('now')
-- 重复策略：仅补缺失。该 (product_model_id, claim_part_id) 组合已存在 claim_prices 记录则跳过（不覆盖）。
-- id 采用确定性值 'cp-' || pm.id || '-' || cp.id，已确认与生产库现有 id 无冲突。
-- 注意：生产库已存在 1 条 (pm-ppf-hw8, cp-front-bumper)，本脚本会自动跳过该组合。
-- ============================================================

INSERT INTO claim_prices (id, product_model_id, claim_part_id, price_cents, effective_from, effective_to, status, updated_by, updated_at)
SELECT
  'cp-' || pm.id || '-' || cp.id,
  pm.id,
  cp.id,
  100000,
  '2026-07-14',
  NULL,
  'active',
  'user-hq-admin-001',
  datetime('now')
FROM product_models pm
JOIN products p ON p.id = pm.product_id
JOIN claim_parts cp ON (
  (p.category IN ('ppf', 'color_ppf') AND cp.category = 'ppf')
  OR (p.category = 'window_film' AND cp.category = 'window_film')
  OR (p.category = 'sunroof_film' AND cp.category = 'sunroof_film')
)
WHERE NOT EXISTS (
  SELECT 1 FROM claim_prices cpp
  WHERE cpp.product_model_id = pm.id AND cpp.claim_part_id = cp.id
);
