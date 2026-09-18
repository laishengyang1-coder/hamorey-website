-- ============================================================
-- phase15 — 兑换单收货地址快照
-- ============================================================
-- 背景：redemptions 只存了 address_id 指向 addresses(id)，而本库在
-- MySQL 下**没有任何外键约束**（information_schema.REFERENTIAL_CONSTRAINTS 为空），
-- 且 functions/api/store/addresses.ts 允许门店 PUT / DELETE 自己的地址。
-- 结果：门店改动或删除地址后，历史兑换单会指向被改过的地址（总部照新地址发错货）
-- 或悬空 ID（总部彻底查不到收货信息）。
-- 同一个 INSERT 早已对商品名做了 reward_name_snapshot 快照，这里把地址补上同一套保证。
--
-- 已于 2026-09-18 应用于生产库（TDSQL-C cynosdbmysql-ins-534bqge0）。
-- 回滚：
--   ALTER TABLE redemptions
--     DROP COLUMN address_snapshot,
--     DROP COLUMN recipient_phone_snapshot,
--     DROP COLUMN recipient_name_snapshot;
-- ============================================================

ALTER TABLE redemptions
  ADD COLUMN recipient_name_snapshot  VARCHAR(191) NULL AFTER tracking_no,
  ADD COLUMN recipient_phone_snapshot VARCHAR(64)  NULL AFTER recipient_name_snapshot,
  ADD COLUMN address_snapshot         TEXT         NULL AFTER recipient_phone_snapshot;

-- 回填历史单：从 addresses 取当前值冻结（只能做到"尽可能接近"，之后不再变动）
-- 直辖市 province 与 city 同值（北京市/北京市），用 CASE 去掉重复。
UPDATE redemptions r
JOIN addresses a ON a.id = r.address_id
SET r.recipient_name_snapshot  = a.recipient_name,
    r.recipient_phone_snapshot = a.phone,
    r.address_snapshot = CONCAT(
      a.province,
      CASE WHEN a.city IS NULL OR a.city = a.province THEN '' ELSE a.city END,
      IFNULL(a.district, ''),
      IFNULL(a.detail_address, '')
    )
WHERE r.address_id IS NOT NULL
  AND r.address_snapshot IS NULL;
