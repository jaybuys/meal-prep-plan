-- ============================================================
-- Migration: Add calories column to recipes
-- ============================================================

alter table recipes add column if not exists calories integer;
