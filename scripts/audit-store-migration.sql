-- ============================================================
-- 门店审核功能 — 生产数据库迁移脚本（MySQL）
-- organizations 表新增审核字段；存量门店默认 approved（已通过，不受影响）
-- 省代新增门店 audit_status='pending'，总部审核通过后才可登录/官网公开
-- 执行方式（服务器）：
--   mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < audit-store-migration.sql
-- 幂等性：需先确认列不存在再执行（首次执行即可）
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN audit_status VARCHAR(16) NOT NULL DEFAULT 'approved' AFTER status,
  ADD COLUMN audit_reason VARCHAR(500) NULL,
  ADD COLUMN audited_at DATETIME NULL,
  ADD COLUMN audited_by VARCHAR(64) NULL;

CREATE INDEX idx_org_audit_status ON organizations (type, audit_status);
