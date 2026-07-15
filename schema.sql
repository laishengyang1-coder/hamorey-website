-- ============================================================
-- 和膜 HAMOREY V1 数据层基座 — D1 建表脚本
-- 数据库：Cloudflare D1 (SQLite)
-- 表数量：28张（26必做 + 2建议）
-- 日期：2026-07-13
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. organizations — 组织与门店（总部/省代/门店三级）
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id          TEXT PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    type        TEXT NOT NULL CHECK (type IN ('HQ', 'PROVINCE', 'STORE')),
    parent_id   TEXT REFERENCES organizations(id),
    name        TEXT NOT NULL,
    province    TEXT,
    city        TEXT,
    address     TEXT,
    contact_name TEXT,
    phone       TEXT,
    social_credit_code TEXT,
    legal_person TEXT,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
    created_by  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_org_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_org_parent ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_org_province ON organizations(province);

-- ============================================================
-- 2. users — 登录账号
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('HQ_ADMIN', 'PROVINCE', 'STORE')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'disabled')),
    last_login_at   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_user_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_status ON users(status);

-- ============================================================
-- 3. sessions — 登录会话
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id),
    token           TEXT NOT NULL UNIQUE,
    ip_address      TEXT,
    user_agent      TEXT,
    expires_at      TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_session_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_session_expires ON sessions(expires_at);

-- ============================================================
-- 4. products — 产品系列
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id                      TEXT PRIMARY KEY,
    category                TEXT NOT NULL CHECK (category IN ('window_film', 'ppf', 'color_ppf', 'sunroof_film', 'architectural_film')),
    name_cn                 TEXT NOT NULL,
    name_en                 TEXT,
    default_warranty_years  INTEGER NOT NULL DEFAULT 5,
    default_usage_limit     INTEGER NOT NULL DEFAULT 1,
    website_visible         INTEGER NOT NULL DEFAULT 1 CHECK (website_visible IN (0, 1)),
    warranty_enabled        INTEGER NOT NULL DEFAULT 1 CHECK (warranty_enabled IN (0, 1)),
    status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    sort_order              INTEGER NOT NULL DEFAULT 0,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_product_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_product_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_visible ON products(website_visible);

