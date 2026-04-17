-- ============================================================
-- Migration: Create storage bucket for recipe images
-- ============================================================

-- Create a public bucket for recipe images
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload images
create policy "Authenticated users can upload recipe images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'recipe-images');

-- Allow anyone to view recipe images (public bucket)
create policy "Anyone can view recipe images"
  on storage.objects for select
  to public
  using (bucket_id = 'recipe-images');

-- Allow authenticated users to update their own uploads
create policy "Users can update own recipe images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'recipe-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own uploads
create policy "Users can delete own recipe images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'recipe-images' and auth.uid()::text = (storage.foldername(name))[1]);
