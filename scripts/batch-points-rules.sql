-- ============================================================
-- 批量补录「门店积分规则」(points_rules)
-- 目标库：生产 D1 (hemoppf.com 线上库)
-- 执行（务必 --remote，不要 --local）：
--   wrangler d1 execute hamorey-db --remote -y --file=./scripts/batch-points-rules.sql
-- ============================================================
-- 规则：
--   points          = 按产品型号分档（窗膜侧挡25、前挡50、和兴80、和旺100、和雅120、和御150、TPU改色200、天窗50）
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
  CASE
    WHEN p.category = 'window_film'
      AND pm.model_code IN ('WF-HG70', 'WF-HD70', 'WF-HH70', 'WF-HZ75', 'WF-HY75') THEN 50
    WHEN p.category = 'window_film' THEN 25
    WHEN p.category = 'ppf' AND pm.model_code IN ('HX8', 'HX9') THEN 80
    WHEN p.category = 'ppf' AND pm.model_code IN ('HW8', 'HW9') THEN 100
    WHEN p.category = 'ppf' AND (pm.model_code IN ('YM-8', 'HYM-MAT') OR pm.display_name LIKE '%和雅%') THEN 120
    WHEN p.category = 'ppf' AND (pm.model_code = 'HY8' OR pm.display_name LIKE '%和御%') THEN 150
    WHEN p.category = 'color_ppf' THEN 200
    WHEN p.category = 'sunroof_film' THEN 50
    ELSE 100
  END,
  '2026-07-14',
  NULL,
  'active',
  'user-hq-admin-001',
  datetime('now')
FROM product_models pm
JOIN products p ON p.id = pm.product_id
WHERE pm.status = 'active'
  AND NOT EXISTS (
  SELECT 1 FROM points_rules pr WHERE pr.product_model_id = pm.id
);
