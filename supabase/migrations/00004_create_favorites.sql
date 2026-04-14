-- ============================================================
-- Migration: Create favorites table
-- ============================================================

create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz default now() not null,

  -- Each user can favorite a recipe only once
  unique (user_id, recipe_id)
);

-- Index for fast lookups
create index favorites_user_id_idx on public.favorites (user_id);
create index favorites_recipe_id_idx on public.favorites (recipe_id);

-- ============================================================
-- RLS policies
-- ============================================================
alter table public.favorites enable row level security;

-- Anyone can see favorites (useful for counts)
create policy "Favorites are viewable by everyone"
  on public.favorites for select
  to anon, authenticated
  using (true);

-- Authenticated users can insert their own favorites
create policy "Users can favorite recipes"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Authenticated users can remove their own favorites
create policy "Users can unfavorite recipes"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);
