-- ============================================================
-- 清空测试数据：省代、门店、质保编码及其全部级联数据
-- 保留：总部组织(HQ)、总部管理员(HQ_ADMIN)、产品/车型/配件/奖励等基础数据
-- 执行：wrangler d1 execute hamorey-db --remote --file=scripts/cleanup-test-data.sql
-- ============================================================

-- 1. 操作日志（target_id 含测试组织 / user_id 含测试用户）
DELETE FROM operation_logs WHERE target_id IN (SELECT id FROM organizations WHERE type IN ('PROVINCE','STORE'));
DELETE FROM operation_logs WHERE user_id IN (SELECT id FROM users WHERE role IN ('PROVINCE','STORE'));

-- 2. 质保照片（→ warranty_records）
DELETE FROM warranty_photos;

-- 3. 审核日志（→ warranty_records）
DELETE FROM warranty_audit_logs;

-- 4. 质保证书文件（→ warranty_records）
DELETE FROM certificate_files;

-- 5. 质保记录（→ warranty_codes + organizations）
DELETE FROM warranty_records;

-- 6. 编码划拨记录（→ warranty_codes + organizations）
DELETE FROM code_allocations;

-- 7. 质保编码（→ organizations + product_models）
DELETE FROM warranty_codes;

-- 8. 积分台账（→ organizations）
DELETE FROM points_ledger WHERE organization_id IN (SELECT id FROM organizations WHERE type IN ('PROVINCE','STORE'));

-- 9. 兑换明细（→ redemptions）
DELETE FROM redemption_items WHERE redemption_id IN (
  SELECT id FROM redemptions WHERE organization_id IN (SELECT id FROM organizations WHERE type IN ('PROVINCE','STORE'))
);

-- 10. 兑换单（→ organizations）
DELETE FROM redemptions WHERE organization_id IN (SELECT id FROM organizations WHERE type IN ('PROVINCE','STORE'));

-- 11. 收货地址（→ organizations）
DELETE FROM addresses WHERE organization_id IN (SELECT id FROM organizations WHERE type IN ('PROVINCE','STORE'));

-- 12. 门店官网公开资料（→ organizations）
DELETE FROM store_public_profiles WHERE organization_id IN (SELECT id FROM organizations WHERE type IN ('PROVINCE','STORE'));

-- 13. 合作招商线索（→ users）
DELETE FROM partner_leads;

-- 14. 测试用户会话（→ users）
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role IN ('PROVINCE','STORE'));

-- 15. 测试用户（PROVINCE + STORE，保留 HQ_ADMIN）
DELETE FROM users WHERE role IN ('PROVINCE','STORE');

-- 16. 子组织（门店，→ 省代 parent_id）
DELETE FROM organizations WHERE type = 'STORE';

-- 17. 省代
DELETE FROM organizations WHERE type = 'PROVINCE';
