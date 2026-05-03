-- ============================================================
-- Migration: Create shopping list table
-- ============================================================

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity text,
  checked boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast per-user queries ordered by position
create index if not exists idx_shopping_list_user_position
  on shopping_list_items (user_id, position);

-- RLS
alter table shopping_list_items enable row level security;

create policy "Users can view own shopping list items"
  on shopping_list_items for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own shopping list items"
  on shopping_list_items for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own shopping list items"
  on shopping_list_items for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own shopping list items"
  on shopping_list_items for delete
  to authenticated
  using (user_id = auth.uid());
