-- ============================================================
-- Phase 4: organizations company identity fields
-- Adds fields used by province agent company profiles.
-- ============================================================

ALTER TABLE organizations ADD COLUMN social_credit_code TEXT;
ALTER TABLE organizations ADD COLUMN legal_person TEXT;
