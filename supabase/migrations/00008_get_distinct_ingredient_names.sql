-- ============================================================
-- Migration: Function to extract distinct ingredient names from recipes
-- ============================================================

create or replace function get_distinct_ingredient_names()
returns table(name text) as $$
  select distinct initcap(lower(trim(elem->>'name'))) as name
  from recipes, jsonb_array_elements(ingredients) as elem
  where elem->>'name' is not null and trim(elem->>'name') != ''
  order by name;
$$ language sql stable;
