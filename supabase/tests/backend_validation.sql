-- backend_validation.sql
-- Love, Lopes & Caponi
-- Validação integrada do backend após migrations 001-004 + seed.sql.
--
-- IMPORTANTE:
-- - Execute em ambiente de desenvolvimento/teste.
-- - Este arquivo usa os tokens e dados fictícios do seed.sql.
-- - Os testes principais rodam dentro de uma transação e terminam com ROLLBACK,
--   portanto não deixam RSVP/reservas de teste persistidos.
-- - Testes reais de RLS como anon/authenticated devem ser feitos pela API/client,
--   pois o SQL Editor possui privilégios elevados.

begin;

-- ============================================================================
-- 0. PRÉ-CHECAGEM
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from public.invitations
    where token = 'TESTE-FAMILIA-SILVA-2027-AAAA'
  ) then
    raise exception 'Seed ausente: convite Família Silva não encontrado.';
  end if;

  if not exists (
    select 1
    from public.invitations
    where token = 'TESTE-JOAO-ANA-2027-BBBBBBBB'
  ) then
    raise exception 'Seed ausente: convite João e Ana não encontrado.';
  end if;

  if not exists (
    select 1
    from public.gifts g
    join public.events e on e.id = g.event_id
    where e.slug = 'casamento'
      and g.name = 'Cafeteira'
  ) then
    raise exception 'Seed ausente: presente Cafeteira do Casamento não encontrado.';
  end if;
end
$$;

select '00 - Pré-checagem concluída' as test,
       'OK' as result;

-- ============================================================================
-- 1. ESTADO INICIAL DO RSVP
-- ============================================================================

select
  '01 - Estado inicial RSVP' as test,
  i.display_name as invitation,
  g.name as guest,
  e.name as event,
  ge.rsvp_status,
  ge.responded_at
from public.guest_events ge
join public.guests g on g.id = ge.guest_id
join public.invitations i on i.id = g.invitation_id
join public.events e on e.id = ge.event_id
where i.token = 'TESTE-FAMILIA-SILVA-2027-AAAA'
  and g.name = 'Marcos Silva'
  and e.slug = 'casamento';

-- ============================================================================
-- 2. DESCOBRIR ASSINATURAS DAS RPCs
-- Útil para confirmar exatamente o que está instalado no banco.
-- ============================================================================

select
  '02 - RPC instalada' as test,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'set_rsvp',
    'reserve_gift',
    'cancel_gift_reservation'
  )
order by p.proname;

-- ============================================================================
-- 3. TESTE DE RSVP VÁLIDO
--
-- Em vez de assumir os nomes dos parâmetros, chamamos a RPC dinamicamente
-- com base nos tipos da função instalada pela migration 002.
-- Esperado:
-- Marcos Silva / Casamento -> CONFIRMED
-- ============================================================================

do $$
declare
  v_token text := 'TESTE-FAMILIA-SILVA-2027-AAAA';
  v_guest_id uuid;
  v_event_id uuid;
  v_sql text;
  v_args text;
  v_proc oid;
begin
  select g.id
    into v_guest_id
  from public.guests g
  join public.invitations i on i.id = g.invitation_id
  where i.token = v_token
    and g.name = 'Marcos Silva';

  select id
    into v_event_id
  from public.events
  where slug = 'casamento';

  select p.oid
    into v_proc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'set_rsvp'
  order by p.oid desc
  limit 1;

  if v_proc is null then
    raise exception 'RPC public.set_rsvp não encontrada.';
  end if;

  -- A migration esperada possui parâmetros compatíveis com:
  -- token (text), guest_id (uuid), event_id (uuid), status (enum/text).
  -- Aqui usamos chamada posicional para evitar dependência dos nomes.
  v_sql := format(
    'select public.set_rsvp(%L, %L::uuid, %L::uuid, %L)',
    v_token,
    v_guest_id,
    v_event_id,
    'CONFIRMED'
  );

  begin
    execute v_sql;
  exception
    when undefined_function or datatype_mismatch then
      raise exception
        'A assinatura de set_rsvp difere do esperado. Veja o resultado do teste 02 e ajuste a chamada. Erro original: %',
        SQLERRM;
  end;
end
$$;

select
  '03 - RSVP válido' as test,
  g.name as guest,
  e.name as event,
  ge.rsvp_status,
  case
    when ge.rsvp_status::text = 'CONFIRMED' then 'OK'
    else 'FALHOU'
  end as result
