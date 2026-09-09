-- ============================================================
-- 换膜无忧活动 — 数据模型（MySQL，生产环境直接执行）
-- film_exchange_requests：换膜申请主表
-- film_exchange_photos：申请的照片/视频
-- warranty_records.film_exchanged：原质保「已换膜」标记
-- ============================================================

CREATE TABLE IF NOT EXISTS film_exchange_requests (
    id                          varchar(191)  NOT NULL,
    store_id                    varchar(191)  NOT NULL,
    store_name_snapshot         text          NOT NULL,
    province_org_id             varchar(191)  DEFAULT NULL,
    warranty_record_id          varchar(191)  NOT NULL,
    customer_phone_snapshot     text          NOT NULL,
    customer_name_snapshot      text          NOT NULL,
    plate_no_snapshot           text          DEFAULT NULL,
    product_model_id            varchar(191)  DEFAULT NULL,
    product_model_snapshot      text          DEFAULT NULL,
    product_name_snapshot       text          DEFAULT NULL,
    film_type                   varchar(20)   NOT NULL DEFAULT 'ppf',
    damage_part                 text          DEFAULT NULL,
    description                 text          DEFAULT NULL,
    status                      varchar(191)  NOT NULL DEFAULT 'pending',
    compensate_type             varchar(20)   DEFAULT NULL,
    charge_amount               decimal(10,2) DEFAULT NULL,
    review_note                 text          DEFAULT NULL,
    reviewed_by                 varchar(255)  DEFAULT NULL,
    reviewed_at                 datetime      DEFAULT NULL,
    reject_reason               text          DEFAULT NULL,
    created_at                  datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_fx_store (store_id),
    KEY idx_fx_status (status),
    KEY idx_fx_warranty_record (warranty_record_id),
    KEY idx_fx_phone (customer_phone_snapshot(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS film_exchange_photos (
    id          varchar(191) NOT NULL,
    request_id  varchar(191) NOT NULL,
    file_key    text         NOT NULL,
    media_type  varchar(20)  NOT NULL DEFAULT 'image',
    sort_order  int          NOT NULL DEFAULT 0,
    uploaded_by varchar(255) DEFAULT NULL,
    created_at  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_fxp_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 原质保记录「已换膜」标记（0=未换膜，1=已换膜）
-- 注意：MySQL 8.0 不支持 ADD COLUMN IF NOT EXISTS，执行前请先确认该列不存在
ALTER TABLE warranty_records
    ADD COLUMN film_exchanged tinyint(1) NOT NULL DEFAULT 0;
