-- 003_rls.sql
-- Love, Lopes & Caponi
-- Row Level Security and Data API grants
--
-- Assumptions:
--   * 001_initial_schema.sql and 002_functions.sql have already been applied.
--   * public.admin_users.id references auth.users.id.
--   * Guest operations happen through the RPC functions created in migration 002.
--
-- Security model:
--   anon          -> read only explicitly public catalog/content
--                   + execute only the guest RPCs granted in 002
--   authenticated -> same public reads; full table CRUD only when the user is an active ADMIN
--   service_role  -> server-side only; Supabase bypasses RLS for this role
--
-- IMPORTANT:
-- The invitation token must NOT be exposed through direct SELECTs on public.invitations.

begin;

-- ---------------------------------------------------------------------------
-- 1. Helper used by RLS policies
-- ---------------------------------------------------------------------------
-- Keep the helper out of the exposed public schema. The function is
-- SECURITY DEFINER so it can inspect admin_users without recursively invoking
-- the admin_users RLS policy itself.
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.admin_users au
     where au.id = (select auth.uid())
       and au.active = true
       and au.role = 'ADMIN'::public.admin_role
  );
$$;

revoke all on function private.is_active_admin() from public;
revoke all on function private.is_active_admin() from anon;
grant execute on function private.is_active_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. RLS must remain enabled on every exposed table
-- ---------------------------------------------------------------------------
alter table public.admin_users       enable row level security;
alter table public.events            enable row level security;
alter table public.invitations       enable row level security;
alter table public.guests            enable row level security;
alter table public.guest_events      enable row level security;
alter table public.gift_categories   enable row level security;
alter table public.gifts             enable row level security;
alter table public.gift_reservations enable row level security;
alter table public.photos            enable row level security;
alter table public.site_contents     enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Remove implicit Data API table access first
-- ---------------------------------------------------------------------------
revoke all on table public.admin_users       from anon, authenticated;
revoke all on table public.events            from anon, authenticated;
revoke all on table public.invitations       from anon, authenticated;
revoke all on table public.guests            from anon, authenticated;
revoke all on table public.guest_events      from anon, authenticated;
revoke all on table public.gift_categories   from anon, authenticated;
revoke all on table public.gifts             from anon, authenticated;
revoke all on table public.gift_reservations from anon, authenticated;
revoke all on table public.photos            from anon, authenticated;
revoke all on table public.site_contents     from anon, authenticated;

-- Public site: direct read access only to non-sensitive content.
grant select on table public.events          to anon, authenticated;
grant select on table public.gift_categories to anon, authenticated;
grant select on table public.gifts           to anon, authenticated;
grant select on table public.photos          to anon, authenticated;
grant select on table public.site_contents   to anon, authenticated;

-- Admin panel: authenticated users may attempt CRUD. RLS below limits this to
-- rows only when private.is_active_admin() is true.
grant select, insert, update, delete on table public.admin_users       to authenticated;
grant select, insert, update, delete on table public.events            to authenticated;
grant select, insert, update, delete on table public.invitations       to authenticated;
grant select, insert, update, delete on table public.guests            to authenticated;
grant select, insert, update, delete on table public.guest_events      to authenticated;
grant select, insert, update, delete on table public.gift_categories   to authenticated;
grant select, insert, update, delete on table public.gifts             to authenticated;
grant select, insert, update, delete on table public.gift_reservations to authenticated;
grant select, insert, update, delete on table public.photos            to authenticated;
grant select, insert, update, delete on table public.site_contents     to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Public SELECT policies
-- ---------------------------------------------------------------------------
-- Only active events are public.
create policy "public can read active events"
on public.events
for select
to anon, authenticated
using (status = 'ACTIVE'::public.event_status);

-- Only active categories are public.
create policy "public can read active gift categories"
on public.gift_categories
for select
to anon, authenticated
using (active = true);

-- Only active gifts belonging to an active event are public.
create policy "public can read active gifts"
on public.gifts
for select
to anon, authenticated
using (
  status = 'ACTIVE'::public.gift_status
  and exists (
    select 1
      from public.events e
     where e.id = gifts.event_id
       and e.status = 'ACTIVE'::public.event_status
  )
);

-- Only active photos are public. If tied to an event, that event must be active.
create policy "public can read active photos"
on public.photos
for select
to anon, authenticated
using (
  active = true
  and (
    event_id is null
    or exists (
      select 1
        from public.events e
       where e.id = photos.event_id
         and e.status = 'ACTIVE'::public.event_status
    )
  )
);

-- site_contents contains only content intended for the public website.
-- Do not store secrets or internal notes in this table.
create policy "public can read site contents"
on public.site_contents
for select
to anon, authenticated
using (true);

-- No public policies are intentionally created for:
--   invitations, guests, guest_events, gift_reservations, admin_users.
-- Guest access to those domains must go through the RPC functions.

-- ---------------------------------------------------------------------------
-- 5. Admin policies
-- ---------------------------------------------------------------------------
-- Explicit per-operation policies make the intended authorization visible.
-- Authenticated non-admin users receive no rows / no write permission.

-- admin_users
create policy "admins can read admin users"
on public.admin_users for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert admin users"
on public.admin_users for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update admin users"
on public.admin_users for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete admin users"
on public.admin_users for delete to authenticated
using ((select private.is_active_admin()));

-- events
create policy "admins can read all events"
on public.events for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert events"
on public.events for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update events"
on public.events for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete events"
on public.events for delete to authenticated
using ((select private.is_active_admin()));

-- invitations
create policy "admins can read invitations"
on public.invitations for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert invitations"
on public.invitations for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update invitations"
on public.invitations for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete invitations"
on public.invitations for delete to authenticated
using ((select private.is_active_admin()));

-- guests
create policy "admins can read guests"
on public.guests for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert guests"
on public.guests for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update guests"
on public.guests for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete guests"
on public.guests for delete to authenticated
using ((select private.is_active_admin()));

-- guest_events
create policy "admins can read guest events"
on public.guest_events for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert guest events"
on public.guest_events for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update guest events"
on public.guest_events for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete guest events"
on public.guest_events for delete to authenticated
using ((select private.is_active_admin()));

-- gift_categories
create policy "admins can read all gift categories"
on public.gift_categories for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert gift categories"
on public.gift_categories for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update gift categories"
on public.gift_categories for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete gift categories"
on public.gift_categories for delete to authenticated
using ((select private.is_active_admin()));

-- gifts
create policy "admins can read all gifts"
on public.gifts for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert gifts"
on public.gifts for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update gifts"
on public.gifts for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete gifts"
on public.gifts for delete to authenticated
using ((select private.is_active_admin()));

-- gift_reservations
create policy "admins can read gift reservations"
on public.gift_reservations for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert gift reservations"
on public.gift_reservations for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update gift reservations"
on public.gift_reservations for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete gift reservations"
on public.gift_reservations for delete to authenticated
using ((select private.is_active_admin()));

-- photos
create policy "admins can read all photos"
on public.photos for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert photos"
on public.photos for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update photos"
on public.photos for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete photos"
on public.photos for delete to authenticated
using ((select private.is_active_admin()));

-- site_contents
create policy "admins can read site contents"
on public.site_contents for select to authenticated
using ((select private.is_active_admin()));

create policy "admins can insert site contents"
on public.site_contents for insert to authenticated
with check ((select private.is_active_admin()));

create policy "admins can update site contents"
on public.site_contents for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy "admins can delete site contents"
on public.site_contents for delete to authenticated
using ((select private.is_active_admin()));

commit;