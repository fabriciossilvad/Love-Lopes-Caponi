# Arquitetura e segurança — decisões do Estágio 1

## Direção arquitetural

```text
Frontend
   │
   ▼
Backend / API
   │
   ▼
Supabase
├── PostgreSQL
├── Auth
├── Storage
└── funções/RPC
```

A aplicação pública não deve receber acesso irrestrito às tabelas sensíveis. O backend do Estágio 2 será a camada principal de contratos HTTP, validação, autorização e orquestração.

## Supabase

O Supabase foi adotado para:
- PostgreSQL;
- autenticação administrativa;
- Storage;
- Row Level Security;
- funções transacionais/RPC.

## RLS

RLS foi habilitado nas tabelas do domínio.

Leitura pública controlada foi prevista para:
- `events` ativos;
- `gift_categories` ativas;
- `gifts` ativos pertencentes a eventos ativos;
- `photos` ativas;
- `site_contents`.

Sem leitura pública direta:
- `invitations`;
- `guests`;
- `guest_events`;
- `gift_reservations`;
- `admin_users`.

Administradores ativos recebem políticas CRUD por meio de `private.is_active_admin()`.

## Autenticação administrativa

- Credenciais são gerenciadas pelo Supabase Auth.
- `admin_users.id` referencia `auth.users.id`.
- Não armazenamos senha em `admin_users`.
- O bootstrap do primeiro administrador foi realizado manualmente pelo Dashboard/SQL.
- Papel inicial: `ADMIN`.

## Acesso dos convidados

Convidados não possuem sessão Supabase individual. O token do convite é uma credencial de acesso limitada ao convite. Por isso, operações como RSVP e reserva não devem depender de SELECT público nas tabelas sensíveis.

## Concorrência de reservas

A reserva do presente é executada por função no banco com controle transacional/lock para que duas solicitações concorrentes não consumam a mesma última unidade.

## Storage

Buckets definidos:
- `wedding-gallery` — imagens da galeria, limite de 10 MB;
- `gift-images` — imagens dos presentes, limite de 5 MB.

Tipos permitidos: JPEG, PNG, WebP e AVIF.

Os buckets servem arquivos publicamente, enquanto upload, alteração, exclusão e operações administrativas de objetos ficam restritos a administradores ativos.

## Segredos e repositório

Nunca versionar:
- `.env` real;
- `SUPABASE_SERVICE_ROLE_KEY`;
- senhas e tokens de autenticação;
- certificados/chaves privadas;
- tokens reais de convites;
- dados pessoais reais de convidados;
- dumps de produção.

O repositório mantém apenas `.env.example` sem valores secretos.

## Privacidade

A identidade de quem reservou presente é administrativa. O catálogo público pode informar disponibilidade, mas não deve expor `invitation_id`, `guest_id`, nome ou outros dados do responsável pela reserva.
