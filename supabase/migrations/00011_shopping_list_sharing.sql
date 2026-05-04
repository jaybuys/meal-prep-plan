-- ============================================================
-- Migration: Shopping list sharing
-- ============================================================

-- Sharing table: owner shares their list with another user
create table if not exists shopping_list_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, shared_with_id)
);

create index if not exists idx_shopping_list_shares_owner
  on shopping_list_shares (owner_id);
create index if not exists idx_shopping_list_shares_shared
  on shopping_list_shares (shared_with_id);

alter table shopping_list_shares enable row level security;

-- Owner can see and manage their shares
create policy "Owner can view own shares"
  on shopping_list_shares for select
  to authenticated
  using (owner_id = auth.uid() or shared_with_id = auth.uid());

create policy "Owner can create shares"
  on shopping_list_shares for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owner or member can delete shares"
  on shopping_list_shares for delete
  to authenticated
  using (owner_id = auth.uid() or shared_with_id = auth.uid());

-- Helper: look up a user ID by email (security definer to access auth.users)
create or replace function get_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
stable
as $$
  select id from auth.users where email = lower(lookup_email) limit 1;
$$;

-- Helper: check if the current user can access a given user's shopping list
create or replace function can_access_shopping_list(target_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select
    target_user_id = auth.uid()
    or exists (
      select 1 from shopping_list_shares
      where owner_id = target_user_id
        and shared_with_id = auth.uid()
    );
$$;

-- Drop existing restrictive policies on shopping_list_items
drop policy if exists "Users can view own shopping list items" on shopping_list_items;
drop policy if exists "Users can insert own shopping list items" on shopping_list_items;
drop policy if exists "Users can update own shopping list items" on shopping_list_items;
drop policy if exists "Users can delete own shopping list items" on shopping_list_items;

-- Recreate with sharing support
create policy "Users can view accessible shopping list items"
  on shopping_list_items for select
  to authenticated
  using (can_access_shopping_list(user_id));

create policy "Users can insert accessible shopping list items"
  on shopping_list_items for insert
  to authenticated
  with check (can_access_shopping_list(user_id));

create policy "Users can update accessible shopping list items"
  on shopping_list_items for update
  to authenticated
  using (can_access_shopping_list(user_id));

create policy "Users can delete accessible shopping list items"
  on shopping_list_items for delete
  to authenticated
  using (can_access_shopping_list(user_id));
