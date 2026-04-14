-- ============================================================
-- Migration: Add role column to profiles
-- ============================================================

-- Add role column: 'user' (default) or 'admin'
alter table public.profiles
  add column role text not null default 'user'
  check (role in ('user', 'admin'));

-- Index for quick role lookups
create index profiles_role_idx on public.profiles (role);

-- ============================================================
-- Helper function: check if current user is an admin
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- Admin RLS policies
-- ============================================================

-- Admins can update any profile (e.g. change roles)
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can delete any profile
create policy "Admins can delete any profile"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- Promote your first admin (replace with your user ID)
-- Run this separately after finding your user ID:
--
--   update public.profiles set role = 'admin'
--   where id = '<your-user-uuid>';
-- ============================================================
