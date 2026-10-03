-- 006_admin_guest_rpc.sql
-- Atomic administrative guest creation with event memberships.

begin;

create or replace function public.admin_create_guest(
  p_invitation_id uuid,
  p_name text,
  p_event_ids uuid[],
  p_phone text default null,
  p_email text default null,
  p_notes text default null,
  p_status public.guest_status default 'ACTIVE'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_guest public.guests%rowtype;
  v_event_ids uuid[];
  v_requested_count integer;
  v_found_count integer;
begin
  -- Authorization is intentionally explicit even though the function is
  -- SECURITY INVOKER and the underlying tables are also protected by RLS.
  if not (select private.is_active_admin()) then
    raise exception 'Admin access required';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Guest name is required';
  end if;

  if p_event_ids is null or cardinality(p_event_ids) = 0 then
    raise exception 'At least one event is required';
  end if;

  if not exists (
    select 1
      from public.invitations i
     where i.id = p_invitation_id
  ) then
    raise exception 'Invitation not found';
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

  insert into public.guests (
    invitation_id,
    name,
    phone,
    email,
    notes,
    status
  )
  values (
    p_invitation_id,
    btrim(p_name),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(p_notes), ''),
    p_status
  )
  returning * into v_guest;

  insert into public.guest_events (guest_id, event_id)
  select v_guest.id, event_id
    from unnest(v_event_ids) as selected(event_id);

  return jsonb_build_object(
    'id', v_guest.id,
    'invitation_id', v_guest.invitation_id,
    'name', v_guest.name,
    'phone', v_guest.phone,
    'email', v_guest.email,
    'notes', v_guest.notes,
    'status', v_guest.status,
    'event_ids', to_jsonb(v_event_ids),
    'created_at', v_guest.created_at,
    'updated_at', v_guest.updated_at
  );
end;
$$;

revoke all on function public.admin_create_guest(
  uuid,
  text,
  uuid[],
  text,
  text,
  text,
  public.guest_status
) from public, anon;

grant execute on function public.admin_create_guest(
  uuid,
  text,
  uuid[],
  text,
  text,
  text,
  public.guest_status
) to authenticated;

commit;
