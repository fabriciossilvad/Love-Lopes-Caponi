-- seed.sql
-- Love, Lopes & Caponi
-- Dados fictícios para desenvolvimento e validação do backend.
--
-- IMPORTANTE:
-- 1. Execute somente em ambiente de desenvolvimento/teste.
-- 2. Os tokens abaixo são deliberadamente previsíveis para facilitar testes.
--    NÃO reutilize estes tokens em convites reais.
-- 3. Este arquivo pressupõe que 001-004 já foram aplicadas.
-- 4. O seed é idempotente para os registros que possuem slugs/tokens/chaves fixos.

begin;

-- ---------------------------------------------------------------------------
-- EVENTOS
-- Datas fictícias futuras apenas para teste.
-- ---------------------------------------------------------------------------

insert into public.events (
  name,
  slug,
  description,
  event_date,
  venue_name,
  address,
  maps_url,
  rsvp_deadline,
  status,
  additional_info
)
values
(
  'Casamento',
  'casamento',
  'Evento fictício usado para validação do sistema.',
  '2027-08-14 18:00:00-03',
  'Espaço Jardim',
  'Endereço fictício - Goiânia, GO',
  null,
  '2027-07-15 23:59:59-03',
  'ACTIVE',
  'Chegar com aproximadamente 30 minutos de antecedência.'
),
(
  'Chá de Casa Nova',
  'cha-de-casa-nova',
  'Evento fictício usado para validação do sistema.',
  '2027-05-22 16:00:00-03',
  'Residência dos noivos',
  'Endereço fictício - Goiânia, GO',
  null,
  '2027-05-10 23:59:59-03',
  'ACTIVE',
  'Evento informal.'
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  event_date = excluded.event_date,
  venue_name = excluded.venue_name,
  address = excluded.address,
  maps_url = excluded.maps_url,
  rsvp_deadline = excluded.rsvp_deadline,
  status = excluded.status,
  additional_info = excluded.additional_info;

-- ---------------------------------------------------------------------------
-- CONTEÚDO DO SITE
-- ---------------------------------------------------------------------------

insert into public.site_contents ("key", value)
values
  ('home.hero_title', 'Love, Lopes & Caponi'),
  ('home.hero_subtitle', 'Estamos nos casando!'),
  ('home.welcome_text', 'Criamos este espaço para compartilhar com vocês um pouco desse momento tão especial.'),
  ('couple.story', 'Este é um texto fictício para testar a seção sobre a história dos noivos.'),
  ('gifts.introduction', 'Escolha um presente disponível e faça sua reserva.'),
  ('footer.message', 'Com carinho, Lopes & Caponi.')
on conflict ("key") do update
set value = excluded.value;

-- ---------------------------------------------------------------------------
-- CATEGORIAS
-- ---------------------------------------------------------------------------

insert into public.gift_categories (
  name,
  slug,
  description,
  display_order,
  active
)
values
  ('Cozinha', 'cozinha', 'Itens para cozinha.', 10, true),
  ('Casa', 'casa', 'Itens gerais para a casa.', 20, true),
  ('Quarto', 'quarto', 'Itens para o quarto.', 30, true),
  ('Experiências', 'experiencias', 'Presentes simbólicos e experiências.', 40, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  active = excluded.active;

-- ---------------------------------------------------------------------------
-- CONVITES
-- Tokens de teste com mais de 24 caracteres.
-- ---------------------------------------------------------------------------

insert into public.invitations (
  display_name,
  token,
  status,
  internal_notes
)
values
(
  'Família Silva',
  'TESTE-FAMILIA-SILVA-2027-AAAA',
  'ACTIVE',
  'Convite fictício para testes.'
),
(
  'João e Ana',
  'TESTE-JOAO-ANA-2027-BBBBBBBB',
  'ACTIVE',
  'Convite fictício para testes.'
),
(
  'Carlos Oliveira',
  'TESTE-CARLOS-2027-CCCCCCCCCC',
  'ACTIVE',
  'Convite fictício para testes.'
)
on conflict (token) do update
set
  display_name = excluded.display_name,
  status = excluded.status,
  internal_notes = excluded.internal_notes;

-- ---------------------------------------------------------------------------
-- CONVIDADOS
-- Evitamos duplicar pelo par invitation_id + name.
-- ---------------------------------------------------------------------------

insert into public.guests (
  invitation_id,
  name,
  status,
  notes
)
select i.id, x.name, 'ACTIVE'::public.guest_status, x.notes
from (
  values
    ('TESTE-FAMILIA-SILVA-2027-AAAA', 'Marcos Silva', 'Responsável pelo convite.'),
    ('TESTE-FAMILIA-SILVA-2027-AAAA', 'Juliana Silva', null),
    ('TESTE-FAMILIA-SILVA-2027-AAAA', 'Pedro Silva', null),

    ('TESTE-JOAO-ANA-2027-BBBBBBBB', 'João Souza', 'Responsável pelo convite.'),
    ('TESTE-JOAO-ANA-2027-BBBBBBBB', 'Ana Souza', null),

    ('TESTE-CARLOS-2027-CCCCCCCCCC', 'Carlos Oliveira', 'Convite individual.')
) as x(token, name, notes)
join public.invitations i on i.token = x.token
where not exists (
  select 1
  from public.guests g
  where g.invitation_id = i.id
    and g.name = x.name
);

-- ---------------------------------------------------------------------------
-- GUEST_EVENT + RSVP inicial
--
-- Família Silva:
--   Marcos   -> Casamento + Chá
--   Juliana  -> Casamento + Chá
--   Pedro    -> somente Casamento
--
-- João e Ana:
--   João     -> Casamento + Chá
--   Ana      -> Casamento + Chá
--
-- Carlos:
--   Carlos   -> somente Casamento
-- ---------------------------------------------------------------------------

insert into public.guest_events (
  guest_id,
  event_id,
  rsvp_status,
  responded_at
)
select
  g.id,
  e.id,
  'PENDING'::public.rsvp_status,
  null
from public.guests g
join public.invitations i
  on i.id = g.invitation_id
join public.events e
  on (
       (i.token = 'TESTE-FAMILIA-SILVA-2027-AAAA'
        and g.name in ('Marcos Silva', 'Juliana Silva')
        and e.slug in ('casamento', 'cha-de-casa-nova'))
    or (i.token = 'TESTE-FAMILIA-SILVA-2027-AAAA'
        and g.name = 'Pedro Silva'
        and e.slug = 'casamento')
    or (i.token = 'TESTE-JOAO-ANA-2027-BBBBBBBB'
        and g.name in ('João Souza', 'Ana Souza')
        and e.slug in ('casamento', 'cha-de-casa-nova'))
    or (i.token = 'TESTE-CARLOS-2027-CCCCCCCCCC'
        and g.name = 'Carlos Oliveira'
        and e.slug = 'casamento')
  )
on conflict (guest_id, event_id) do nothing;

-- ---------------------------------------------------------------------------
-- PRESENTES
-- Presentes separados por evento.
-- Não cadastramos image_path no seed; as imagens serão testadas depois via Storage.
-- ---------------------------------------------------------------------------

insert into public.gifts (
  event_id,
  category_id,
  name,
  description,
  image_path,
  estimated_value,
  quantity,
  status,
  display_order
)
select
  e.id,
  c.id,
  x.name,
  x.description,
  null,
  x.estimated_value,
  x.quantity,
  'ACTIVE'::public.gift_status,
  x.display_order
from (
  values
    ('casamento', 'cozinha', 'Cafeteira', 'Cafeteira elétrica para a casa nova.', 350.00::numeric, 1, 10),
    ('casamento', 'cozinha', 'Jogo de pratos', 'Jogo de pratos para refeições.', 280.00::numeric, 3, 20),
    ('casamento', 'casa', 'Aspirador de pó', 'Aspirador para uso doméstico.', 450.00::numeric, 1, 30),
    ('casamento', 'experiencias', 'Jantar romântico', 'Presente simbólico para um jantar especial.', 200.00::numeric, 2, 40),

    ('cha-de-casa-nova', 'cozinha', 'Jogo de copos', 'Conjunto de copos para a casa nova.', 120.00::numeric, 2, 10),
    ('cha-de-casa-nova', 'casa', 'Kit de organização', 'Kit organizador para a casa.', 100.00::numeric, 2, 20),
    ('cha-de-casa-nova', 'quarto', 'Jogo de cama', 'Jogo de cama para o quarto.', 250.00::numeric, 1, 30)
) as x(event_slug, category_slug, name, description, estimated_value, quantity, display_order)
join public.events e
  on e.slug = x.event_slug
join public.gift_categories c
  on c.slug = x.category_slug
where not exists (
  select 1
  from public.gifts g
  where g.event_id = e.id
    and g.name = x.name
);

commit;

-- ===========================================================================
-- CONSULTAS DE VALIDAÇÃO
-- ===========================================================================
-- Estas consultas não alteram dados. Podem ser executadas após o seed.

-- 1. Eventos
select
  id,
  name,
  slug,
  event_date,
  rsvp_deadline,
  status
from public.events
order by event_date;

-- 2. Convites + convidados
select
  i.display_name as invitation,
  i.token,
  g.name as guest,
  g.status
from public.invitations i
join public.guests g on g.invitation_id = i.id
where i.token like 'TESTE-%'
order by i.display_name, g.name;

-- 3. Convidados por evento + RSVP
select
  i.display_name as invitation,
  g.name as guest,
  e.name as event,
  ge.rsvp_status,
  ge.responded_at
from public.guest_events ge
join public.guests g on g.id = ge.guest_id
join public.invitations i on i.id = g.invitation_id
join public.events e on e.id = ge.event_id
where i.token like 'TESTE-%'
order by i.display_name, g.name, e.event_date;

-- 4. Presentes e quantidade reservada atual
select
  e.name as event,
  c.name as category,
  g.name as gift,
  g.quantity,
  count(gr.id) filter (
    where gr.status = 'ACTIVE'::public.gift_reservation_status
  ) as reserved,
  g.quantity - count(gr.id) filter (
    where gr.status = 'ACTIVE'::public.gift_reservation_status
  ) as available
from public.gifts g
join public.events e on e.id = g.event_id
join public.gift_categories c on c.id = g.category_id
left join public.gift_reservations gr on gr.gift_id = g.id
where e.slug in ('casamento', 'cha-de-casa-nova')
group by e.name, e.event_date, c.name, g.name, g.quantity, g.display_order
order by e.event_date, g.display_order;