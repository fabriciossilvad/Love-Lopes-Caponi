-- Love, Lopes & Caponi
-- Validation for migration 005_guest_access.sql
-- Development/test only. Requires supabase/seed.sql data.

-- 1. Valid invitation context.
-- Expected: Família Silva, 3 guests.
-- Marcos/Juliana have 2 events; Pedro has only Casamento.
select jsonb_pretty(
  public.get_invitation_context('TESTE-FAMILIA-SILVA-2027-AAAA')
);

-- 2. Verify private fields are not present in the RPC result.
-- Expected: all columns = false.
with ctx as (
  select public.get_invitation_context(
    'TESTE-FAMILIA-SILVA-2027-AAAA'
  ) as data
)
select
  data ? 'token' as exposes_token,
  data ? 'internal_notes' as exposes_internal_notes,
  data::text like '%phone%' as exposes_phone,
  data::text like '%email%' as exposes_email,
  data::text like '%notes%' as exposes_notes
from ctx;

-- 3. Gift catalog + availability for an allowed event.
-- Expected: Família Silva can see Casamento gifts.
select gifts.*
from public.events e
cross join lateral public.get_event_gifts(
  'TESTE-FAMILIA-SILVA-2027-AAAA',
  e.id
) gifts
where e.slug = 'casamento'
order by gifts.display_order, gifts.name;

-- 4. Availability must be derived from ACTIVE reservations.
-- This test creates a reservation and rolls it back.
begin;

select *
from public.reserve_gift(
  'TESTE-FAMILIA-SILVA-2027-AAAA',
  (
    select g.id
    from public.gifts g
    join public.events e on e.id = g.event_id
    where e.slug = 'casamento'
      and g.name = 'Jogo de pratos'
  ),
  null
);

select gifts.name, gifts.quantity, gifts.available_quantity
from public.events e
cross join lateral public.get_event_gifts(
  'TESTE-FAMILIA-SILVA-2027-AAAA',
  e.id
) gifts
where e.slug = 'casamento'
  and gifts.name = 'Jogo de pratos';

rollback;

-- 5. INVALID TOKEN - run separately after tests 1-4.
-- Expected: ERROR "Invalid or disabled invitation".
-- select public.get_invitation_context('TOKEN-INVALIDO-TESTE-XXXXXXXX');

-- 6. UNAUTHORIZED EVENT - run separately after tests 1-4.
-- Carlos is invited only to Casamento. Expected:
-- ERROR "Invitation does not have access to this gift list".
-- select *
-- from public.events e
-- cross join lateral public.get_event_gifts(
--   'TESTE-CARLOS-2027-CCCCCCCCCC',
--   e.id
-- ) gifts
-- where e.slug = 'cha-de-casa-nova';
