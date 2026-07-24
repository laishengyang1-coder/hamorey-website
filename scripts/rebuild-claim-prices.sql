-- ====== 1. Clear old data ======
DELETE FROM claim_prices;
UPDATE claim_parts SET status='inactive';

-- ====== 2. Insert claim_parts ======
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_front_bumper', '前保险杠', 'ppf', 1, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_rear_bumper', '后保险杠', 'ppf', 2, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_hood', '前机盖', 'ppf', 3, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_left_fender', '左前翼子板', 'ppf', 4, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_right_fender', '右前翼子板', 'ppf', 5, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_left_f_door', '左前门', 'ppf', 6, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_right_f_door', '右前门', 'ppf', 7, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_left_r_door', '左后门', 'ppf', 8, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_right_r_door', '右后门', 'ppf', 9, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_left_r_fender', '左后翼子板', 'ppf', 10, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_right_r_fender', '右后翼子板', 'ppf', 11, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_roof', '车顶', 'ppf', 12, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('ppf_trunk', '后备箱盖', 'ppf', 13, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_front_bumper', '前保险杠', 'color_ppf', 14, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_rear_bumper', '后保险杠', 'color_ppf', 15, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_hood', '前机盖', 'color_ppf', 16, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_left_fender', '左前翼子板', 'color_ppf', 17, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_right_fender', '右前翼子板', 'color_ppf', 18, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_left_f_door', '左前门', 'color_ppf', 19, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_right_f_door', '右前门', 'color_ppf', 20, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_left_r_door', '左后门', 'color_ppf', 21, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_right_r_door', '右后门', 'color_ppf', 22, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_left_r_fender', '左后翼子板', 'color_ppf', 23, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_right_r_fender', '右后翼子板', 'color_ppf', 24, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_roof', '车顶', 'color_ppf', 25, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('c_ppf_trunk', '后备箱盖', 'color_ppf', 26, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('wf_windshield', '前挡', 'window_film', 1, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('wf_left_f_side', '左前侧窗', 'window_film', 2, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('wf_right_f_side', '右前侧窗', 'window_film', 3, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('wf_left_r_side', '左后侧窗', 'window_film', 4, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('wf_right_r_side', '右后侧窗', 'window_film', 5, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('wf_rear_window', '后挡', 'window_film', 6, 'active');
INSERT OR REPLACE INTO claim_parts (id, name, category, sort_order, status) VALUES ('sf_skylight', '天窗冰甲整体', 'sunroof_film', 1, 'active');

-- ====== 3. Insert claim_prices ======

-- 和兴 HX8 (HX8) total=9800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_front_bumper', id, 'ppf_front_bumper', 98000, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_rear_bumper', id, 'ppf_rear_bumper', 78400, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_hood', id, 'ppf_hood', 137200, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_left_fender', id, 'ppf_left_fender', 58800, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_right_fender', id, 'ppf_right_fender', 58800, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_left_f_door', id, 'ppf_left_f_door', 78400, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_right_f_door', id, 'ppf_right_f_door', 78400, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_left_r_door', id, 'ppf_left_r_door', 68600, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_right_r_door', id, 'ppf_right_r_door', 68600, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_left_r_fender', id, 'ppf_left_r_fender', 49000, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_right_r_fender', id, 'ppf_right_r_fender', 49000, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_roof', id, 'ppf_roof', 78400, 'active' FROM product_models WHERE model_code='HX8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX8_ppf_trunk', id, 'ppf_trunk', 78400, 'active' FROM product_models WHERE model_code='HX8';

-- 和兴 HX9 (HX9) total=12800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_front_bumper', id, 'ppf_front_bumper', 128000, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_rear_bumper', id, 'ppf_rear_bumper', 102400, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_hood', id, 'ppf_hood', 179200, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_left_fender', id, 'ppf_left_fender', 76800, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_right_fender', id, 'ppf_right_fender', 76800, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_left_f_door', id, 'ppf_left_f_door', 102400, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_right_f_door', id, 'ppf_right_f_door', 102400, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_left_r_door', id, 'ppf_left_r_door', 89600, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_right_r_door', id, 'ppf_right_r_door', 89600, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_left_r_fender', id, 'ppf_left_r_fender', 64000, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_right_r_fender', id, 'ppf_right_r_fender', 64000, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_roof', id, 'ppf_roof', 102400, 'active' FROM product_models WHERE model_code='HX9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HX9_ppf_trunk', id, 'ppf_trunk', 102400, 'active' FROM product_models WHERE model_code='HX9';

-- 和御 HY8 (HY8) total=16800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_front_bumper', id, 'ppf_front_bumper', 168000, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_rear_bumper', id, 'ppf_rear_bumper', 134400, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_hood', id, 'ppf_hood', 235200, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_left_fender', id, 'ppf_left_fender', 100800, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_right_fender', id, 'ppf_right_fender', 100800, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_left_f_door', id, 'ppf_left_f_door', 134400, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_right_f_door', id, 'ppf_right_f_door', 134400, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_left_r_door', id, 'ppf_left_r_door', 117600, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_right_r_door', id, 'ppf_right_r_door', 117600, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_left_r_fender', id, 'ppf_left_r_fender', 84000, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_right_r_fender', id, 'ppf_right_r_fender', 84000, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_roof', id, 'ppf_roof', 134400, 'active' FROM product_models WHERE model_code='HY8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HY8_ppf_trunk', id, 'ppf_trunk', 134400, 'active' FROM product_models WHERE model_code='HY8';

-- 和旺 HW8 (HW8) total=14800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_front_bumper', id, 'ppf_front_bumper', 148000, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_rear_bumper', id, 'ppf_rear_bumper', 118400, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_hood', id, 'ppf_hood', 207200, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_left_fender', id, 'ppf_left_fender', 88800, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_right_fender', id, 'ppf_right_fender', 88800, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_left_f_door', id, 'ppf_left_f_door', 118400, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_right_f_door', id, 'ppf_right_f_door', 118400, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_left_r_door', id, 'ppf_left_r_door', 103600, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_right_r_door', id, 'ppf_right_r_door', 103600, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_left_r_fender', id, 'ppf_left_r_fender', 74000, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_right_r_fender', id, 'ppf_right_r_fender', 74000, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_roof', id, 'ppf_roof', 118400, 'active' FROM product_models WHERE model_code='HW8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW8_ppf_trunk', id, 'ppf_trunk', 118400, 'active' FROM product_models WHERE model_code='HW8';

-- 和旺 HW9 (HW9) total=15800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_front_bumper', id, 'ppf_front_bumper', 158000, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_rear_bumper', id, 'ppf_rear_bumper', 126400, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_hood', id, 'ppf_hood', 221200, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_left_fender', id, 'ppf_left_fender', 94800, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_right_fender', id, 'ppf_right_fender', 94800, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_left_f_door', id, 'ppf_left_f_door', 126400, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_right_f_door', id, 'ppf_right_f_door', 126400, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_left_r_door', id, 'ppf_left_r_door', 110600, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_right_r_door', id, 'ppf_right_r_door', 110600, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_left_r_fender', id, 'ppf_left_r_fender', 79000, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_right_r_fender', id, 'ppf_right_r_fender', 79000, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_roof', id, 'ppf_roof', 126400, 'active' FROM product_models WHERE model_code='HW9';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'HW9_ppf_trunk', id, 'ppf_trunk', 126400, 'active' FROM product_models WHERE model_code='HW9';

-- 和雅 HYM 哑光 (YM-8) total=12800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_front_bumper', id, 'ppf_front_bumper', 128000, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_rear_bumper', id, 'ppf_rear_bumper', 102400, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_hood', id, 'ppf_hood', 179200, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_left_fender', id, 'ppf_left_fender', 76800, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_right_fender', id, 'ppf_right_fender', 76800, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_left_f_door', id, 'ppf_left_f_door', 102400, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_right_f_door', id, 'ppf_right_f_door', 102400, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_left_r_door', id, 'ppf_left_r_door', 89600, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_right_r_door', id, 'ppf_right_r_door', 89600, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_left_r_fender', id, 'ppf_left_r_fender', 64000, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_right_r_fender', id, 'ppf_right_r_fender', 64000, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_roof', id, 'ppf_roof', 102400, 'active' FROM product_models WHERE model_code='YM-8';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'YM-8_ppf_trunk', id, 'ppf_trunk', 102400, 'active' FROM product_models WHERE model_code='YM-8';

-- 和膜和彩全彩车衣 (QCCY) total=16800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_front_bumper', id, 'c_ppf_front_bumper', 168000, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_rear_bumper', id, 'c_ppf_rear_bumper', 134400, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_hood', id, 'c_ppf_hood', 235200, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_left_fender', id, 'c_ppf_left_fender', 100800, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_right_fender', id, 'c_ppf_right_fender', 100800, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_left_f_door', id, 'c_ppf_left_f_door', 134400, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_right_f_door', id, 'c_ppf_right_f_door', 134400, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_left_r_door', id, 'c_ppf_left_r_door', 117600, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_right_r_door', id, 'c_ppf_right_r_door', 117600, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_left_r_fender', id, 'c_ppf_left_r_fender', 84000, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_right_r_fender', id, 'c_ppf_right_r_fender', 84000, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_roof', id, 'c_ppf_roof', 134400, 'active' FROM product_models WHERE model_code='QCCY';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'QCCY_c_ppf_trunk', id, 'c_ppf_trunk', 134400, 'active' FROM product_models WHERE model_code='QCCY';

-- 天窗冰甲 T1 (T1) total=5000元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'T1_sf_skylight', id, 'sf_skylight', 500000, 'active' FROM product_models WHERE model_code='T1';

-- 天窗冰甲 T2 (T2) total=5000元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'T2_sf_skylight', id, 'sf_skylight', 500000, 'active' FROM product_models WHERE model_code='T2';

-- 和真 (WF-HZ75) total=2280元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HZ75_wf_windshield', id, 'wf_windshield', 79800, 'active' FROM product_models WHERE model_code='WF-HZ75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HZ75_wf_left_f_side', id, 'wf_left_f_side', 29600, 'active' FROM product_models WHERE model_code='WF-HZ75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HZ75_wf_right_f_side', id, 'wf_right_f_side', 29600, 'active' FROM product_models WHERE model_code='WF-HZ75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HZ75_wf_left_r_side', id, 'wf_left_r_side', 29600, 'active' FROM product_models WHERE model_code='WF-HZ75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HZ75_wf_right_r_side', id, 'wf_right_r_side', 29600, 'active' FROM product_models WHERE model_code='WF-HZ75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HZ75_wf_rear_window', id, 'wf_rear_window', 29600, 'active' FROM product_models WHERE model_code='WF-HZ75';

-- 和原 (WF-HY75) total=1350元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HY75_wf_windshield', id, 'wf_windshield', 47200, 'active' FROM product_models WHERE model_code='WF-HY75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HY75_wf_left_f_side', id, 'wf_left_f_side', 17600, 'active' FROM product_models WHERE model_code='WF-HY75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HY75_wf_right_f_side', id, 'wf_right_f_side', 17600, 'active' FROM product_models WHERE model_code='WF-HY75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HY75_wf_left_r_side', id, 'wf_left_r_side', 17600, 'active' FROM product_models WHERE model_code='WF-HY75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HY75_wf_right_r_side', id, 'wf_right_r_side', 17600, 'active' FROM product_models WHERE model_code='WF-HY75';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HY75_wf_rear_window', id, 'wf_rear_window', 17600, 'active' FROM product_models WHERE model_code='WF-HY75';

-- 和护 (WF-HH70) total=3680元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HH70_wf_windshield', id, 'wf_windshield', 128800, 'active' FROM product_models WHERE model_code='WF-HH70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HH70_wf_left_f_side', id, 'wf_left_f_side', 47800, 'active' FROM product_models WHERE model_code='WF-HH70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HH70_wf_right_f_side', id, 'wf_right_f_side', 47800, 'active' FROM product_models WHERE model_code='WF-HH70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HH70_wf_left_r_side', id, 'wf_left_r_side', 47800, 'active' FROM product_models WHERE model_code='WF-HH70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HH70_wf_right_r_side', id, 'wf_right_r_side', 47800, 'active' FROM product_models WHERE model_code='WF-HH70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HH70_wf_rear_window', id, 'wf_rear_window', 47800, 'active' FROM product_models WHERE model_code='WF-HH70';

-- 和盾 (WF-HD70) total=4980元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HD70_wf_windshield', id, 'wf_windshield', 174300, 'active' FROM product_models WHERE model_code='WF-HD70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HD70_wf_left_f_side', id, 'wf_left_f_side', 64700, 'active' FROM product_models WHERE model_code='WF-HD70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HD70_wf_right_f_side', id, 'wf_right_f_side', 64700, 'active' FROM product_models WHERE model_code='WF-HD70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HD70_wf_left_r_side', id, 'wf_left_r_side', 64700, 'active' FROM product_models WHERE model_code='WF-HD70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HD70_wf_right_r_side', id, 'wf_right_r_side', 64700, 'active' FROM product_models WHERE model_code='WF-HD70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HD70_wf_rear_window', id, 'wf_rear_window', 64700, 'active' FROM product_models WHERE model_code='WF-HD70';

-- 和光 (WF-HG70) total=16800元
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HG70_wf_windshield', id, 'wf_windshield', 588000, 'active' FROM product_models WHERE model_code='WF-HG70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HG70_wf_left_f_side', id, 'wf_left_f_side', 218400, 'active' FROM product_models WHERE model_code='WF-HG70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HG70_wf_right_f_side', id, 'wf_right_f_side', 218400, 'active' FROM product_models WHERE model_code='WF-HG70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HG70_wf_left_r_side', id, 'wf_left_r_side', 218400, 'active' FROM product_models WHERE model_code='WF-HG70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HG70_wf_right_r_side', id, 'wf_right_r_side', 218400, 'active' FROM product_models WHERE model_code='WF-HG70';
INSERT OR REPLACE INTO claim_prices (id, model_id, part_id, price_cents, status) SELECT 'WF-HG70_wf_rear_window', id, 'wf_rear_window', 218400, 'active' FROM product_models WHERE model_code='WF-HG70';