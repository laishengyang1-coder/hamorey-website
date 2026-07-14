-- ============================================================
-- Phase 3: cross-client data integrity and idempotency guards
-- Safe to run repeatedly. Apply before deploying code that uses stock reservation.
-- ============================================================

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_warranty_award_once
    ON points_ledger(organization_id, related_id)
    WHERE related_type = 'warranty' AND change_type = 'award';

CREATE UNIQUE INDEX IF NOT EXISTS idx_redemption_freeze_once
    ON points_ledger(related_id)
    WHERE related_type = 'redemption' AND change_type = 'freeze';

CREATE UNIQUE INDEX IF NOT EXISTS idx_redemption_one_resolution
    ON points_ledger(related_id)
    WHERE related_type = 'redemption' AND change_type IN ('deduct', 'release');

CREATE UNIQUE INDEX IF NOT EXISTS idx_ri_unique_reward
    ON redemption_items(redemption_id, reward_id);

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
