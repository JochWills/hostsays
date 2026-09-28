# 05 — Data Model (Supabase / Postgres)

Starting schema. Create it as Supabase migrations in `supabase/migrations/`. Adjust names if needed, but keep the concepts. **All money in integer cents (ZAR).**

## As built (Phase 1) — changes from the starting schema below
The migrations in `supabase/migrations/` are the real schema. Where they differ from this doc:
- **Private fields split out** so public tables can be read safely:
  - `host_private` (1:1 with hosts): `listing_url`, `contact_email`, `contact_phone`, `commission_rate` (capped at 0.10 so commission never exceeds the deposit).
  - `host_bank_details` (1:1 with hosts): bank fields + `confirmed`. Decided with Josh: bank details in their own table.
  - `operator_private` (1:1 with operators): `contact_email`, `contact_phone`, `terms_accepted_at`, `created_by_admin`, `claimed_at`.
- **New columns:** `operators.is_demo` (seed placeholders), `hosts.featured_rank` and `experiences.featured_rank` (homepage features; null = not featured).
- **Host-safe bookings** are a function, `host_bookings()`, not a view: it returns a host's referred bookings with guest first name only (no email, phone, notes or token).
- **Extra view:** `host_cards` (verified hosts + pick count) for `/hosts`, area pages and the homepage.
- **Areas are publicly readable**; `is_live` only controls what the site lists.
- **Operators never see the booking `token`** (column-level grant).
- **Access:** the hosted project doesn't auto-expose tables, so every grant is explicit. Admin *reads* via RLS; admin *writes*, status changes and anything touching money go through server code with the service role.
- **Integrity in the database:** reserved/clashing slugs, "only verified hosts recommend", "hosts can't recommend their own operator's experiences", and booking money must add up (`deposit + balance = total`, `commission + platform = deposit`).
- **Storage buckets** (public read): `experience-photos/<experience_id>/…`, `host-photos/<host_id>/…`, `operator-logos/<operator_id>/…`, `area-images/…` (admin only).
- **Seed** is `scripts/seed.mts` (`npm run db:seed`), not `seed.sql`, because it uploads photos and creates the admin login through the API. Operators use real names where the prototype had them (decided with Josh) and are flagged `is_demo`; all seed contact emails are `@example.com`.

## Enums
```sql
create type user_role as enum ('admin','host','operator');
create type host_type as enum ('guesthouse','bnb','self_catering','airbnb','hotel','lodge','other');
create type approval_status as enum ('pending','verified','rejected','suspended');
create type listing_status as enum ('draft','pending_review','live','paused','rejected');
create type category as enum ('safari','ocean','adventure','food','culture','wellness');
create type booking_status as enum (
  'requested','confirmed','paid','completed','no_show',
  'offered','offer_expired',       -- operator offered other times / guest didn't pick in time
  'declined','expired','payment_expired',
  'cancelled_by_guest_request',   -- guest cancelled before paying
  'cancelled_guest_refunded',     -- guest cancelled 7+ days before, deposit refunded
  'cancelled_guest_late',         -- guest cancelled within 7 days, deposit kept
  'cancelled_by_operator'         -- operator cancelled after payment, deposit refunded
);
create type attribution_source as enum ('storefront','ref_link','selected','none');
create type commission_status as enum ('none','pending','payable','paid','void');
create type payout_status as enum ('draft','exported','paid');
```

## Tables

### profiles
Links Supabase Auth users to roles.
```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null,
  full_name text,
  phone text,
  created_at timestamptz default now()
);
```

### areas
```sql
create table areas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,            -- e.g. 'gqeberha', 'addo'
  name text not null,
  intro text,                           -- SEO intro copy
  hero_image_path text,
  sort_order int default 0,
  is_live boolean default false         -- only show when it has live listings
);
```

### hosts
```sql
create table hosts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,            -- storefront URL; must not clash with areas/reserved slugs
  name text not null,
  type host_type not null,
  area_id uuid references areas,
  listing_url text not null,            -- Booking.com / Airbnb / website used for verification
  contact_email text not null,
  contact_phone text,
  photo_path text,
  welcome_note text,
  status approval_status default 'pending',
  commission_rate numeric(5,4) default 0.06,   -- founding host rate
  bank_account_name text, bank_name text, bank_account_number text, bank_branch_code text,
  bank_details_confirmed boolean default false,
  verified_at timestamptz,
  created_at timestamptz default now()
);
create table host_members (             -- staff logins (hotels)
  host_id uuid references hosts on delete cascade,
  user_id uuid references profiles on delete cascade,
  is_owner boolean default false,
  primary key (host_id, user_id)
);
```
Bank details are sensitive: only host members and admins can read them (RLS), never exposed to public queries. Consider moving them to a separate table with stricter policies.

