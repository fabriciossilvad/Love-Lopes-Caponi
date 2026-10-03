-- 007_admin_guest_events_rpc.sql
-- Atomically replace a guest's event memberships.
-- Existing memberships that remain selected are preserved, including RSVP state.

begin;

create or replace function public.admin_set_guest_events(
  p_guest_id uuid,
  p_event_ids uuid[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event_ids uuid[];
  v_requested_count integer;
  v_found_count integer;
begin
  if not (select private.is_active_admin()) then
    raise exception 'Admin access required';
  end if;

  if not exists (
    select 1 from public.guests g where g.id = p_guest_id
  ) then
    raise exception 'Guest not found';
  end if;

  if p_event_ids is null or cardinality(p_event_ids) = 0 then
    raise exception 'At least one event is required';
  end if;

  select coalesce(array_agg(distinct event_id), '{}'::uuid[])
    into v_event_ids
    from unnest(p_event_ids) as requested(event_id);

  v_requested_count := cardinality(v_event_ids);

  select count(*)
    into v_found_count
    from public.events e
   where e.id = any(v_event_ids);

  if v_found_count <> v_requested_count then
    raise exception 'One or more events were not found';
  end if;

  -- Add only missing memberships. Rows that already exist are untouched so
  -- their RSVP status/responded_at remain intact.
  insert into public.guest_events (guest_id, event_id)
  select p_guest_id, event_id
    from unnest(v_event_ids) as selected(event_id)
  on conflict (guest_id, event_id) do nothing;

  -- Remove memberships no longer selected.
  delete from public.guest_events ge
   where ge.guest_id = p_guest_id
     and not (ge.event_id = any(v_event_ids));

  return (
    select jsonb_agg(
      jsonb_build_object(
        'event_id', ge.event_id,
        'rsvp_status', ge.rsvp_status,
        'responded_at', ge.responded_at
      )
      order by e.event_date
    )
    from public.guest_events ge
    join public.events e on e.id = ge.event_id
    where ge.guest_id = p_guest_id
  );
end;
$$;

revoke all on function public.admin_set_guest_events(uuid, uuid[]) from public, anon;
grant execute on function public.admin_set_guest_events(uuid, uuid[]) to authenticated;

commit;
