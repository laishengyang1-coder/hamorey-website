-- ============================================================
-- 和膜 HAMOREY — 积分商城（rewards）种子数据
-- ============================================================
--
-- ⚠️ 重要：本文件是 2026-09-14 生产库的**数据快照**，用于新环境初始化或数据核对。
--    它的内容是「当前线上状态」，不是「待执行的变更」。
--
--    历史上本文件带有 `DELETE FROM rewards WHERE ... LIKE '测试%'` 的清理语句，
--    重跑会覆盖线上已定稿的价格与上下架状态（曾导致销售测试道具价格被重置）。
--    该 DELETE 已移除，改为按主键幂等 UPSERT，只补缺失/更新同名主键记录。
--
--    调整线上价格请走后台「积分商城管理」或直接 UPDATE，不要用本文件覆盖。
--
-- 语法：MySQL（生产为腾讯云 MySQL 8.0）；旧版为 SQLite 语法，已同步更新。
-- 商品数：27
-- ============================================================

INSERT INTO rewards
  (id, category, name, cover_file_key, points_required, stock_quantity, stock_status, status, description, sort_order, created_at, updated_at)
VALUES
  ('9e8aba8d-35ec-496f-b71a-818b65dd7760', '膜类硬通货', '和光窗膜', 'reward-covers/5fca2caf-7aeb-47eb-8888-7e6d6d5060a9.png', 9999, 99, 'available', 'active', NULL, 0, NOW(), NOW()),
  ('cbfefe84-7cab-44e5-afeb-0e7137d91160', '膜类硬通货', '和尊HZ8隐形车衣', 'reward-covers/297d0761-511f-483c-aea7-ef2efde66c18.png', 3200, 99, 'available', 'active', NULL, 0, NOW(), NOW()),
  ('c96b648f-31de-4cb1-a6fd-285444832ac4', '膜类硬通货', '和护窗膜', 'reward-covers/5fca2caf-7aeb-47eb-8888-7e6d6d5060a9.png', 5600, 99, 'available', 'active', NULL, 0, NOW(), NOW()),
  ('d2537231-6c61-49c0-aab4-56d66754aa9f', '膜类硬通货', '和旺HW8隐形车衣', 'reward-covers/297d0761-511f-483c-aea7-ef2efde66c18.png', 3000, 99, 'available', 'active', NULL, 0, NOW(), NOW()),
  ('86739d6f-227a-4776-adf7-84a8ef28cb49', '膜类硬通货', '和盾窗膜', 'reward-covers/5fca2caf-7aeb-47eb-8888-7e6d6d5060a9.png', 6800, 99, 'available', 'active', NULL, 0, NOW(), NOW()),
  ('6a1c03b0-46e6-45cf-a3db-5d9da88ccea7', '膜类硬通货', '和真窗膜', 'reward-covers/5fca2caf-7aeb-47eb-8888-7e6d6d5060a9.png', 3000, 99, 'available', 'active', NULL, 0, NOW(), NOW()),
  ('5944b6d1-37f2-46a4-b9c5-897a93549b0a', '膜类硬通货', '苍穹青炫彩窗膜', 'reward-covers/5fca2caf-7aeb-47eb-8888-7e6d6d5060a9.png', 8800, 99, 'available', 'active', NULL, 0, NOW(), NOW()),
  ('de89485c-7b65-4702-968e-2bf0d139a6cf', '膜类硬通货', '和御HY8隐形车衣', 'reward-covers/297d0761-511f-483c-aea7-ef2efde66c18.png', 3500, 99, 'available', 'active', NULL, 10, NOW(), NOW()),
  ('bdf5c931-279c-437a-a0e6-a77818454376', '膜类硬通货', 'TPU全彩车衣', 'reward-covers/b498a7f4-bfc6-42a5-a1e6-a557f306c0fd.png', 3000, 99, 'available', 'inactive', NULL, 20, NOW(), NOW()),
  ('5d6d5c68-cf0f-478e-ac5f-fdb912461865', '销售测试工具', '高疏水测试道具', 'reward-covers/687c4bff-d58a-41ea-b7cd-984f6da035e8.png', 2888, 99, 'available', 'active', NULL, 30, NOW(), NOW()),
  ('aaef6420-a6db-44a0-ac3d-d3297f4e3a9c', '销售测试工具', '紫外线阻隔测试道具', 'reward-covers/dab73285-fea3-4b73-951f-96a30b9c083d.png', 2888, 99, 'available', 'active', NULL, 40, NOW(), NOW()),
  ('0e7990e1-0b26-4534-8b5b-27797812ffce', '销售测试工具', '拉伸测试道具', 'reward-covers/0a7a8450-9607-41fa-9ed1-69a0331b3357.png', 2888, 99, 'available', 'active', NULL, 50, NOW(), NOW()),
  ('26cc853b-e82f-4e4d-8519-647be2182403', '销售测试工具', '防爆测试道具', 'reward-covers/8f903082-839d-4ba5-bf6d-46c870cc33b3.png', 2888, 99, 'available', 'active', NULL, 60, NOW(), NOW()),
  ('d2a2daae-25de-441a-9b45-6389a3cec557', '销售测试工具', '隔热测试道具', 'reward-covers/98a1d9b7-2151-4f68-bae8-12c450e356d4.png', 2888, 99, 'available', 'active', NULL, 70, NOW(), NOW()),
  ('072c6a60-8817-4965-be05-cdad5e1d0eb5', '销售测试工具', '5G测试道具', 'reward-covers/c9379b23-c777-4a74-a8a3-03defacbec55.png', 2888, 99, 'available', 'active', NULL, 80, NOW(), NOW()),
  ('77f8dff8-f558-4819-8f95-b64dc782c56b', '销售测试工具', '穿刺测试仪', 'reward-covers/7ca7dc9b-cb3c-4c67-a926-7f8fa4a97dc1.png', 2888, 99, 'available', 'active', NULL, 90, NOW(), NOW()),
  ('e9297d6a-eb01-43d5-9b47-130f3258b4cc', '品牌物料', '和膜工服', 'reward-covers/15672ca1-b886-4956-b01e-c7e002408478.png', 200, 99, 'available', 'active', NULL, 100, NOW(), NOW()),
  ('135c7af3-83da-4feb-89a5-fa20a426000b', '品牌物料', '和膜选膜手册', 'reward-covers/05620ed8-d971-4433-a129-103ada895ec1.png', 300, 99, 'available', 'active', NULL, 110, NOW(), NOW()),
  ('4cbee05b-0010-4551-b3ea-b0c31b484db0', '品牌物料', '和膜精简样册', 'reward-covers/3a8375dd-7766-4c04-9411-5e1ba7969d6c.png', 150, 99, 'available', 'active', NULL, 120, NOW(), NOW()),
  ('999b6fcf-13a3-4e36-8180-426efd8a48d9', '品牌物料', '和膜色卡', 'reward-covers/b995f19c-f464-43af-a338-60dde8ab4203.png', 500, 99, 'available', 'inactive', NULL, 130, NOW(), NOW()),
  ('f25bf7b0-f926-48fc-b88e-7463e92d803c', '品牌物料', '和膜膜样信封套装（10个）', 'reward-covers/68be6953-a180-490f-8b2a-f9e7ec9ed135.png', 220, 99, 'available', 'active', NULL, 140, NOW(), NOW()),
  ('4e812fce-58d2-4a95-8ce8-4b2390e17c6f', '小礼品', '香片（50个装）', 'reward-covers/7f78a8a7-c1f4-48ef-8195-4b70f7c163ea.png', 150, 99, 'available', 'active', NULL, 150, NOW(), NOW()),
  ('930a609a-bef3-4ae3-a346-7bef53f91658', '小礼品', '抱枕', 'reward-covers/f55b5896-d7ac-4f03-be48-07d1ef5f2dca.png', 200, 99, 'available', 'active', NULL, 160, NOW(), NOW()),
  ('5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f01', '高端礼品', 'Dior 迪奥口红', 'static:rewards/dior.jpg', 1500, 1, 'available', 'active', '具体色号与包装以兑换时实际可采购款式为准；首批限量1件。', 900, NOW(), NOW()),
  ('5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f02', '高端礼品', 'Chanel 香水 50ml', 'static:rewards/chanel.png', 4500, 1, 'available', 'active', '具体香型与包装以兑换时实际可采购款式为准；首批限量1件。', 910, NOW(), NOW()),
  ('5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f03', '高端礼品', 'Dyson 入门吹风机 HD08', 'static:rewards/dyson.png', 10000, 1, 'available', 'active', '具体颜色与套装以兑换时实际可采购款式为准；首批限量1件。', 920, NOW(), NOW()),
  ('5b61720b-7c3c-4a30-b6a8-2f0a4d0d8f04', '高端礼品', 'Coach 皮质/礼盒腰带', 'static:rewards/coach.jpg', 4500, 1, 'available', 'active', '具体款式、尺码与包装以兑换时实际可采购款式为准；首批限量1件。', 930, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  category        = VALUES(category),
  name            = VALUES(name),
  points_required = VALUES(points_required),
  stock_quantity  = VALUES(stock_quantity),
  stock_status    = VALUES(stock_status),
  status          = VALUES(status),
  sort_order      = VALUES(sort_order),
  updated_at      = NOW();
