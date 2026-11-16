-- ============================================================
-- phase17 — 质保「一次提交多产品」批次字段
-- ============================================================
-- 背景：一辆车同时贴车衣 + 前档 + 侧挡时，原来要分开登记多次，
--       车主信息得重复填。改为一次提交多条记录（每条 = 一个产品 = 一个码 = 一张证书），
--       用 batch_id 把它们归为一组，列表可折叠、审核可整批看待。
-- 说明：两条都可空/有默认值，对旧代码零影响；旧记录 batch_id 为 NULL。
-- 已于 2026-11-16 应用于生产库（TDSQL-C cynosdbmysql-ins-534bqge0）。
-- 回滚：
--   ALTER TABLE warranty_records DROP COLUMN batch_id, DROP COLUMN batch_seq;
--   DROP INDEX idx_wr_batch ON warranty_records;
-- ============================================================

ALTER TABLE warranty_records
  ADD COLUMN batch_id  varchar(191) NULL COMMENT '一次提交的批次号（同车多产品）',
  ADD COLUMN batch_seq int          NOT NULL DEFAULT 1 COMMENT '批次内序号，从 1 开始';

CREATE INDEX idx_wr_batch ON warranty_records (batch_id);
