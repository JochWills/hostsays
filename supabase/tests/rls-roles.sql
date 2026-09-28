-- RLS smoke test: what hosts, operators and strangers can read/write. Runs in a transaction and rolls back.
-- Needs seed data (npm run db:seed). Run: npm run db:test
begin;
-- Test users: a host member of On The Bay, an operator member of Pro Dive, and a stranger.
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-4111-8111-111111111111','h@example.com','authenticated','authenticated'),
  ('22222222-2222-4222-8222-222222222222','o@example.com','authenticated','authenticated'),
  ('33333333-3333-4333-8333-333333333333','s@example.com','authenticated','authenticated');
insert into public.profiles (id, role) values
  ('11111111-1111-4111-8111-111111111111','host'),('22222222-2222-4222-8222-222222222222','operator'),('33333333-3333-4333-8333-333333333333','host');
insert into public.host_members values ('5eed0000-0000-4000-8000-d00000000003','11111111-1111-4111-8111-111111111111',true);
insert into public.operator_members values ('5eed0000-0000-4000-8000-b00000000002','22222222-2222-4222-8222-222222222222',true);
-- A booking of the seal snorkel credited to On The Bay: R1,150 x 2 = R2,300 -> R230 deposit, R138 host, R92 platform.
insert into public.bookings (reference, token, experience_id, operator_id, date, start_time, people, guest_name, guest_email, guest_phone,
  host_id, attribution, unit_price_cents, total_cents, deposit_cents, host_commission_cents, platform_cents, balance_cents, respond_by)
values ('HS-TEST1', repeat('t',43), '5eed0000-0000-4000-8000-c00000000002', '5eed0000-0000-4000-8000-b00000000002', current_date + 3, '08:00', 2,
  'Thandi Mokoena', 'thandi@example.com', '+27000000000', '5eed0000-0000-4000-8000-d00000000003', 'storefront',
  115000, 230000, 23000, 13800, 9200, 207000, now() + interval '12 hours');

create temp table results (who text, check_name text, value text);
grant all on results to authenticated;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
insert into results select 'host', 'host_private rows', count(*)::text from public.host_private;
insert into results select 'host', 'bank rows (own only)', count(*)::text from public.host_bank_details;
insert into results select 'host', 'bookings table rows', count(*)::text from public.bookings;
insert into results select 'host', 'host_bookings()', string_agg(reference||' '||guest_first_name||' R'||host_commission_cents/100, ',') from public.host_bookings();
insert into results select 'host', 'profiles visible', count(*)::text from public.profiles;

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
insert into results select 'operator', 'own bookings', string_agg(reference||' '||guest_email, ',') from public.bookings;
insert into results select 'operator', 'operator_private rows', count(*)::text from public.operator_private;
insert into results select 'operator', 'host_bookings()', count(*)::text from public.host_bookings();

set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
insert into results select 'stranger', 'host_private', count(*)::text from public.host_private;
insert into results select 'stranger', 'bookings', count(*)::text from public.bookings;
insert into results select 'stranger', 'experiences (live)', count(*)::text from public.experiences;
with u as (update public.recommendations set tip = 'x' returning 1)
insert into results select 'stranger', 'rec update (not own)', 'rows changed: ' || count(*) from u;

reset role;
select * from results;
rollback;
