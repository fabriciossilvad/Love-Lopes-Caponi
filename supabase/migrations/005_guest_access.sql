-- Love, Lopes & Caponi
-- Migration 005: Safe guest read access
-- Run after 004_storage.sql.

begin;

-- Returns only the information required to render one invitation.
-- Phone, email, notes and internal invitation data are deliberately excluded.
create or replace function public.get_invitation_context(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation_id uuid;
  v_display_name text;
  v_result jsonb;
begin
  select i.id, i.display_name
    into v_invitation_id, v_display_name
  from public.invitations i
  where i.token = p_token
    and i.status = 'ACTIVE';

  if v_invitation_id is null then
    raise exception using errcode = 'P0001', message = 'Invalid or disabled invitation';
  end if;

  select jsonb_build_object(
    'display_name', v_display_name,
    'guests', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'name', g.name,
          'events', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', e.id,
                'name', e.name,
                'slug', e.slug,
                'event_date', e.event_date,
                'venue_name', e.venue_name,
                'address', e.address,
                'maps_url', e.maps_url,
                'rsvp_deadline', e.rsvp_deadline,
                'additional_info', e.additional_info,
                'rsvp_status', ge.rsvp_status,
                'responded_at', ge.responded_at
              )
              order by e.event_date
            )
            from public.guest_events ge
            join public.events e on e.id = ge.event_id
            where ge.guest_id = g.id
              and e.status = 'ACTIVE'
          ), '[]'::jsonb)
        )
        order by g.name
      )
      from public.guests g
      where g.invitation_id = v_invitation_id
        and g.status = 'ACTIVE'
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

-- Returns gift catalog + derived availability for one event, but only when
-- the invitation has at least one active guest invited to that event.
-- Reservation ownership/identity is never returned.
create or replace function public.get_event_gifts(
  p_token text,
  p_event_id uuid
)
returns table (
  gift_id uuid,
  category_id uuid,
  category_name text,
  name text,
  description text,
  image_path text,
  estimated_value numeric,
  quantity integer,
  available_quantity integer,
  display_order integer
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

  if not exists (
    select 1
    from public.guests gu
    join public.guest_events ge on ge.guest_id = gu.id
    join public.events e on e.id = ge.event_id
    where gu.invitation_id = v_invitation_id
      and gu.status = 'ACTIVE'
      and ge.event_id = p_event_id
      and e.status = 'ACTIVE'
  ) then
    raise exception using errcode = 'P0001', message = 'Invitation does not have access to this gift list';
  end if;

  return query
  select
    g.id,
    g.category_id,
    gc.name,
    g.name,
    g.description,
    g.image_path,
    g.estimated_value,
    g.quantity,
    greatest(
      g.quantity - (
        select count(*)::integer
        from public.gift_reservations gr
        where gr.gift_id = g.id
          and gr.status = 'ACTIVE'
      ),
      0
    )::integer,
    g.display_order
  from public.gifts g
  left join public.gift_categories gc
    on gc.id = g.category_id
   and gc.active = true
  where g.event_id = p_event_id
    and g.status = 'ACTIVE'
  order by g.display_order, g.name;
end;
$$;

revoke execute on function public.get_invitation_context(text) from public, anon, authenticated;
revoke execute on function public.get_event_gifts(text, uuid) from public, anon, authenticated;

grant execute on function public.get_invitation_context(text) to anon, authenticated;
grant execute on function public.get_event_gifts(text, uuid) to anon, authenticated;

commit;
