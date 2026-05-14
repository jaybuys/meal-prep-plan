-- ============================================================
-- Migration: Allow admins to update and delete any recipe
-- ============================================================

create policy "Admins can update any recipe"
  on public.recipes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete any recipe"
  on public.recipes for delete
  to authenticated
  using (public.is_admin());
