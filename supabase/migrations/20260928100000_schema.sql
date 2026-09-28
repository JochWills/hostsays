-- HostSays schema. Source: docs/05-data-model.md.
-- All money is integer cents (ZAR).
--
-- Deviations from the doc (recorded in docs/05-data-model.md):
--   * Private host/operator fields live in 1:1 tables (host_private, operator_private) so the
--     public tables can be read by anyone without leaking contact details or commission rates.
--   * Host bank details live in their own table (host_bank_details).
--   * operators.is_demo flags seed/placeholder operators; hosts/experiences.featured_rank drives the homepage.

-- ---------- Enums ----------
create type public.user_role as enum ('admin', 'host', 'operator');
create type public.host_type as enum ('guesthouse', 'bnb', 'self_catering', 'airbnb', 'hotel', 'lodge', 'other');
create type public.approval_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.listing_status as enum ('draft', 'pending_review', 'live', 'paused', 'rejected');
create type public.category as enum ('safari', 'ocean', 'adventure', 'food', 'culture', 'wellness');
create type public.booking_status as enum (
  'requested', 'confirmed', 'paid', 'completed', 'no_show',
  'declined', 'expired', 'payment_expired',
  'cancelled_by_guest_request',   -- guest cancelled before paying
  'cancelled_guest_refunded',     -- guest cancelled 7+ days before, deposit refunded
  'cancelled_guest_late',         -- guest cancelled within 7 days, deposit kept
  'cancelled_by_operator'         -- operator cancelled after payment, deposit refunded
);
create type public.attribution_source as enum ('storefront', 'ref_link', 'selected', 'none');
create type public.commission_status as enum ('none', 'pending', 'payable', 'paid', 'void');
create type public.payout_status as enum ('draft', 'exported', 'paid');

-- ---------- Private helper schema (not exposed through the Data API) ----------
create schema if not exists private;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- ---------- Areas ----------
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- e.g. 'gqeberha', 'addo'
  name text not null,
  intro text,                             -- SEO intro copy
  hero_image_path text,
  sort_order int not null default 0,
  is_live boolean not null default false, -- only show when it has live listings
  constraint areas_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40)
);

-- ---------- Hosts ----------
create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- storefront URL; must not clash with areas/reserved slugs
  name text not null,
  type public.host_type not null,
  area_id uuid references public.areas,
  photo_path text,
  welcome_note text,
  status public.approval_status not null default 'pending',
  featured_rank smallint,                 -- homepage "Hosts who know the area"; null = not featured
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint hosts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40)
);
create index on public.hosts (area_id);

-- Contact, verification and commission details: host members and admins only.
create table public.host_private (
  host_id uuid primary key references public.hosts on delete cascade,
  listing_url text not null,              -- Booking.com / Airbnb / website used for verification
  contact_email text not null,
  contact_phone text,
  commission_rate numeric(5,4) not null default 0.06 -- founding host rate (lib/config.ts HOST_COMMISSION_RATE)
    check (commission_rate >= 0 and commission_rate <= 0.10)
);

-- Sensitive: host members and admins only.
create table public.host_bank_details (
  host_id uuid primary key references public.hosts on delete cascade,
  account_name text not null,
  bank_name text not null,
  account_number text not null,
  branch_code text not null,
  confirmed boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger host_bank_details_updated_at before update on public.host_bank_details
  for each row execute function private.set_updated_at();

create table public.host_members (       -- staff logins (hotels)
  host_id uuid not null references public.hosts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  is_owner boolean not null default false,
  primary key (host_id, user_id)
);
create index on public.host_members (user_id);

-- ---------- Operators ----------
create table public.operators (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  area_id uuid references public.areas,
  description text,
  website text,
  logo_path text,
  status public.approval_status not null default 'pending',
  is_demo boolean not null default false, -- seed placeholder until the real operator agrees
  created_at timestamptz not null default now(),
  constraint operators_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60)
);
create index on public.operators (area_id);

-- Contact and agreement details: operator members and admins only.
create table public.operator_private (
  operator_id uuid primary key references public.operators on delete cascade,
  contact_email text not null,            -- booking request emails go here
  contact_phone text,
  terms_accepted_at timestamptz,          -- must be set before listings go live
  created_by_admin boolean not null default false,
  claimed_at timestamptz
);

