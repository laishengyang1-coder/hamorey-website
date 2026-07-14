-- ============================================================
-- HAMOREY 门店地址 & 公开资料迁移
-- 1. 为 organizations 表增加 address 列
-- 2. 为所有已有 STORE 组织自动补录 store_public_profiles
--    （幂等：已存在 profile 的门店不会重复插入）
-- 执行：wrangler d1 execute hamorey-db --remote -y --file=./scripts/migrate-store-address-and-profiles.sql
-- ============================================================

PRAGMA foreign_keys = ON;

-- 步骤 1：增加详细地址列
ALTER TABLE organizations ADD COLUMN address TEXT;

-- 步骤 2：为没有公开资料的门店创建默认公开资料
-- 默认授权等级 Service_Point，默认立即公开 is_public=1
INSERT INTO store_public_profiles (
  id,
  organization_id,
  public_name,
  auth_level,
  province,
  city,
  address,
  phone,
  is_public,
  sort_order,
  created_at,
  updated_at
)
SELECT
  lower(hex(randomblob(16))),
  o.id,
  o.name,
  'Service_Point',
  o.province,
  o.city,
  o.address,
  o.phone,
  1,
  0,
  datetime('now'),
  datetime('now')
FROM organizations o
WHERE o.type = 'STORE'
  AND NOT EXISTS (
    SELECT 1 FROM store_public_profiles spp WHERE spp.organization_id = o.id
  );