### operators
```sql
create table operators (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  area_id uuid references areas,
  description text,
  contact_email text not null,          -- booking request emails go here
  contact_phone text,
  website text,
  logo_path text,
  status approval_status default 'pending',
  terms_accepted_at timestamptz,        -- must be set before listings go live
  created_by_admin boolean default false,
  claimed_at timestamptz,
  created_at timestamptz default now()
);
create table operator_members (
  operator_id uuid references operators on delete cascade,
  user_id uuid references profiles on delete cascade,
  is_owner boolean default false,
  primary key (operator_id, user_id)
);
```

### experiences
```sql
create table experiences (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators not null,
  slug text unique not null,
  title text not null,
  summary text not null,                -- 1–2 lines for cards
  description text not null,
  category category not null,
  area_id uuid references areas not null,
  duration_minutes int not null,
  price_cents int not null,             -- per person unless is_group_price
  is_group_price boolean default false,
  min_people int default 1,
  max_people int not null,
  included text[] default '{}',
  what_to_bring text[] default '{}',
  meeting_point text not null,
  meeting_point_map_url text,
  operator_cancellation_terms text,     -- operator's own terms for the balance
  status listing_status default 'draft',
  pending_changes jsonb,                -- edits awaiting admin approval for live listings
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table experience_photos (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid references experiences on delete cascade,
  path text not null, alt text not null, sort_order int default 0
);
```

### availability
```sql
create table experience_slots (         -- weekly recurring
  id uuid primary key default gen_random_uuid(),
  experience_id uuid references experiences on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),  -- 0 = Sunday
  start_time time not null,
  capacity int not null
);
create table experience_blackouts (
  experience_id uuid references experiences on delete cascade,
  date date not null,
  reason text,
  primary key (experience_id, date)
);
```
create table slot_overrides (           -- one date + slot differs from the weekly pattern
  experience_id uuid references experiences on delete cascade,
  date date not null,
  start_time time not null,
  capacity int not null check (capacity >= 0),   -- 0 = closed, n = spots for that date
  primary key (experience_id, date, start_time)
);
create table operator_calendars (       -- imported calendar (Google/Outlook/Apple .ics address)
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators on delete cascade not null,
  experience_id uuid references experiences on delete cascade,  -- null = all the operator's experiences
  ics_url text not null,                -- private address: never exposed to anon or other operators
  last_synced_at timestamptz,
  failure_count int default 0,
  last_error text,
  created_at timestamptz default now()
);
create table calendar_busy (            -- event times only, no titles or descriptions
  calendar_id uuid references operator_calendars on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean default false
);
create index on calendar_busy (calendar_id, starts_at);
```
Capacity check: sum of `people` for bookings in `confirmed` or `paid` on that date+slot must not exceed capacity (the `slot_overrides` capacity if there is one, else the weekly slot's). `requested` and `offered` bookings don't hold capacity (the operator decides). Full rules for what's requestable are in `06-booking-flow.md` → Availability.

Calendar export: add `calendar_feed_token text unique` (random, regenerable) to `operators`.

> **Not in the database yet:** `offered`/`offer_expired`, the new booking columns, `booking_offers`, `slot_overrides`, `operator_calendars`, `calendar_busy` and `calendar_feed_token` were added to this doc after the Phase 1 migrations. Add them in a migration at the start of Phase 4 drop the unused `alternative_date` column, and add `r` to `private.reserved_slugs()` (for the `/r/[token]` one-tap links).

### recommendations
```sql
create table recommendations (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references hosts on delete cascade,
  experience_id uuid references experiences on delete cascade,
  tip text not null check (char_length(tip) <= 200),
  sort_order int default 0,
  is_hidden boolean default false,      -- admin moderation
  created_at timestamptz default now(),
  unique (host_id, experience_id)
);
```
Rule: a host can't recommend an experience whose operator they're a member of (enforce in a trigger or server action).

### bookings
```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,       -- human ref e.g. 'HS-4F7K2'
  token text unique not null,           -- 32+ random bytes, base64url; guest access
  experience_id uuid references experiences not null,
  operator_id uuid references operators not null,   -- denormalised for RLS
  date date not null,
  start_time time not null,
  people int not null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  guest_notes text,
  host_id uuid references hosts,        -- credited host (null = none)
  attribution attribution_source not null default 'none',
  -- money snapshot at request time (never recompute from current prices)
  unit_price_cents int not null,
  total_cents int not null,
  deposit_cents int not null,
  host_commission_cents int not null default 0,
  platform_cents int not null,
  balance_cents int not null,
  host_commission_status commission_status default 'none',
  status booking_status not null default 'requested',
  respond_by timestamptz not null,      -- created_at + 12h
  pay_by timestamptz,                   -- confirmed_at + 24h
  confirmed_at timestamptz, paid_at timestamptz, completed_at timestamptz, cancelled_at timestamptz,
  decline_reason text, cancel_reason text, cancelled_for_weather boolean default false,
  requested_date date,                  -- guest's original choice, kept if they pick an offered time
  requested_start_time time,
  offer_expires_at timestamptz,         -- set when status = 'offered'
  payout_id uuid,                       -- set when included in a host payout
  created_at timestamptz default now()
);
create index on bookings (operator_id, status);
create index on bookings (host_id, status);
create index on bookings (date);