create table public.operator_members (
  operator_id uuid not null references public.operators on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  is_owner boolean not null default false,
  primary key (operator_id, user_id)
);
create index on public.operator_members (user_id);

-- ---------- Experiences ----------
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators,
  slug text unique not null,
  title text not null,
  summary text not null,                  -- 1–2 lines for cards
  description text not null,
  category public.category not null,
  area_id uuid not null references public.areas,
  duration_minutes int not null check (duration_minutes > 0),
  price_cents int not null check (price_cents >= 0), -- per person unless is_group_price
  is_group_price boolean not null default false,
  min_people int not null default 1 check (min_people >= 1),
  max_people int not null,
  included text[] not null default '{}',
  what_to_bring text[] not null default '{}',
  meeting_point text not null,
  meeting_point_map_url text,
  operator_cancellation_terms text,       -- operator's own terms for the balance
  status public.listing_status not null default 'draft',
  pending_changes jsonb,                  -- edits awaiting admin approval for live listings
  featured_rank smallint,                 -- homepage "Most recommended by hosts"; null = not featured
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  constraint experiences_people check (max_people >= min_people)
);
create index on public.experiences (operator_id);
create index on public.experiences (area_id, category) where status = 'live';
create trigger experiences_updated_at before update on public.experiences
  for each row execute function private.set_updated_at();

create table public.experience_photos (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences on delete cascade,
  path text not null,
  alt text not null,
  sort_order int not null default 0
);
create index on public.experience_photos (experience_id, sort_order);

-- ---------- Availability ----------
create table public.experience_slots (   -- weekly recurring
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  capacity int not null check (capacity > 0),
  unique (experience_id, weekday, start_time)
);

create table public.experience_blackouts (
  experience_id uuid not null references public.experiences on delete cascade,
  date date not null,
  reason text,
  primary key (experience_id, date)
);

-- ---------- Recommendations ----------
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts on delete cascade,
  experience_id uuid not null references public.experiences on delete cascade,
  tip text not null check (char_length(tip) between 1 and 200), -- lib/config.ts TIP_MAX_LENGTH
  sort_order int not null default 0,
  is_hidden boolean not null default false, -- admin moderation
  created_at timestamptz not null default now(),
  unique (host_id, experience_id)
);
create index on public.recommendations (experience_id);

-- ---------- Payouts (before bookings, which reference them) ----------
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts,
  period_month date not null check (extract(day from period_month) = 1), -- first day of the month covered
  amount_cents int not null check (amount_cents >= 0),
  booking_count int not null check (booking_count >= 0),
  status public.payout_status not null default 'draft',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (host_id, period_month)
);

-- ---------- Bookings ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,         -- human ref e.g. 'HS-4F7K2'
  token text unique not null,             -- 32+ random bytes, base64url; guest access
  experience_id uuid not null references public.experiences,
  operator_id uuid not null references public.operators, -- denormalised for RLS
  date date not null,
  start_time time not null,
  people int not null check (people >= 1),
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  guest_notes text,
  host_id uuid references public.hosts,   -- credited host (null = none)
  attribution public.attribution_source not null default 'none',
  -- money snapshot at request time (never recompute from current prices)
  unit_price_cents int not null check (unit_price_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  deposit_cents int not null check (deposit_cents >= 0),
  host_commission_cents int not null default 0 check (host_commission_cents >= 0),
  platform_cents int not null check (platform_cents >= 0),
  balance_cents int not null check (balance_cents >= 0),
  host_commission_status public.commission_status not null default 'none',
  status public.booking_status not null default 'requested',
  respond_by timestamptz not null,        -- created_at + CONFIRM_WINDOW_HOURS
  pay_by timestamptz,                     -- confirmed_at + PAYMENT_WINDOW_HOURS
  confirmed_at timestamptz,
  paid_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  decline_reason text,
  cancel_reason text,
  cancelled_for_weather boolean not null default false,
  alternative_date date,                  -- operator's suggestion when declining
  payout_id uuid references public.payouts,
  created_at timestamptz not null default now(),
  -- The numbers must always add up (docs/02-business-rules.md).
  constraint bookings_deposit_plus_balance check (deposit_cents + balance_cents = total_cents),
  constraint bookings_commission_plus_platform check (host_commission_cents + platform_cents = deposit_cents),
  constraint bookings_no_host_no_commission check (host_id is not null or host_commission_cents = 0),
  constraint bookings_token_length check (char_length(token) >= 43)
);
create index on public.bookings (operator_id, status);
create index on public.bookings (host_id, status);
create index on public.bookings (date);
create index on public.bookings (experience_id, date, start_time) where status in ('confirmed', 'paid');
create index on public.bookings (status, respond_by) where status = 'requested';
create index on public.bookings (status, pay_by) where status = 'confirmed';

