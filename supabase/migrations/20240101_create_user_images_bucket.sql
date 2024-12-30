-- Create the storage bucket for user images
insert into storage.buckets (id, name, public)
values ('user-images', 'user-images', true);

-- Allow authenticated users to upload files to the bucket
create policy "Allow authenticated users to upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = 'user-images'
);

-- Allow authenticated users to update their own files
create policy "Allow users to update their own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow authenticated users to delete their own files
create policy "Allow users to delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow public access to read files
create policy "Allow public read access"
on storage.objects for select
to public
using (bucket_id = 'user-images'); 