# Modelo de dados e relações — Estágio 1

## Visão conceitual

```text
INVITATION 1 ───── N GUEST
                       │
                       │ N
                       │
                       N
                     EVENT
                       │
                       │ 1
                       │
                       N
                      GIFT N ───── 1 GIFT_CATEGORY
                       │
                       │ 1
                       │
                       N
                GIFT_RESERVATION
                       │
                       N
                       │
                       1
                  INVITATION

GUEST N ───── N EVENT
       via GUEST_EVENT

ADMIN_USER ── auth.users
PHOTO ─────── EVENT (opcional)
SITE_CONTENT ─ independente
PAYMENT ───── GIFT_RESERVATION (futuro)
```

## Entidades

### `events`
Representa cada evento. Campos centrais: `id`, `name`, `slug`, `description`, `event_date`, dados do local, `rsvp_deadline`, `status` e informações adicionais.

### `invitations`
Agrupa uma ou mais pessoas sob um convite. Possui `token` público único e status próprio.

### `guests`
Representa uma pessoa convidada. Cada registro possui `invitation_id` obrigatório, estabelecendo a relação **Invitation 1:N Guest**.

### `guest_events`
Entidade associativa entre `guests` e `events`. Resolve a relação N:N e armazena o estado de RSVP. A combinação `guest_id + event_id` é única.

### `gift_categories`
Categorias reutilizáveis entre eventos.

### `gifts`
Presente pertencente a um evento e a uma categoria. Possui quantidade total, mas não persiste quantidade disponível.

### `gift_reservations`
Representa a reserva de uma unidade. Relaciona presente e convite e pode apontar para um convidado específico. Mantém status e datas de reserva/cancelamento.

### `admin_users`
Perfil administrativo cujo `id` referencia o usuário correspondente do Supabase Auth (`auth.users`).

### `photos`
Metadados de imagens armazenadas no Storage. O vínculo com evento é opcional, permitindo também imagens globais do site.

### `site_contents`
Conteúdo textual configurável por chave única.

### `payments` — futuro
Não implementado no MVP. A futura tabela deverá referenciar `gift_reservation_id`, preservando a independência entre reserva e pagamento.

## Cardinalidades principais

| Origem | Relação | Destino | Observação |
|---|---|---|---|
| Invitation | 1:N | Guest | Cada convidado pertence a um único convite |
| Guest | N:N | Event | Resolvida por `guest_events` |
| Event | 1:N | Gift | Presentes são separados por evento |
| Gift Category | 1:N | Gift | Categorias são globais |
| Gift | 1:N | Gift Reservation | Cada reserva ativa consome uma unidade |
| Invitation | 1:N | Gift Reservation | Identidade interna da reserva |
| Guest | 1:N opcional | Gift Reservation | Identificação individual opcional |
| Event | 1:N opcional | Photo | Foto pode ser global quando `event_id` é nulo |
| auth.users | 1:0..1 | Admin User | Perfil administrativo |
| Gift Reservation | 1:N/1:1 futuro | Payment | A definir quando pagamentos entrarem no escopo |

## Decisões de modelagem

### Disponibilidade derivada
`available = gift.quantity - ACTIVE reservations`. Evita inconsistência causada por manter dois contadores mutáveis.

### Histórico de reservas
Cancelamentos alteram status e registram `cancelled_at`; registros não são apagados.

### RSVP na relação
O RSVP pertence à participação de uma pessoa em um evento, portanto fica em `guest_events`, e não em `guests` ou `invitations`.

### UUIDs
Entidades usam UUIDs para evitar identificadores sequenciais previsíveis e facilitar integração com Supabase.

### Tokens
O token do convite é uma credencial pública separada do UUID interno.

## Índices relevantes

Foram previstos índices para token de convite, convidados por convite, relações convidado/evento, presentes por evento/categoria e reservas por presente/status e convite.
