-- Love, Lopes & Caponi
-- Migration 001: Initial schema

create extension if not exists pgcrypto;

create type public.event_status as enum ('DRAFT', 'ACTIVE', 'FINISHED');
create type public.invitation_status as enum ('ACTIVE', 'DISABLED');
create type public.guest_status as enum ('ACTIVE', 'INACTIVE');
create type public.rsvp_status as enum ('PENDING', 'CONFIRMED', 'DECLINED');
create type public.gift_status as enum ('ACTIVE', 'INACTIVE');
create type public.gift_reservation_status as enum ('ACTIVE', 'CANCELLED');
create type public.admin_role as enum ('ADMIN');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  event_date timestamptz not null,
  venue_name text,
  address text,
  maps_url text,
  rsvp_deadline timestamptz,
  status public.event_status not null default 'DRAFT',
  additional_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_name_not_blank check (btrim(name) <> ''),
  constraint events_slug_not_blank check (btrim(slug) <> ''),
  constraint events_rsvp_before_event check (rsvp_deadline is null or rsvp_deadline <= event_date)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  token text not null unique,
  status public.invitation_status not null default 'ACTIVE',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_display_name_not_blank check (btrim(display_name) <> ''),
  constraint invitations_token_not_blank check (btrim(token) <> ''),
  constraint invitations_token_min_length check (char_length(token) >= 24)
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete restrict,
  name text not null,
  phone text,
  email text,
  notes text,
  status public.guest_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guests_name_not_blank check (btrim(name) <> '')
);

create table public.guest_events (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  rsvp_status public.rsvp_status not null default 'PENDING',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_events_guest_event_unique unique (guest_id, event_id),
  constraint guest_events_response_consistency check (
    (rsvp_status = 'PENDING' and responded_at is null)
    or (rsvp_status in ('CONFIRMED', 'DECLINED') and responded_at is not null)
  )
);

create table public.gift_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_categories_name_not_blank check (btrim(name) <> ''),
  constraint gift_categories_slug_not_blank check (btrim(slug) <> ''),
  constraint gift_categories_display_order_nonnegative check (display_order >= 0)
);

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  category_id uuid references public.gift_categories(id) on delete set null,
  name text not null,
  description text,
  image_path text,
  estimated_value numeric(12,2),
  quantity integer not null default 1,
  status public.gift_status not null default 'ACTIVE',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gifts_name_not_blank check (btrim(name) <> ''),
  constraint gifts_estimated_value_nonnegative check (estimated_value is null or estimated_value >= 0),
  constraint gifts_quantity_positive check (quantity > 0),
  constraint gifts_display_order_nonnegative check (display_order >= 0)
);

create table public.gift_reservations (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete restrict,
  invitation_id uuid not null references public.invitations(id) on delete restrict,
  guest_id uuid references public.guests(id) on delete restrict,
  status public.gift_reservation_status not null default 'ACTIVE',
  reserved_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_reservations_status_dates_consistency check (
    (status = 'ACTIVE' and cancelled_at is null)
    or (status = 'CANCELLED' and cancelled_at is not null)
  )
);

create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.admin_role not null default 'ADMIN',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_name_not_blank check (btrim(name) <> '')
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  storage_path text not null,
  caption text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photos_storage_path_not_blank check (btrim(storage_path) <> ''),
  constraint photos_display_order_nonnegative check (display_order >= 0)
);

create table public.site_contents (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_contents_key_not_blank check (btrim(key) <> '')
);

-- Query-path indexes. Unique constraints already create indexes for token, slug, and guest/event.
create index guests_invitation_id_idx on public.guests(invitation_id);
create index guest_events_event_id_idx on public.guest_events(event_id);
create index gifts_event_id_idx on public.gifts(event_id);
create index gifts_category_id_idx on public.gifts(category_id);
create index gifts_event_status_order_idx on public.gifts(event_id, status, display_order);
create index gift_reservations_gift_status_idx on public.gift_reservations(gift_id, status);
create index gift_reservations_invitation_id_idx on public.gift_reservations(invitation_id);
create index gift_reservations_guest_id_idx on public.gift_reservations(guest_id) where guest_id is not null;
create index photos_event_order_idx on public.photos(event_id, display_order);

-- RLS is enabled immediately so an accidentally exposed public schema is deny-by-default.
-- Policies/grants are intentionally defined in a later migration.
alter table public.events enable row level security;
alter table public.invitations enable row level security;
alter table public.guests enable row level security;
alter table public.guest_events enable row level security;
alter table public.gift_categories enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_reservations enable row level security;
alter table public.admin_users enable row level security;
alter table public.photos enable row level security;
alter table public.site_contents enable row level security;