-- ============================================================
-- 5. product_models — 产品型号（质保码匹配）
-- ============================================================
CREATE TABLE IF NOT EXISTS product_models (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL REFERENCES products(id),
    model_code      TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    warranty_years  INTEGER,
    warranty_price_cents INTEGER,
    usage_limit     INTEGER,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_model_product ON product_models(product_id);
CREATE INDEX IF NOT EXISTS idx_model_code ON product_models(model_code);
CREATE INDEX IF NOT EXISTS idx_model_status ON product_models(status);

-- ============================================================
-- 6. import_batches — 导入批次
-- ============================================================
CREATE TABLE IF NOT EXISTS import_batches (
    id              TEXT PRIMARY KEY,
    file_name       TEXT NOT NULL,
    batch_name      TEXT,
    total_rows      INTEGER NOT NULL DEFAULT 0,
    success_rows    INTEGER NOT NULL DEFAULT 0,
    error_rows      INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'checking' CHECK (status IN ('checking', 'failed', 'imported')),
    error_file_key  TEXT,
    created_by      TEXT REFERENCES users(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_batch_status ON import_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_created_by ON import_batches(created_by);

-- ============================================================
-- 7. warranty_codes — 质保码
-- ============================================================
CREATE TABLE IF NOT EXISTS warranty_codes (
    id                      TEXT PRIMARY KEY,
    code                    TEXT NOT NULL UNIQUE,
    product_model_id        TEXT NOT NULL REFERENCES product_models(id),
    imported_product_name   TEXT,
    batch_no                TEXT NOT NULL,
    import_batch_id         TEXT REFERENCES import_batches(id),
    owner_org_id            TEXT REFERENCES organizations(id),
    usage_limit             INTEGER NOT NULL DEFAULT 1,
    used_count              INTEGER NOT NULL DEFAULT 0,
    status                  TEXT NOT NULL DEFAULT 'unallocated' CHECK (status IN ('unallocated', 'in_stock', 'partial_used', 'exhausted', 'frozen', 'voided')),
    created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_code_code ON warranty_codes(code);
CREATE INDEX IF NOT EXISTS idx_code_model ON warranty_codes(product_model_id);
CREATE INDEX IF NOT EXISTS idx_code_owner ON warranty_codes(owner_org_id);
CREATE INDEX IF NOT EXISTS idx_code_status ON warranty_codes(status);
CREATE INDEX IF NOT EXISTS idx_code_batch ON warranty_codes(batch_no);
CREATE INDEX IF NOT EXISTS idx_code_import_batch ON warranty_codes(import_batch_id);

-- ============================================================
-- 8. code_allocations — 质保码流转（划拨/撤回）
-- ============================================================
CREATE TABLE IF NOT EXISTS code_allocations (
    id                  TEXT PRIMARY KEY,
    warranty_code_id    TEXT NOT NULL REFERENCES warranty_codes(id),
    from_org_id         TEXT REFERENCES organizations(id),
    to_org_id           TEXT REFERENCES organizations(id),
    action              TEXT NOT NULL CHECK (action IN ('allocate', 'revoke', 'adjust')),
    operator_user_id    TEXT REFERENCES users(id),
    reason              TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alloc_code ON code_allocations(warranty_code_id);
CREATE INDEX IF NOT EXISTS idx_alloc_from ON code_allocations(from_org_id);
CREATE INDEX IF NOT EXISTS idx_alloc_to ON code_allocations(to_org_id);
CREATE INDEX IF NOT EXISTS idx_alloc_action ON code_allocations(action);

-- ============================================================
-- 9. customers — 车主
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customer_name ON customers(name);

-- ============================================================
-- 10. vehicles — 车辆
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id          TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    plate_no    TEXT NOT NULL,
    vin         TEXT,
    brand       TEXT NOT NULL,
    model       TEXT NOT NULL,
    model_year  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vehicle_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_plate ON vehicles(plate_no);
CREATE INDEX IF NOT EXISTS idx_vehicle_vin ON vehicles(vin);

-- ============================================================
-- 11. warranty_records — 质保记录
-- ============================================================
CREATE TABLE IF NOT EXISTS warranty_records (
    id                          TEXT PRIMARY KEY,
    certificate_no              TEXT UNIQUE,
    warranty_code_id            TEXT NOT NULL REFERENCES warranty_codes(id),
    vehicle_id                  TEXT NOT NULL REFERENCES vehicles(id),
    customer_id                 TEXT NOT NULL REFERENCES customers(id),
    customer_name_snapshot      TEXT NOT NULL,
    customer_phone_snapshot     TEXT NOT NULL,
    plate_no_snapshot           TEXT NOT NULL,
    vin_snapshot                TEXT,
    vehicle_brand_snapshot      TEXT NOT NULL,
    vehicle_model_snapshot      TEXT NOT NULL,
    store_id                    TEXT NOT NULL REFERENCES organizations(id),
    store_name_snapshot         TEXT NOT NULL,
    province_org_id             TEXT REFERENCES organizations(id),
    product_model_id            TEXT NOT NULL REFERENCES product_models(id),
    product_name_snapshot       TEXT NOT NULL,
    product_model_snapshot      TEXT NOT NULL,
    warranty_years_snapshot     INTEGER NOT NULL,
    installation_date           TEXT NOT NULL,
    warranty_expiry_date        TEXT,
    status                      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'rejected', 'active', 'expired', 'voided')),
    current_reject_reason       TEXT,
    submitted_at                TEXT,
    approved_at                 TEXT,
    approved_by                 TEXT REFERENCES users(id),
    store_points_awarded        INTEGER DEFAULT 0,
    province_points_awarded     INTEGER DEFAULT 0,
    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wr_code ON warranty_records(warranty_code_id);
CREATE INDEX IF NOT EXISTS idx_wr_vehicle ON warranty_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_wr_customer ON warranty_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_wr_store ON warranty_records(store_id);
CREATE INDEX IF NOT EXISTS idx_wr_status ON warranty_records(status);
CREATE INDEX IF NOT EXISTS idx_wr_plate ON warranty_records(plate_no_snapshot);
CREATE INDEX IF NOT EXISTS idx_wr_cert_no ON warranty_records(certificate_no);

-- ============================================================
-- 12. warranty_photos — 施工照片
-- ============================================================
CREATE TABLE IF NOT EXISTS warranty_photos (
    id                  TEXT PRIMARY KEY,
    warranty_record_id  TEXT NOT NULL REFERENCES warranty_records(id),
    file_key            TEXT NOT NULL,
    thumbnail_key       TEXT,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    uploaded_by         TEXT REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_photo_record ON warranty_photos(warranty_record_id);

-- ============================================================
-- 13. warranty_audit_logs — 审核历史
-- ============================================================
CREATE TABLE IF NOT EXISTS warranty_audit_logs (
    id                  TEXT PRIMARY KEY,
    warranty_record_id  TEXT NOT NULL REFERENCES warranty_records(id),
    action              TEXT NOT NULL CHECK (action IN ('submit', 'reject', 'resubmit', 'approve', 'void')),
    from_status         TEXT,
    to_status           TEXT,
    note                TEXT,
    operator_user_id    TEXT REFERENCES users(id),
    snapshot_json       TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_record ON warranty_audit_logs(warranty_record_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON warranty_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_operator ON warranty_audit_logs(operator_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_single_approval
    ON warranty_audit_logs(warranty_record_id)
    WHERE action = 'approve';

CREATE TRIGGER IF NOT EXISTS trg_warranty_audit_matches_status
BEFORE INSERT ON warranty_audit_logs
WHEN NEW.action IN ('approve', 'reject')
BEGIN
    SELECT CASE
        WHEN NEW.action = 'approve' AND NOT EXISTS (
            SELECT 1 FROM warranty_records WHERE id = NEW.warranty_record_id AND status = 'active'
        ) THEN RAISE(ABORT, 'INVALID_WARRANTY_APPROVAL_STATE')
    END;
    SELECT CASE
        WHEN NEW.action = 'reject' AND NOT EXISTS (
            SELECT 1 FROM warranty_records WHERE id = NEW.warranty_record_id AND status = 'rejected'
        ) THEN RAISE(ABORT, 'INVALID_WARRANTY_REJECTION_STATE')
    END;
END;

-- ============================================================
-- 14. certificate_files — 质保证书PDF
-- ============================================================
CREATE TABLE IF NOT EXISTS certificate_files (
    id                  TEXT PRIMARY KEY,
    warranty_record_id  TEXT NOT NULL REFERENCES warranty_records(id),
    file_key            TEXT NOT NULL,
    file_url            TEXT,
    version             INTEGER NOT NULL DEFAULT 1,
    generated_by        TEXT REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cert_record ON certificate_files(warranty_record_id);

-- ============================================================
-- 15. claim_parts — 报价部位
-- ============================================================
CREATE TABLE IF NOT EXISTS claim_parts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('window_film', 'ppf', 'color_ppf', 'sunroof_film')),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);
CREATE INDEX IF NOT EXISTS idx_part_category ON claim_parts(category);
CREATE INDEX IF NOT EXISTS idx_part_status ON claim_parts(status);

-- ============================================================
-- 16. claim_prices — 部位报价
-- ============================================================
CREATE TABLE IF NOT EXISTS claim_prices (
    id                  TEXT PRIMARY KEY,
    product_model_id    TEXT NOT NULL REFERENCES product_models(id),
    claim_part_id       TEXT NOT NULL REFERENCES claim_parts(id),
    price_cents         INTEGER NOT NULL,
    effective_from      TEXT NOT NULL,
    effective_to        TEXT,
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    updated_by          TEXT REFERENCES users(id),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_price_model ON claim_prices(product_model_id);
CREATE INDEX IF NOT EXISTS idx_price_part ON claim_prices(claim_part_id);
CREATE INDEX IF NOT EXISTS idx_price_status ON claim_prices(status);
CREATE INDEX IF NOT EXISTS idx_price_effective ON claim_prices(effective_from, effective_to);

-- ============================================================
-- 17. points_rules — 门店积分规则
-- ============================================================
CREATE TABLE IF NOT EXISTS points_rules (
    id                  TEXT PRIMARY KEY,
    product_model_id    TEXT NOT NULL REFERENCES product_models(id),
    points              INTEGER NOT NULL DEFAULT 0,
    effective_from      TEXT NOT NULL,
    effective_to        TEXT,
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    updated_by          TEXT REFERENCES users(id),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prule_model ON points_rules(product_model_id);
CREATE INDEX IF NOT EXISTS idx_prule_status ON points_rules(status);

-- ============================================================
-- 18. rebate_rules — 省代返利规则
-- ============================================================
CREATE TABLE IF NOT EXISTS rebate_rules (
    id                  TEXT PRIMARY KEY,
    product_model_id    TEXT REFERENCES product_models(id),
    rebate_ratio        REAL NOT NULL DEFAULT 0.0 CHECK (rebate_ratio >= 0.0 AND rebate_ratio <= 1.0),
    is_global           INTEGER NOT NULL DEFAULT 0 CHECK (is_global IN (0, 1)),
    effective_from      TEXT NOT NULL,
    effective_to        TEXT,
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    updated_by          TEXT REFERENCES users(id),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rrule_model ON rebate_rules(product_model_id);
CREATE INDEX IF NOT EXISTS idx_rrule_global ON rebate_rules(is_global);
CREATE INDEX IF NOT EXISTS idx_rrule_status ON rebate_rules(status);

-- ============================================================
-- 19. points_ledger — 积分流水
-- ============================================================
CREATE TABLE IF NOT EXISTS points_ledger (
    id                  TEXT PRIMARY KEY,
    organization_id     TEXT NOT NULL REFERENCES organizations(id),
    change_type         TEXT NOT NULL CHECK (change_type IN ('award', 'deduct', 'freeze', 'release', 'adjust', 'revoke')),
    points_change       INTEGER NOT NULL DEFAULT 0,
    frozen_change       INTEGER NOT NULL DEFAULT 0,
    related_type        TEXT CHECK (related_type IN ('warranty', 'redemption', 'manual')),
    related_id          TEXT,
    reason              TEXT,
    operator_user_id    TEXT REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ledger_org ON points_ledger(organization_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON points_ledger(change_type);
CREATE INDEX IF NOT EXISTS idx_ledger_related ON points_ledger(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON points_ledger(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_warranty_award_once
    ON points_ledger(organization_id, related_id)
    WHERE related_type = 'warranty' AND change_type = 'award';
CREATE UNIQUE INDEX IF NOT EXISTS idx_redemption_freeze_once
    ON points_ledger(related_id)
    WHERE related_type = 'redemption' AND change_type = 'freeze';
CREATE UNIQUE INDEX IF NOT EXISTS idx_redemption_one_resolution
    ON points_ledger(related_id)
    WHERE related_type = 'redemption' AND change_type IN ('deduct', 'release');

CREATE TRIGGER IF NOT EXISTS trg_points_freeze_balance
BEFORE INSERT ON points_ledger
WHEN NEW.change_type = 'freeze'
BEGIN
    SELECT CASE
        WHEN NEW.points_change <= 0 OR NEW.points_change != NEW.frozen_change
        THEN RAISE(ABORT, 'INVALID_POINTS_FREEZE')
    END;
    SELECT CASE
        WHEN COALESCE((
            SELECT SUM(CASE
                WHEN change_type IN ('award', 'adjust', 'release') THEN points_change
                WHEN change_type IN ('deduct', 'revoke', 'freeze') THEN -points_change
                ELSE 0
            END)
            FROM points_ledger
            WHERE organization_id = NEW.organization_id
        ), 0) < NEW.points_change
        THEN RAISE(ABORT, 'INSUFFICIENT_POINTS')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_points_resolve_frozen
BEFORE INSERT ON points_ledger
WHEN NEW.change_type IN ('deduct', 'release') AND NEW.related_type = 'redemption'
BEGIN
    SELECT CASE
        WHEN NEW.frozen_change <= 0 OR COALESCE((
            SELECT SUM(CASE
                WHEN change_type = 'freeze' THEN frozen_change
                WHEN change_type IN ('release', 'deduct') THEN -frozen_change
                ELSE 0
            END)
            FROM points_ledger
            WHERE organization_id = NEW.organization_id
              AND related_type = 'redemption'
              AND related_id = NEW.related_id
        ), 0) < NEW.frozen_change
        THEN RAISE(ABORT, 'INSUFFICIENT_FROZEN_POINTS')
    END;
END;

-- ============================================================
-- 20. rewards — 商城商品
-- ============================================================
CREATE TABLE IF NOT EXISTS rewards (
    id                  TEXT PRIMARY KEY,
    category            TEXT,
    name                TEXT NOT NULL,
    cover_file_key      TEXT,
    points_required     INTEGER NOT NULL DEFAULT 0,
    stock_quantity      INTEGER,
    stock_status        TEXT NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'out_of_stock', 'coming_soon')),
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    description         TEXT,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reward_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_reward_category ON rewards(category);

-- ============================================================
-- 21. addresses — 收货地址
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
    id                  TEXT PRIMARY KEY,
    organization_id     TEXT NOT NULL REFERENCES organizations(id),
    recipient_name      TEXT NOT NULL,
    phone               TEXT NOT NULL,
    province            TEXT NOT NULL,
    city                TEXT NOT NULL,
    district            TEXT,
    detail_address      TEXT NOT NULL,
    is_default          INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addr_org ON addresses(organization_id);

-- ============================================================
-- 22. redemptions — 兑换单
-- ============================================================
CREATE TABLE IF NOT EXISTS redemptions (
    id                  TEXT PRIMARY KEY,
    organization_id     TEXT NOT NULL REFERENCES organizations(id),
    address_id          TEXT REFERENCES addresses(id),
    total_points        INTEGER NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shipped', 'completed')),
    review_note         TEXT,
    tracking_no         TEXT,
    reviewed_by         TEXT REFERENCES users(id),
    reviewed_at         TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_redemption_org ON redemptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_redemption_status ON redemptions(status);

-- ============================================================
-- 23. redemption_items — 兑换明细
-- ============================================================
CREATE TABLE IF NOT EXISTS redemption_items (
    id                  TEXT PRIMARY KEY,
    redemption_id       TEXT NOT NULL REFERENCES redemptions(id),
    reward_id           TEXT NOT NULL REFERENCES rewards(id),
    quantity            INTEGER NOT NULL DEFAULT 1,
    points_per_item     INTEGER NOT NULL DEFAULT 0,
    reward_name_snapshot TEXT NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ri_redemption ON redemption_items(redemption_id);
CREATE INDEX IF NOT EXISTS idx_ri_reward ON redemption_items(reward_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ri_unique_reward
    ON redemption_items(redemption_id, reward_id);

CREATE TRIGGER IF NOT EXISTS trg_redemption_item_reserve_stock
BEFORE INSERT ON redemption_items
BEGIN
    SELECT CASE
        WHEN NEW.quantity < 1 THEN RAISE(ABORT, 'INVALID_REWARD_QUANTITY')
    END;
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM rewards
            WHERE id = NEW.reward_id AND status = 'active' AND stock_status = 'available'
        ) THEN RAISE(ABORT, 'REWARD_NOT_AVAILABLE')
    END;
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM rewards
            WHERE id = NEW.reward_id AND stock_quantity IS NOT NULL AND stock_quantity < NEW.quantity
        ) THEN RAISE(ABORT, 'INSUFFICIENT_REWARD_STOCK')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_redemption_item_apply_stock
AFTER INSERT ON redemption_items
WHEN (SELECT stock_quantity FROM rewards WHERE id = NEW.reward_id) IS NOT NULL
BEGIN
    UPDATE rewards
    SET stock_quantity = stock_quantity - NEW.quantity,
        stock_status = CASE WHEN stock_quantity - NEW.quantity <= 0 THEN 'out_of_stock' ELSE stock_status END,
        updated_at = datetime('now')
    WHERE id = NEW.reward_id;
END;

-- ============================================================
-- 24. store_public_profiles — 公开门店资料
-- ============================================================
CREATE TABLE IF NOT EXISTS store_public_profiles (
    id                  TEXT PRIMARY KEY,
    organization_id     TEXT NOT NULL REFERENCES organizations(id),
    public_name         TEXT NOT NULL,
    auth_level          TEXT NOT NULL CHECK (auth_level IN ('HEBC', 'HSS', 'Service_Point')),
    province            TEXT,
    city                TEXT,
    address             TEXT,
    phone               TEXT,
    business_hours      TEXT,
    service_products    TEXT,
    image_file_key      TEXT,
    is_public           INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0, 1)),
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_spp_org ON store_public_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_spp_public ON store_public_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_spp_province ON store_public_profiles(province);
CREATE INDEX IF NOT EXISTS idx_spp_city ON store_public_profiles(city);
CREATE INDEX IF NOT EXISTS idx_spp_level ON store_public_profiles(auth_level);

-- ============================================================
-- 25. partner_leads — 合作线索
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_leads (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    phone               TEXT NOT NULL,
    email               TEXT,
    province            TEXT,
    city                TEXT,
    company_name        TEXT,
    business_type       TEXT,
    store_count         INTEGER,
    intended_type       TEXT,
    message             TEXT,
    privacy_agreed      INTEGER NOT NULL DEFAULT 0 CHECK (privacy_agreed IN (0, 1)),
    follow_status       TEXT NOT NULL DEFAULT 'new' CHECK (follow_status IN ('new', 'contacted', 'qualified', 'closed')),
    assigned_to         TEXT REFERENCES users(id),
    source              TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lead_status ON partner_leads(follow_status);
CREATE INDEX IF NOT EXISTS idx_lead_phone ON partner_leads(phone);
CREATE INDEX IF NOT EXISTS idx_lead_created ON partner_leads(created_at);

-- ============================================================
-- 26. content_entries — 官网内容
-- ============================================================
CREATE TABLE IF NOT EXISTS content_entries (
    id              TEXT PRIMARY KEY,
    page            TEXT NOT NULL,
    section         TEXT NOT NULL,
    title           TEXT,
    body            TEXT,
    image_file_key  TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_page ON content_entries(page);
CREATE INDEX IF NOT EXISTS idx_content_section ON content_entries(section);
CREATE INDEX IF NOT EXISTS idx_content_status ON content_entries(status);

-- ============================================================
-- 27. operation_logs — 操作日志
-- ============================================================
CREATE TABLE IF NOT EXISTS operation_logs (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT REFERENCES users(id),
    action              TEXT NOT NULL,
    target_type         TEXT,
    target_id           TEXT,
    detail_json         TEXT,
    ip_address          TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_log_user ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_log_action ON operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_log_target ON operation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_log_created ON operation_logs(created_at);

-- ============================================================
-- 28. system_settings — 系统设置
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id          TEXT PRIMARY KEY,
    key         TEXT NOT NULL UNIQUE,
    value       TEXT,
    value_type  TEXT NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    updated_by  TEXT REFERENCES users(id),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_setting_key ON system_settings(key);