from public.guest_events ge
join public.guests g on g.id = ge.guest_id
join public.invitations i on i.id = g.invitation_id
join public.events e on e.id = ge.event_id
where i.token = 'TESTE-FAMILIA-SILVA-2027-AAAA'
  and g.name = 'Marcos Silva'
  and e.slug = 'casamento';

-- ============================================================================
-- 4. RSVP COM TOKEN DE OUTRO CONVITE
--
-- Tentamos alterar Carlos usando o token da Família Silva.
-- ESPERADO: a RPC deve rejeitar.
-- O bloco captura o erro para que o restante dos testes continue.
-- ============================================================================

do $$
declare
  v_wrong_token text := 'TESTE-FAMILIA-SILVA-2027-AAAA';
  v_guest_id uuid;
  v_event_id uuid;
  v_rejected boolean := false;
begin
  select g.id
    into v_guest_id
  from public.guests g
  join public.invitations i on i.id = g.invitation_id
  where i.token = 'TESTE-CARLOS-2027-CCCCCCCCCC'
    and g.name = 'Carlos Oliveira';

  select id into v_event_id
  from public.events
  where slug = 'casamento';

  begin
    execute format(
      'select public.set_rsvp(%L, %L::uuid, %L::uuid, %L)',
      v_wrong_token,
      v_guest_id,
      v_event_id,
      'CONFIRMED'
    );
  exception
    when others then
      v_rejected := true;
      raise notice 'OK: RSVP indevido foi rejeitado: %', SQLERRM;
  end;

  if not v_rejected then
    raise exception
      'FALHA DE SEGURANÇA: set_rsvp aceitou alteração de convidado pertencente a outro convite.';
  end if;
end
$$;

select '04 - Token não pode alterar outro convite' as test,
       'OK - operação indevida rejeitada' as result;

-- ============================================================================
-- 5. ESTADO INICIAL DA CAFETEIRA
-- Esperado no seed: quantity = 1 e nenhuma reserva ACTIVE.
-- ============================================================================

select
  '05 - Disponibilidade inicial' as test,
  g.id as gift_id,
  g.name,
  g.quantity,
  count(gr.id) filter (where gr.status::text = 'ACTIVE') as reserved,
  g.quantity - count(gr.id) filter (
    where gr.status::text = 'ACTIVE'
  ) as available
from public.gifts g
join public.events e on e.id = g.event_id
left join public.gift_reservations gr on gr.gift_id = g.id
where e.slug = 'casamento'
  and g.name = 'Cafeteira'
group by g.id, g.name, g.quantity;

-- ============================================================================
-- 6. RESERVA VÁLIDA
--
-- Família Silva reserva a Cafeteira.
-- A RPC é chamada de forma posicional conforme o contrato esperado da 002:
-- reserve_gift(token, gift_id, guest_id opcional)
-- ============================================================================

do $$
declare
  v_token text := 'TESTE-FAMILIA-SILVA-2027-AAAA';
  v_gift_id uuid;
  v_guest_id uuid;
begin
  select g.id
    into v_gift_id
  from public.gifts g
  join public.events e on e.id = g.event_id
  where e.slug = 'casamento'
    and g.name = 'Cafeteira';

  select g.id
    into v_guest_id
  from public.guests g
  join public.invitations i on i.id = g.invitation_id
  where i.token = v_token
    and g.name = 'Marcos Silva';

  begin
    execute format(
      'select public.reserve_gift(%L, %L::uuid, %L::uuid)',
      v_token,
      v_gift_id,
      v_guest_id
    );
  exception
    when undefined_function or datatype_mismatch then
      raise exception
        'A assinatura de reserve_gift difere do esperado. Veja o resultado do teste 02. Erro original: %',
        SQLERRM;
  end;
end
$$;

select
  '06 - Reserva válida' as test,
  g.name as gift,
  gr.status,
  i.display_name as reserved_by_invitation,
  case
    when gr.status::text = 'ACTIVE' then 'OK'
    else 'FALHOU'
  end as result
from public.gift_reservations gr
join public.gifts g on g.id = gr.gift_id
join public.events e on e.id = g.event_id
join public.invitations i on i.id = gr.invitation_id
where e.slug = 'casamento'
  and g.name = 'Cafeteira'
  and i.token = 'TESTE-FAMILIA-SILVA-2027-AAAA'
order by gr.reserved_at desc
limit 1;

-- ============================================================================
-- 7. PRESENTE ESGOTADO
--
-- João e Ana tentam reservar a mesma Cafeteira (quantity = 1).
-- ESPERADO: rejeição.
-- ============================================================================

