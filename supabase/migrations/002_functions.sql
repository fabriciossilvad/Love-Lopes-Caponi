-- Love, Lopes & Caponi
-- Migration 002: Database functions, triggers and business-rule enforcement
-- Run after 001_initial_schema.sql.

begin;

-- Keep SECURITY DEFINER helpers outside the exposed public schema.
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Generic updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create trigger events_set_updated_at
before update on public.events
for each row execute function private.set_updated_at();

create trigger invitations_set_updated_at
before update on public.invitations
for each row execute function private.set_updated_at();

create trigger guests_set_updated_at
before update on public.guests
for each row execute function private.set_updated_at();

create trigger guest_events_set_updated_at
before update on public.guest_events
for each row execute function private.set_updated_at();

create trigger gift_categories_set_updated_at
before update on public.gift_categories
for each row execute function private.set_updated_at();

create trigger gifts_set_updated_at
before update on public.gifts
for each row execute function private.set_updated_at();

create trigger gift_reservations_set_updated_at
before update on public.gift_reservations
for each row execute function private.set_updated_at();

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function private.set_updated_at();

create trigger photos_set_updated_at
before update on public.photos
for each row execute function private.set_updated_at();

create trigger site_contents_set_updated_at
before update on public.site_contents
for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Reservation integrity: if guest_id is supplied, it must belong to invitation_id.
-- This protects integrity even for administrative/direct database writes.
-- -----------------------------------------------------------------------------
create or replace function private.validate_reservation_guest()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.guest_id is not null and not exists (
    select 1
    from public.guests g
    where g.id = new.guest_id
      and g.invitation_id = new.invitation_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'Guest does not belong to the reservation invitation';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_reservation_guest() from public;

create trigger gift_reservations_validate_guest
before insert or update of invitation_id, guest_id
on public.gift_reservations
for each row execute function private.validate_reservation_guest();

-- -----------------------------------------------------------------------------
-- Public RPC: update one guest's RSVP using the invitation token.
-- Token acts as the guest credential. The function deliberately returns only
-- the updated RSVP state, not private invitation/guest information.
-- -----------------------------------------------------------------------------
create or replace function public.set_rsvp(
  p_token text,
  p_guest_id uuid,
  p_event_id uuid,
  p_status public.rsvp_status
)
returns table (
  guest_id uuid,
  event_id uuid,
  rsvp_status public.rsvp_status,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation_id uuid;
  v_deadline timestamptz;
begin
  if p_status = 'PENDING' then
    raise exception using
      errcode = '22023',
      message = 'Guests may only answer CONFIRMED or DECLINED';
  end if;

  select i.id
    into v_invitation_id
  from public.invitations i
  where i.token = p_token
    and i.status = 'ACTIVE';

  if v_invitation_id is null then
    raise exception using errcode = 'P0001', message = 'Invalid or disabled invitation';
  end if;

  if not exists (
    select 1
    from public.guests g
    join public.guest_events ge on ge.guest_id = g.id
    where g.id = p_guest_id
      and g.invitation_id = v_invitation_id
      and g.status = 'ACTIVE'
      and ge.event_id = p_event_id
  ) then
    raise exception using errcode = 'P0001', message = 'Guest is not invited to this event';
  end if;

  select e.rsvp_deadline
    into v_deadline
  from public.events e
  where e.id = p_event_id
    and e.status <> 'FINISHED';

  if not found then
    raise exception using errcode = 'P0001', message = 'Event is not available for RSVP';
  end if;

  if v_deadline is not null and now() > v_deadline then
    raise exception using errcode = 'P0001', message = 'RSVP deadline has passed';
  end if;

  return query
  update public.guest_events ge
     set rsvp_status = p_status,
         responded_at = now()
   where ge.guest_id = p_guest_id
     and ge.event_id = p_event_id
  returning ge.guest_id, ge.event_id, ge.rsvp_status, ge.responded_at;
end;
$$;

-- -----------------------------------------------------------------------------
-- Public RPC: reserve exactly one unit of a gift.
-- SELECT ... FOR UPDATE serializes reservations for the same gift, preventing
-- two callers from taking the final unit concurrently.
-- -----------------------------------------------------------------------------
create or replace function public.reserve_gift(
  p_token text,
  p_gift_id uuid,
  p_guest_id uuid default null
)
returns table (
  reservation_id uuid,
  gift_id uuid,
  status public.gift_reservation_status,
  reserved_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation_id uuid;
  v_event_id uuid;
  v_quantity integer;
  v_active_reservations integer;
  v_reservation_id uuid;
  v_reserved_at timestamptz;
begin
  select i.id
    into v_invitation_id
  from public.invitations i
  where i.token = p_token
    and i.status = 'ACTIVE';

  if v_invitation_id is null then
    raise exception using errcode = 'P0001', message = 'Invalid or disabled invitation';
  end if;

  if p_guest_id is not null and not exists (
    select 1
    from public.guests g
    where g.id = p_guest_id
      and g.invitation_id = v_invitation_id
      and g.status = 'ACTIVE'
  ) then
    raise exception using errcode = 'P0001', message = 'Guest does not belong to this invitation';
  end if;

  -- Lock the gift row until this transaction ends. Competing reservations for
  -- the same gift must wait and will re-check availability afterwards.
  select g.event_id, g.quantity
    into v_event_id, v_quantity
  from public.gifts g
  join public.events e on e.id = g.event_id
  where g.id = p_gift_id
    and g.status = 'ACTIVE'
    and e.status = 'ACTIVE'
  for update of g;

  if not found then
    raise exception using errcode = 'P0001', message = 'Gift is not available';
  end if;

  -- The invitation may reserve only gifts from events to which at least one
  -- active member of that invitation is actually invited.
  if not exists (
    select 1
    from public.guests gu
    join public.guest_events ge on ge.guest_id = gu.id
    where gu.invitation_id = v_invitation_id
      and gu.status = 'ACTIVE'
      and ge.event_id = v_event_id
  ) then
    raise exception using errcode = 'P0001', message = 'Invitation does not have access to this gift list';
  end if;

  select count(*)::integer
    into v_active_reservations
  from public.gift_reservations gr
  where gr.gift_id = p_gift_id
    and gr.status = 'ACTIVE';

  if v_active_reservations >= v_quantity then
    raise exception using errcode = 'P0001', message = 'Gift is no longer available';
  end if;

  insert into public.gift_reservations (gift_id, invitation_id, guest_id)
  values (p_gift_id, v_invitation_id, p_guest_id)
  returning id, public.gift_reservations.reserved_at
    into v_reservation_id, v_reserved_at;

  return query
  select v_reservation_id, p_gift_id, 'ACTIVE'::public.gift_reservation_status, v_reserved_at;
end;
$$;

-- -----------------------------------------------------------------------------
-- Public RPC: cancel a reservation owned by the invitation token.
-- History is preserved by changing status instead of deleting the row.
-- -----------------------------------------------------------------------------
create or replace function public.cancel_gift_reservation(
  p_token text,
  p_reservation_id uuid
)
returns table (
  reservation_id uuid,
  gift_id uuid,
  status public.gift_reservation_status,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation_id uuid;
begin
  select i.id
    into v_invitation_id
  from public.invitations i
  where i.token = p_token
    and i.status = 'ACTIVE';

  if v_invitation_id is null then
    raise exception using errcode = 'P0001', message = 'Invalid or disabled invitation';
  end if;

  return query
  update public.gift_reservations gr
     set status = 'CANCELLED',
         cancelled_at = now()
   where gr.id = p_reservation_id
     and gr.invitation_id = v_invitation_id
     and gr.status = 'ACTIVE'
  returning gr.id, gr.gift_id, gr.status, gr.cancelled_at;

  if not found then
    raise exception using errcode = 'P0001', message = 'Active reservation not found for this invitation';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function execution is PUBLIC by default in PostgreSQL. Revoke first, then
-- grant only the RPCs intended for the public website. Admin operations will be
-- governed in the RLS/grants migration.
-- -----------------------------------------------------------------------------
revoke execute on function public.set_rsvp(text, uuid, uuid, public.rsvp_status) from public, anon, authenticated;
revoke execute on function public.reserve_gift(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cancel_gift_reservation(text, uuid) from public, anon, authenticated;

grant execute on function public.set_rsvp(text, uuid, uuid, public.rsvp_status) to anon, authenticated;
grant execute on function public.reserve_gift(text, uuid, uuid) to anon, authenticated;
grant execute on function public.cancel_gift_reservation(text, uuid) to anon, authenticated;

commit;