-- ---------- Payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings,
  paystack_reference text unique not null,
  amount_cents int not null check (amount_cents >= 0),
  status text not null check (status in ('initialized', 'success', 'failed', 'refunded', 'refund_pending')),
  paystack_fee_cents int,
  raw jsonb,                              -- webhook payload
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.payments (booking_id);

-- ---------- Reviews ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique not null references public.bookings,
  experience_id uuid not null references public.experiences,
  rating smallint not null check (rating between 1 and 5),
  body text,
  guest_display_name text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.reviews (experience_id) where not is_hidden;

-- ---------- Strikes, invites, analytics ----------
create table public.operator_strikes (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators,
  booking_id uuid references public.bookings,
  reason text not null check (reason in ('expired_request', 'operator_cancelled')),
  created_at timestamptz not null default now()
);
create index on public.operator_strikes (operator_id, created_at);

create table public.invites (
  token text primary key,
  email text not null,
  role public.user_role not null,
  host_id uuid references public.hosts,
  operator_id uuid references public.operators,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.storefront_visits (  -- simple counter for host dashboard
  host_id uuid not null references public.hosts on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (host_id, day)
);

-- ---------- Integrity rules ----------

-- Slugs reserved for routes (docs/03-site-structure.md). Hosts and areas share the top-level namespace.
create function private.reserved_slugs()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'explore', 'x', 'o', 'b', 'host', 'hosts', 'areas', 'for-hosts', 'for-operators',
    'operator', 'operators', 'admin', 'login', 'auth', 'invite', 'about', 'help', 'terms',
    'privacy', 'cancellations', 'operator-terms', 'how-it-works', 'api', 'search', 'book',
    'bookings', 'account', 'settings', 'static', 'images', 'favicon.ico', 'robots.txt', 'sitemap.xml'
  ]
$$;

create function private.check_top_level_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug = any (private.reserved_slugs()) then
    raise exception 'The address "%" is reserved', new.slug using errcode = '23514';
  end if;
  if tg_table_name = 'hosts' and exists (select 1 from public.areas where slug = new.slug) then
    raise exception 'The address "%" is already used by an area', new.slug using errcode = '23505';
  end if;
  if tg_table_name = 'areas' and exists (select 1 from public.hosts where slug = new.slug) then
    raise exception 'The address "%" is already used by a host', new.slug using errcode = '23505';
  end if;
  return new;
end;
$$;
create trigger hosts_slug_check before insert or update of slug on public.hosts
  for each row execute function private.check_top_level_slug();
create trigger areas_slug_check before insert or update of slug on public.areas
  for each row execute function private.check_top_level_slug();

-- Only verified hosts can recommend, and never an experience run by an operator they're a member of.
create function private.check_recommendation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.hosts where id = new.host_id and status = 'verified') then
    raise exception 'Only verified hosts can recommend experiences' using errcode = '23514';
  end if;
  if exists (
    select 1
    from public.experiences e
    join public.operator_members om on om.operator_id = e.operator_id
    join public.host_members hm on hm.user_id = om.user_id
    where e.id = new.experience_id and hm.host_id = new.host_id
  ) then
    raise exception 'Hosts cannot recommend experiences they run' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger recommendations_check before insert or update of host_id, experience_id on public.recommendations
  for each row execute function private.check_recommendation();
