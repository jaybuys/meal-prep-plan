-- ============================================================
-- Migration: Create meal plans with per-meal entries
-- ============================================================

-- Parent table: one row per weekly meal plan
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One plan per user per week
  unique (user_id, week_start)
);

-- Child table: one row per meal slot (up to 21 per plan)
create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references public.meal_plans(id) on delete cascade not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),   -- 0=Mon … 6=Sun
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  created_at timestamptz default now(),

  -- One recipe per meal slot
  unique (meal_plan_id, day_of_week, meal_type)
);

-- Indexes
create index idx_meal_plans_user on public.meal_plans(user_id);
create index idx_meal_plans_week on public.meal_plans(user_id, week_start);
create index idx_meal_plan_entries_plan on public.meal_plan_entries(meal_plan_id);

-- ============================================================
-- RLS policies
-- ============================================================

alter table public.meal_plans enable row level security;
alter table public.meal_plan_entries enable row level security;

-- meal_plans: users can CRUD their own plans
create policy "Users can view own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can create own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

-- meal_plan_entries: access via parent plan ownership
create policy "Users can view own meal plan entries"
  on public.meal_plan_entries for select
  using (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.meal_plan_id
        and user_id = auth.uid()
    )
  );

create policy "Users can create own meal plan entries"
  on public.meal_plan_entries for insert
  with check (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.meal_plan_id
        and user_id = auth.uid()
    )
  );

create policy "Users can update own meal plan entries"
  on public.meal_plan_entries for update
  using (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.meal_plan_id
        and user_id = auth.uid()
    )
  );

create policy "Users can delete own meal plan entries"
  on public.meal_plan_entries for delete
  using (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.meal_plan_id
        and user_id = auth.uid()
    )
  );
