-- 008_admin_update_gift_rpc.sql
-- Atomically update a gift while protecting quantity against active reservations.

begin;

create or replace function public.admin_update_gift(
  p_gift_id uuid,
  p_event_id uuid default null,
  p_category_id uuid default null,
  p_set_category_id boolean default false,
  p_name text default null,
  p_description text default null,
  p_set_description boolean default false,
  p_image_path text default null,
  p_set_image_path boolean default false,
  p_estimated_value numeric default null,
  p_set_estimated_value boolean default false,
  p_quantity integer default null,
  p_status public.gift_status default null,
  p_display_order integer default null
)
returns public.gifts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_gift public.gifts%rowtype;
  v_active_reservations integer;
begin
  if not (select private.is_active_admin()) then
    raise exception 'Admin access required';
  end if;

  select *
    into v_gift
    from public.gifts
   where id = p_gift_id
   for update;

  if not found then
    raise exception 'Gift not found';
  end if;

  if p_quantity is not null then
    if p_quantity <= 0 then
      raise exception 'Gift quantity must be positive';
    end if;

    select count(*)
      into v_active_reservations
      from public.gift_reservations
     where gift_id = p_gift_id
       and status = 'ACTIVE';

    if p_quantity < v_active_reservations then
      raise exception 'Gift quantity cannot be lower than active reservations';
    end if;
  end if;

  update public.gifts
     set event_id = coalesce(p_event_id, event_id),
         category_id = case when p_set_category_id then p_category_id else category_id end,
         name = coalesce(p_name, name),
         description = case when p_set_description then p_description else description end,
         image_path = case when p_set_image_path then p_image_path else image_path end,
         estimated_value = case when p_set_estimated_value then p_estimated_value else estimated_value end,
         quantity = coalesce(p_quantity, quantity),
         status = coalesce(p_status, status),
         display_order = coalesce(p_display_order, display_order)
   where id = p_gift_id
   returning * into v_gift;

  return v_gift;
end;
$$;

revoke all on function public.admin_update_gift(
  uuid, uuid, uuid, boolean, text, text, boolean, text, boolean,
  numeric, boolean, integer, public.gift_status, integer
) from public, anon;

grant execute on function public.admin_update_gift(
  uuid, uuid, uuid, boolean, text, text, boolean, text, boolean,
  numeric, boolean, integer, public.gift_status, integer
) to authenticated;

commit;
