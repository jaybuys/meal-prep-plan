-- ============================================================
-- Migration: Create recipes table
-- ============================================================

create table public.recipes (
  id            uuid default gen_random_uuid() primary key,
  name          text not null,
  description   text,
  ingredients   jsonb not null default '[]',
  instructions  text not null,
  cuisine_type  text not null,
  dietary_flags text[] default '{}',
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings      integer,
  image_url     text,

  -- Scores: 1-5 scale, one decimal place
  ease_score    numeric(3,1) check (ease_score   >= 1 and ease_score   <= 5),
  health_score  numeric(3,1) check (health_score >= 1 and health_score <= 5),
  taste_score   numeric(3,1) check (taste_score  >= 1 and taste_score  <= 5),
  cost_score    numeric(3,1) check (cost_score   >= 1 and cost_score   <= 5),

  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- Index for full-text search on name & description
create index recipes_search_idx on public.recipes
  using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Index for cuisine type filtering
create index recipes_cuisine_type_idx on public.recipes (cuisine_type);

-- Index for dietary flags filtering (GIN index on array column)
create index recipes_dietary_flags_idx on public.recipes using gin (dietary_flags);

-- Auto-update updated_at on row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.recipes enable row level security;

-- Anyone (including anonymous / not-logged-in) can read recipes
create policy "Recipes are viewable by everyone"
  on public.recipes for select
  using (true);

-- Authenticated users can insert their own recipes
create policy "Users can insert their own recipes"
  on public.recipes for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Users can update only their own recipes
create policy "Users can update their own recipes"
  on public.recipes for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Users can delete only their own recipes
create policy "Users can delete their own recipes"
  on public.recipes for delete
  to authenticated
  using (auth.uid() = created_by);
