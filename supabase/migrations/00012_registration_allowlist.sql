-- ============================================================
-- Migration: Registration allowlist (invite-only signups)
-- ============================================================

create table if not exists registration_allowlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table registration_allowlist enable row level security;

-- Users can see whether they are on the allowlist
create policy "Users can view own allowlist row"
  on registration_allowlist for select
  to authenticated
  using (user_id = auth.uid());

-- Users can insert their own allowlist row (server will do this after invite validation)
create policy "Users can insert own allowlist row"
  on registration_allowlist for insert
  to authenticated
  with check (user_id = auth.uid());
