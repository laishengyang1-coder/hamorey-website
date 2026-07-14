-- ============================================================
-- 和膜 HAMOREY V1 第二阶段 — 数据库变更脚本
-- 执行方式：wrangler d1 execute hamorey-db --file=./migrations/phase2.sql
-- ============================================================

-- 1. users 表：增加复合索引加速登录查询
CREATE INDEX IF NOT EXISTS idx_user_username_status ON users(username, status);

-- 2. sessions 表：补充清理过期 session 的索引
CREATE INDEX IF NOT EXISTS idx_session_token_expires ON sessions(token, expires_at);

-- 3. warranty_codes 表：补充 owner_org_id + status 复合索引（划拨查询高频）
CREATE INDEX IF NOT EXISTS idx_code_owner_status ON warranty_codes(owner_org_id, status);

-- 4. warranty_records 表：补充审核列表查询复合索引
CREATE INDEX IF NOT EXISTS idx_wr_status_submitted ON warranty_records(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_wr_store_status ON warranty_records(store_id, status);

-- 5. claim_prices 表：补充唯一约束（同一产品型号+同一部位+同一时间只有一条有效报价）
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_unique_active
    ON claim_prices(product_model_id, claim_part_id, effective_from)
    WHERE status = 'active';

-- 6. organizations 表：补充 type + parent_id 复合索引（省代查下属）
CREATE INDEX IF NOT EXISTS idx_org_type_parent ON organizations(type, parent_id);
