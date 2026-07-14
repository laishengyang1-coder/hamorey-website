-- ============================================================
-- 和膜 HAMOREY V1 — 示例种子数据
-- 用于本地开发和 UI 验收
-- 执行：wrangler d1 execute hamorey-db --local --file=./seed.sql
-- ============================================================

-- ============================================================
-- 组织：总部 + 1个省代 + 3个门店
-- ============================================================
INSERT INTO organizations (id, code, type, parent_id, name, province, city, contact_name, phone, status) VALUES
  ('org-hq-001', 'HAMOREY-HQ', 'HQ', NULL, '和膜 HAMOREY 总部', NULL, NULL, '总部运营', '400-888-0000', 'active'),
  ('org-province-gd', 'HAMOREY-GD', 'PROVINCE', 'org-hq-001', '和膜广东省代', '广东', '广州', '张经理', '13800001111', 'active'),
  ('org-store-gz001', 'HAMOREY-GZ001', 'STORE', 'org-province-gd', '和膜·广州天河品牌灯塔店', '广东', '广州', '李店长', '13800002222', 'active'),
  ('org-store-gz002', 'HAMOREY-GZ002', 'STORE', 'org-province-gd', '和膜·广州番禺标准服务中心', '广东', '广州', '王店长', '13800003333', 'active'),
  ('org-store-sz001', 'HAMOREY-SZ001', 'STORE', 'org-province-gd', '和膜·深圳南山区域服务点', '广东', '深圳', '陈店长', '13800004444', 'active');

-- ============================================================
-- 公开门店资料（3条示例数据）
-- ============================================================
INSERT INTO store_public_profiles (id, organization_id, public_name, auth_level, province, city, address, phone, business_hours, service_products, is_public, sort_order) VALUES
  ('spp-gz001', 'org-store-gz001', '和膜·广州天河品牌灯塔店', 'HEBC', '广东', '广州', '广州市天河区天河北路 233 号', '020-88888001', '09:00-18:00', '窗膜;隐形车衣;TPU改色;天窗冰甲', 1, 0),
  ('spp-gz002', 'org-store-gz002', '和膜·广州番禺标准服务中心', 'HSS', '广东', '广州', '广州市番禺区市桥街光明北路 88 号', '020-88888002', '09:00-18:00', '窗膜;隐形车衣', 1, 1),
  ('spp-sz001', 'org-store-sz001', '和膜·深圳南山区域服务点', 'Service_Point', '广东', '深圳', '深圳市南山区科技园南路 16 号', '0755-88888003', '10:00-19:00', '窗膜;天窗冰甲', 1, 2);

-- ============================================================
-- 产品系列（5大分类）
-- ============================================================
INSERT INTO products (id, category, name_cn, name_en, default_warranty_years, default_usage_limit, website_visible, warranty_enabled, status, sort_order) VALUES
  ('prod-wf', 'window_film', '窗膜', 'Window Film', 5, 24, 1, 1, 'active', 0),
  ('prod-ppf', 'ppf', '隐形车衣', 'Paint Protection Film', 10, 1, 1, 1, 'active', 1),
  ('prod-cppf', 'color_ppf', 'TPU改色车衣', 'Color PPF', 5, 1, 1, 1, 'active', 2),
  ('prod-sf', 'sunroof_film', '天窗冰甲', 'Sunroof Film', 5, 1, 1, 1, 'active', 3),
  ('prod-af', 'architectural_film', '建筑家居膜', 'Architectural Film', 5, 1, 1, 0, 'active', 4);

