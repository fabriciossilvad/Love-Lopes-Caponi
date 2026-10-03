-- 004_storage.sql
-- Love, Lopes & Caponi
-- Supabase Storage buckets and access policies
--
-- Requires:
--   003_rls.sql (private.is_active_admin())
--
-- Buckets:
--   wedding-gallery -> public gallery/couple/event images
--   gift-images     -> public gift catalog images
--
-- Public means the file itself can be served by a public Storage URL.
-- INSERT/UPDATE/DELETE operations remain restricted to active admins.

begin;

-- ---------------------------------------------------------------------------
-- 1. Create/update buckets
-- ---------------------------------------------------------------------------
-- Keep this migration idempotent enough to be safely re-run during setup.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'wedding-gallery',
    'wedding-gallery',
    true,
    10485760, -- 10 MB
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]::text[]
  ),
  (
    'gift-images',
    'gift-images',
    true,
    5242880, -- 5 MB
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    ]::text[]
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. Storage RLS
-- ---------------------------------------------------------------------------
-- Supabase manages RLS on storage.objects. We only define policies.
-- Public buckets can serve files through their public URL without a SELECT
-- policy, but authenticated admins need SELECT access to object metadata for
-- dashboard operations such as upload/upsert/list/copy.

drop policy if exists "admins can read wedding gallery objects" on storage.objects;
drop policy if exists "admins can upload wedding gallery objects" on storage.objects;
drop policy if exists "admins can update wedding gallery objects" on storage.objects;
drop policy if exists "admins can delete wedding gallery objects" on storage.objects;

drop policy if exists "admins can read gift image objects" on storage.objects;
drop policy if exists "admins can upload gift image objects" on storage.objects;
drop policy if exists "admins can update gift image objects" on storage.objects;
drop policy if exists "admins can delete gift image objects" on storage.objects;

-- wedding-gallery -----------------------------------------------------------

create policy "admins can read wedding gallery objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wedding-gallery'
  and (select private.is_active_admin())
);

create policy "admins can upload wedding gallery objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wedding-gallery'
  and (select private.is_active_admin())
);

create policy "admins can update wedding gallery objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wedding-gallery'
  and (select private.is_active_admin())
)
with check (
  bucket_id = 'wedding-gallery'
  and (select private.is_active_admin())
);

create policy "admins can delete wedding gallery objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wedding-gallery'
  and (select private.is_active_admin())
);

-- gift-images ---------------------------------------------------------------

create policy "admins can read gift image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'gift-images'
  and (select private.is_active_admin())
);

create policy "admins can upload gift image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gift-images'
  and (select private.is_active_admin())
);

create policy "admins can update gift image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'gift-images'
  and (select private.is_active_admin())
)
with check (
  bucket_id = 'gift-images'
  and (select private.is_active_admin())
);

create policy "admins can delete gift image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gift-images'
  and (select private.is_active_admin())
);

commit;