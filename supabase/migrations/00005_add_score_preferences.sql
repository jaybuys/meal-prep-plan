-- ============================================================
-- Migration: Add recipe score preferences to profiles
-- ============================================================

-- Score preferences: 1.0-5.0 scale (one decimal), null means "no preference"
alter table public.profiles
  add column pref_ease_score numeric(2,1) default null check (pref_ease_score between 1.0 and 5.0),
  add column pref_health_score numeric(2,1) default null check (pref_health_score between 1.0 and 5.0),
  add column pref_taste_score numeric(2,1) default null check (pref_taste_score between 1.0 and 5.0),
  add column pref_cost_score numeric(2,1) default null check (pref_cost_score between 1.0 and 5.0);
