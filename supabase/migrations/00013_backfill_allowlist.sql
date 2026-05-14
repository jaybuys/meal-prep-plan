-- ============================================================
-- Migration: Backfill existing users into registration allowlist
-- ============================================================

INSERT INTO registration_allowlist (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
