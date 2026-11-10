-- ============================================================
-- phase16 — 小程序首页轮播图（banners）
-- ============================================================
-- 背景：轮播图原来硬编码在 miniprogram/pages/owner/query/index.js 的
--       HOME_CONFIG.banners 里，换一次图就要改代码 + 重新发版 + 提审。
--       改为存表 + 后台管理 + 小程序读接口。
-- 图片存 COS/R2，本表只存 key（banners/<uuid>.jpg），不存绝对 URL。
-- 已于 2026-11-10 应用于生产库（TDSQL-C cynosdbmysql-ins-534bqge0）。
-- 回滚：
--   DROP TABLE IF EXISTS banners;
-- ============================================================

CREATE TABLE IF NOT EXISTS banners (
    id              varchar(191)  NOT NULL,
    title           varchar(191)  NULL COMMENT '后台识别用的标题（不展示给用户）',
    image_file_key  varchar(500)  NOT NULL COMMENT 'COS/R2 对象 key，如 banners/uuid.jpg',
    link_page       varchar(500)  NULL COMMENT '可选：点击跳转的小程序页面路径',
    sort_order      int           NOT NULL DEFAULT 0,
    status          varchar(20)   NOT NULL DEFAULT 'active' COMMENT 'active=启用 / inactive=停用',
    created_at      datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_banners_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