-- ============================================================
-- 产品型号（窗膜5系列 + 车衣4系列 + 天窗T系列）
-- ============================================================
INSERT INTO product_models (id, product_id, model_code, display_name, warranty_years, usage_limit, status, sort_order) VALUES
  ('pm-wf-auris', 'prod-wf', 'AURIS-DS', '和光 AURIS Dual-Silver', 5, 24, 'active', 0),
  ('pm-wf-fortex', 'prod-wf', 'FORTEX-AR', '和盾 FORTEX Armor', 5, 24, 'active', 1),
  ('pm-wf-lumis', 'prod-wf', 'LUMIS-UV', '和护 LUMIS UV400+', 5, 24, 'active', 2),
  ('pm-wf-nex5', 'prod-wf', 'NEX5-CL', '和真 NEX5 Classic', 5, 24, 'active', 3),
  ('pm-wf-purex', 'prod-wf', 'PUREX-OG', '和原 PUREX Origin', 5, 24, 'active', 4),
  ('pm-ppf-hy8', 'prod-ppf', 'HY8', '和御 HY8', 10, 1, 'active', 0),
  ('pm-ppf-hw8', 'prod-ppf', 'HW8', '和旺 HW8', 10, 1, 'active', 1),
  ('pm-ppf-hw9', 'prod-ppf', 'HW9', '和旺 HW9', 10, 1, 'active', 2),
  ('pm-ppf-hx8', 'prod-ppf', 'HX8', '和兴 HX8', 10, 1, 'active', 3),
  ('pm-ppf-hx9', 'prod-ppf', 'HX9', '和兴 HX9', 10, 1, 'active', 4),
  ('pm-ppf-hym', 'prod-ppf', 'HYM-MAT', '和雅 HYM 哑光', 7, 1, 'active', 5),
  ('pm-sf-t1', 'prod-sf', 'T1', '天窗冰甲 T1', 5, 1, 'active', 0),
  ('pm-sf-t2', 'prod-sf', 'T2', '天窗冰甲 T2', 5, 1, 'active', 1);

-- ============================================================
-- 报价部位（车衣/改色13部位 + 窗膜2部位 + 天窗1部位）
-- ============================================================
INSERT INTO claim_parts (id, name, category, sort_order, status) VALUES
  ('cp-front-bumper', '前保险杠', 'ppf', 0, 'active'),
  ('cp-rear-bumper', '后保险杠', 'ppf', 1, 'active'),
  ('cp-front-hood', '前机盖', 'ppf', 2, 'active'),
  ('cp-lf-fender', '左前翼子板', 'ppf', 3, 'active'),
  ('cp-rf-fender', '右前翼子板', 'ppf', 4, 'active'),
  ('cp-lf-door', '左前门', 'ppf', 5, 'active'),
  ('cp-rf-door', '右前门', 'ppf', 6, 'active'),
  ('cp-lr-door', '左后门', 'ppf', 7, 'active'),
  ('cp-rr-door', '右后门', 'ppf', 8, 'active'),
  ('cp-lr-fender', '左后翼子板', 'ppf', 9, 'active'),
  ('cp-rr-fender', '右后翼子板', 'ppf', 10, 'active'),
  ('cp-roof', '车顶', 'ppf', 11, 'active'),
  ('cp-trunk', '后备箱盖', 'ppf', 12, 'active'),
  ('cp-wf-front', '前挡', 'window_film', 0, 'active'),
  ('cp-wf-side', '侧挡', 'window_film', 1, 'active'),
  ('cp-sf-whole', '天窗冰甲整体', 'sunroof_film', 0, 'active');

-- ============================================================
-- 系统设置
-- ============================================================
INSERT INTO system_settings (id, key, value, value_type, description) VALUES
  ('ss-001', 'site_name', '和膜 HAMOREY', 'string', '站点名称'),
  ('ss-002', 'site_url', 'https://hemoppf.com', 'string', '站点正式域名'),
  ('ss-003', 'contact_phone', '400-888-0000', 'string', '官方客服电话'),
  ('ss-004', 'contact_email', 'service@hemoppf.com', 'string', '官方客服邮箱'),
  ('ss-005', 'window_film_usage_limit', '24', 'integer', '窗膜质保码默认使用次数上限'),
  ('ss-006', 'warranty_query_enabled', 'true', 'boolean', '是否开启公开质保查询');
