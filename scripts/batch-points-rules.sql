-- ============================================================
-- 批量补录「门店积分规则」(points_rules)
-- 目标库：生产 D1 (hemoppf.com 线上库)
-- 执行（务必 --remote，不要 --local）：
--   wrangler d1 execute hamorey-db --remote -y --file=./scripts/batch-points-rules.sql
-- ============================================================
-- 规则：
--   points          = 100
--   effective_from  = '2026-07-14'
--   effective_to    = NULL   （长期有效）
--   status          = 'active'
--   updated_by      = 'user-hq-admin-001'  （生产库真实存在的 HQ 管理员用户，满足 updated_by 外键约束）
--   updated_at      = datetime('now')
-- 重复策略：仅补缺失。该 product_model_id 已存在任何 points_rules 记录则跳过（不覆盖）。
-- id 采用确定性值 'pr-' || pm.id，已确认与生产库现有 id 无冲突。
-- ============================================================

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
  SELECT 1 FROM points_rules pr WHERE pr.product_model_id = pm.id
);