do $$
declare
  v_token text := 'TESTE-JOAO-ANA-2027-BBBBBBBB';
  v_gift_id uuid;
  v_guest_id uuid;
  v_rejected boolean := false;
begin
  select g.id
    into v_gift_id
  from public.gifts g
  join public.events e on e.id = g.event_id
  where e.slug = 'casamento'
    and g.name = 'Cafeteira';

  select g.id
    into v_guest_id
  from public.guests g
  join public.invitations i on i.id = g.invitation_id
  where i.token = v_token
    and g.name = 'João Souza';

  begin
    execute format(
      'select public.reserve_gift(%L, %L::uuid, %L::uuid)',
      v_token,
      v_gift_id,
      v_guest_id
    );
  exception
    when others then
      v_rejected := true;
      raise notice 'OK: segunda reserva foi rejeitada: %', SQLERRM;
  end;

  if not v_rejected then
    raise exception
      'FALHA DE REGRA: foi possível reservar a Cafeteira mesmo com quantity = 1 e uma reserva ativa.';
  end if;
end
$$;

select '07 - Presente esgotado bloqueia segunda reserva' as test,
       'OK - segunda reserva rejeitada' as result;

-- ============================================================================
-- 8. CANCELAMENTO DA RESERVA
--
-- Localizamos a reserva ativa da Família Silva e chamamos:
-- cancel_gift_reservation(token, reservation_id)
-- ============================================================================

do $$
declare
  v_token text := 'TESTE-FAMILIA-SILVA-2027-AAAA';
  v_reservation_id uuid;
begin
  select gr.id
    into v_reservation_id
  from public.gift_reservations gr
  join public.gifts g on g.id = gr.gift_id
  join public.events e on e.id = g.event_id
  join public.invitations i on i.id = gr.invitation_id
  where e.slug = 'casamento'
    and g.name = 'Cafeteira'
    and i.token = v_token
    and gr.status::text = 'ACTIVE'
  order by gr.reserved_at desc
  limit 1;

  if v_reservation_id is null then
    raise exception 'Reserva ativa da Família Silva não encontrada.';
  end if;

  begin
    execute format(
      'select public.cancel_gift_reservation(%L, %L::uuid)',
      v_token,
      v_reservation_id
    );
  exception
    when undefined_function or datatype_mismatch then
      raise exception
        'A assinatura de cancel_gift_reservation difere do esperado. Veja o teste 02. Erro original: %',
        SQLERRM;
  end;
end
$$;

select
  '08 - Cancelamento' as test,
  gr.status,
  gr.cancelled_at,
  case
    when gr.status::text = 'CANCELLED'
         and gr.cancelled_at is not null
    then 'OK'
    else 'FALHOU'
  end as result
from public.gift_reservations gr
join public.gifts g on g.id = gr.gift_id
join public.events e on e.id = g.event_id
join public.invitations i on i.id = gr.invitation_id
where e.slug = 'casamento'
  and g.name = 'Cafeteira'
  and i.token = 'TESTE-FAMILIA-SILVA-2027-AAAA'
order by gr.reserved_at desc
limit 1;

-- ============================================================================
-- 9. PRESENTE VOLTA A FICAR DISPONÍVEL
-- ============================================================================

select
  '09 - Disponibilidade após cancelamento' as test,
  g.name,
  g.quantity,
  count(gr.id) filter (where gr.status::text = 'ACTIVE') as reserved,
  g.quantity - count(gr.id) filter (
    where gr.status::text = 'ACTIVE'
  ) as available,
  case
    when (
      g.quantity - count(gr.id) filter (
        where gr.status::text = 'ACTIVE'
      )
    ) = 1 then 'OK'
    else 'FALHOU'
  end as result
from public.gifts g
join public.events e on e.id = g.event_id
left join public.gift_reservations gr on gr.gift_id = g.id
where e.slug = 'casamento'
  and g.name = 'Cafeteira'
group by g.id, g.name, g.quantity;

-- ============================================================================
-- 10. JOÃO CONSEGUE RESERVAR APÓS O CANCELAMENTO
-- ============================================================================

do $$
declare
  v_token text := 'TESTE-JOAO-ANA-2027-BBBBBBBB';
  v_gift_id uuid;
  v_guest_id uuid;