create table booking_offers (           -- operator's "Offer another time" options (max 3)
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings on delete cascade not null,
  date date not null,
  start_time time not null,
  unique (booking_id, date, start_time)
);
```

### payments
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings not null,
  paystack_reference text unique not null,
  amount_cents int not null,
  status text not null,                 -- 'initialized','success','failed','refunded','refund_pending'
  paystack_fee_cents int,
  raw jsonb,                            -- webhook payload
  refunded_at timestamptz,
  created_at timestamptz default now()
);
```

### payouts
```sql
create table payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references hosts not null,
  period_month date not null,           -- first day of the month covered
  amount_cents int not null,
  booking_count int not null,
  status payout_status default 'draft',
  paid_at timestamptz,
  unique (host_id, period_month)
);
```

### reviews
```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references bookings not null,
  experience_id uuid references experiences not null,
  rating smallint not null check (rating between 1 and 5),
  body text,
  guest_display_name text,
  is_hidden boolean default false,
  created_at timestamptz default now()
);
```

### strikes, applications, invites, analytics
```sql
create table operator_strikes (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators not null,
  booking_id uuid references bookings,
  reason text not null,                 -- 'expired_request' | 'operator_cancelled'
  created_at timestamptz default now()
);
create table invites (
  token text primary key,
  email text not null,
  role user_role not null,
  host_id uuid references hosts, operator_id uuid references operators,
  expires_at timestamptz not null, accepted_at timestamptz
);
create table storefront_visits (        -- simple counter for host dashboard
  host_id uuid references hosts, day date, count int default 0,
  primary key (host_id, day)
);
```

## Views (public read)
- `experience_cards`: live experiences with operator name, area, first photo, host recommendation count, avg rating and review count (rating null if < 3 reviews).
- `host_storefront`: verified host + visible recommendations joined to live experiences.

## Row Level Security (summary)
Enable RLS on **every** table.

| Table | Public (anon) | Host member | Operator member | Admin |
|---|---|---|---|---|
| areas, categories | read live | read | read | all |
| experiences, photos, slots, blackouts | read `live` | read live | CRUD own (status changes via server) | all |
| slot_overrides | read for live experiences | read | CRUD own | all |
| operator_calendars, calendar_busy | none | — | read/delete own; add via server (URL checked) | all |
| booking_offers | none (guest via server using token) | — | read own; create via server | all |
| operators | read verified (no private contact fields via view) | — | read/update own | all |
| hosts | read verified public fields via view | read/update own (incl. bank) | — | all |
| recommendations | read not hidden | CRUD own | read on own experiences | all |
| bookings | **none** (guest access via server using token) | read where `host_id` = own (no guest phone/email) | read/update own via server actions | all |
| payments, payouts, strikes | none | read own payouts | read own statements | all |
| reviews | read not hidden when experience has 3+ | read | read own | all |

- Guest pages (`/b/[token]`) load data **on the server** with the service-role client, looking up by token. Never expose bookings to anon via RLS.
- Hosts see referred bookings **without** guest email/phone (POPIA) — expose via a view with limited columns.
- Status transitions happen only in server actions / route handlers that check the allowed transition (see `06-booking-flow.md`).

## Seed data
Create `supabase/seed.sql` with: 6 areas (Gqeberha, Addo, Jeffreys Bay, St Francis Bay, Kenton-on-Sea, Port Alfred), 4–8 demo operators and experiences, 4 demo hosts (e.g. On The Bay B&B, Sundays River Retreat, Kenton Cliff House, Aloe Farmstead), recommendations with tips, and an admin user. Use the images in `reference/assets/`. Mark demo operators clearly in admin (they're placeholders until real operators agree).
