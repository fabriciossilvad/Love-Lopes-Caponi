-- 009_list_invitation_gift_reservations.sql
-- Read only ACTIVE reservations belonging to the invitation identified by a valid token.
-- No names, emails, guest IDs, or reservations of other invitations are returned.
begin;

create or replace function public.list_invitation_gift_reservations(p_token text)
returns table (
  reservation_id uuid,
  gift_id uuid,
  event_id uuid,
  status public.gift_reservation_status,
  reserved_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation_id uuid;
begin
  select i.id into v_invitation_id
  from public.invitations i
  where i.token = p_token and i.status = 'ACTIVE';

  if v_invitation_id is null then
    raise exception using errcode = 'P0001', message = 'Invalid or disabled invitation';
  end if;

  return query
  select gr.id, gr.gift_id, g.event_id, gr.status, gr.reserved_at
  from public.gift_reservations gr
  join public.gifts g on g.id = gr.gift_id
  where gr.invitation_id = v_invitation_id
    and gr.status = 'ACTIVE'::public.gift_reservation_status
  order by gr.reserved_at desc, gr.id;
end;
$$;

revoke all on function public.list_invitation_gift_reservations(text) from public, anon, authenticated;
grant execute on function public.list_invitation_gift_reservations(text) to anon, authenticated;
commit;
