-- 修复: points_ledger.related_id 的 UNIQUE 索引导致同一质保的
-- 门店积分和代理返利无法共存（一个 related_id 只能有一条记录）
ALTER TABLE points_ledger DROP INDEX IF EXISTS idx_points_ledger_related_id;
CREATE INDEX idx_points_ledger_related_id ON points_ledger(related_id);