begin
  select g.id
    into v_gift_id
  from public.gifts g
  join public.events e on e.id = g.event_id
  where e.slug = 'casamento'
    and g.name = 'Cafeteira';

  select g.id
    into v_guest_id
  from public.guests g
  join public.invitations i on i.id = g.invitation_id
  where i.token = v_token
    and g.name = 'João Souza';

  execute format(
    'select public.reserve_gift(%L, %L::uuid, %L::uuid)',
    v_token,
    v_gift_id,
    v_guest_id
  );
end
$$;

select
  '10 - Reserva após liberação' as test,
  i.display_name as invitation,
  g.name as gift,
  gr.status,
  case
    when i.token = 'TESTE-JOAO-ANA-2027-BBBBBBBB'
         and gr.status::text = 'ACTIVE'
    then 'OK'
    else 'FALHOU'
  end as result
from public.gift_reservations gr
join public.gifts g on g.id = gr.gift_id
join public.events e on e.id = g.event_id
join public.invitations i on i.id = gr.invitation_id
where e.slug = 'casamento'
  and g.name = 'Cafeteira'
  and gr.status::text = 'ACTIVE'
order by gr.reserved_at desc
limit 1;

-- ============================================================================
-- 11. CONSISTÊNCIA guest_id x invitation_id
--
-- Conferimos se existe alguma reserva cujo guest pertence a outro convite.
-- Esperado: 0.
-- ============================================================================

select
  '11 - Consistência guest/invitation' as test,
  count(*) as inconsistent_rows,
  case when count(*) = 0 then 'OK' else 'FALHOU' end as result
from public.gift_reservations gr
join public.guests guest on guest.id = gr.guest_id
where gr.guest_id is not null
  and guest.invitation_id <> gr.invitation_id;

-- ============================================================================
-- 12. CHECK DAS POLICIES IMPORTANTES
-- Isso verifica a existência/configuração das policies, NÃO substitui teste real
-- via API com role anon/authenticated.
-- ============================================================================

select
  '12 - Policies' as test,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'events',
    'invitations',
    'guests',
    'guest_events',
    'gifts',
    'gift_reservations',
    'admin_users',
    'objects'
  )
order by schemaname, tablename, policyname;

-- ============================================================================
-- 13. RLS HABILITADO NAS TABELAS SENSÍVEIS
-- Esperado: rowsecurity = true em todas.
-- ============================================================================

select
  '13 - RLS habilitado' as test,
  c.relname as table_name,
  c.relrowsecurity as rowsecurity,
  case when c.relrowsecurity then 'OK' else 'FALHOU' end as result
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'invitations',
    'guests',
    'guest_events',
    'gift_reservations',
    'admin_users'
  )
order by c.relname;

-- ============================================================================
-- 14. RESUMO DO ESTADO DENTRO DO TESTE
-- ============================================================================

select
  '14 - Resumo' as test,
  (select count(*) from public.events) as events,
  (select count(*) from public.invitations where token like 'TESTE-%') as test_invitations,
  (
    select count(*)
    from public.guests g
    join public.invitations i on i.id = g.invitation_id
    where i.token like 'TESTE-%'
  ) as test_guests,
  (
    select count(*)
    from public.gift_reservations gr
    join public.invitations i on i.id = gr.invitation_id
    where i.token like 'TESTE-%'
      and gr.status::text = 'ACTIVE'
  ) as active_test_reservations;

-- ============================================================================
-- RESTAURAÇÃO
--
-- Todo RSVP e reserva realizados acima são descartados.
-- O banco volta ao estado anterior ao início deste arquivo.
-- ============================================================================

rollback;

-- ============================================================================
-- TESTES QUE AINDA DEVEM SER FEITOS FORA DO SQL EDITOR
-- ============================================================================
--
-- A) ANON:
--    - SELECT em events/gifts ativos deve funcionar.
--    - SELECT direto em invitations deve falhar/não retornar linhas.
--    - SELECT direto em guests deve falhar/não retornar linhas.
--    - SELECT direto em guest_events deve falhar/não retornar linhas.
--    - SELECT direto em gift_reservations deve falhar/não retornar linhas.
--    - Não deve ser possível descobrir quem reservou um presente.
--
-- B) AUTHENTICATED + ADMIN:
--    - Login com usuário presente em public.admin_users e active=true.
--    - CRUD administrativo deve funcionar.
--
-- C) AUTHENTICATED + NÃO ADMIN:
--    - Usuário autenticado sem registro ativo em admin_users.
--    - Não deve obter acesso às tabelas sensíveis nem CRUD administrativo.
--
-- Esses testes devem ser feitos pela aplicação/Supabase client para que
-- auth.uid(), JWT roles e RLS sejam exercitados de verdade.