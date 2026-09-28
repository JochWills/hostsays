-- Access control. Summary in docs/05-data-model.md ("Row Level Security").
--
-- The hosted project does NOT auto-expose new tables, so every privilege is granted here explicitly.
-- Pattern: anon/authenticated get only the table and column privileges they need, and RLS narrows rows.
-- Status changes, money, bookings, payouts and admin edits go through server code using the service role.

-- ---------- Clean slate ----------
-- Project defaults hand anon/authenticated TRUNCATE/REFERENCES/TRIGGER on new tables. Remove them.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, public;

-- The service role bypasses RLS and is only used on the server (webhooks, cron, admin actions).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges for role postgres in schema public grant all on tables to service_role;
alter default privileges for role postgres in schema public grant all on sequences to service_role;
alter default privileges for role postgres in schema public grant execute on functions to service_role;

-- ---------- RLS on every table ----------
alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.hosts enable row level security;
alter table public.host_private enable row level security;
alter table public.host_bank_details enable row level security;
alter table public.host_members enable row level security;
alter table public.operators enable row level security;
alter table public.operator_private enable row level security;
alter table public.operator_members enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_photos enable row level security;
alter table public.experience_slots enable row level security;
alter table public.experience_blackouts enable row level security;
alter table public.recommendations enable row level security;
alter table public.payouts enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.operator_strikes enable row level security;
alter table public.invites enable row level security;
alter table public.storefront_visits enable row level security;

-- ---------- Helper functions ----------
-- SECURITY DEFINER so policies can check membership without recursing through RLS.
-- They live in `private`, which the Data API does not expose.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
$$;

create function private.is_host_member(p_host_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.host_members where host_id = p_host_id and user_id = (select auth.uid()))
$$;

create function private.is_operator_member(p_operator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.operator_members where operator_id = p_operator_id and user_id = (select auth.uid()))
$$;

-- True if the caller runs the experience. With p_allow_live = false, live listings are excluded
-- (their edits need admin approval and go through the server).
create function private.can_edit_experience(p_experience_id uuid, p_allow_live boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.experiences e
    join public.operator_members om on om.operator_id = e.operator_id
    where e.id = p_experience_id
      and om.user_id = (select auth.uid())
      and (p_allow_live or e.status in ('draft', 'rejected'))
  )
$$;

-- Reviews show publicly only once an experience has MIN_REVIEWS_TO_SHOW (3) visible reviews.
create function private.visible_review_count(p_experience_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from public.reviews where experience_id = p_experience_id and not is_hidden
$$;

revoke all on all functions in schema private from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;
grant execute on function private.is_host_member(uuid) to anon, authenticated, service_role;
grant execute on function private.is_operator_member(uuid) to anon, authenticated, service_role;
grant execute on function private.can_edit_experience(uuid, boolean) to anon, authenticated, service_role;
grant execute on function private.visible_review_count(uuid) to anon, authenticated, service_role;
grant execute on function private.reserved_slugs() to anon, authenticated, service_role;

-- ---------- profiles ----------
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
create policy "profiles: read own, admin reads all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- areas ----------
grant select on public.areas to anon, authenticated;
create policy "areas: public reads live" on public.areas
  for select to anon
  using (is_live);
create policy "areas: signed-in users read all" on public.areas
  for select to authenticated
  using (true);

-- ---------- hosts ----------
grant select on public.hosts to anon, authenticated;
grant update (name, type, area_id, photo_path, welcome_note) on public.hosts to authenticated;
create policy "hosts: public reads verified" on public.hosts
  for select to anon, authenticated
  using (status = 'verified' or private.is_host_member(id) or private.is_admin());
create policy "hosts: members update own" on public.hosts
  for update to authenticated
  using (private.is_host_member(id))
  with check (private.is_host_member(id));

grant select on public.host_private to authenticated;
grant update (contact_email, contact_phone) on public.host_private to authenticated;
create policy "host_private: members and admin read" on public.host_private
  for select to authenticated
  using (private.is_host_member(host_id) or private.is_admin());
create policy "host_private: members update own" on public.host_private
  for update to authenticated
  using (private.is_host_member(host_id))
  with check (private.is_host_member(host_id));

grant select on public.host_bank_details to authenticated;
grant insert (host_id, account_name, bank_name, account_number, branch_code, confirmed) on public.host_bank_details to authenticated;
grant update (account_name, bank_name, account_number, branch_code, confirmed) on public.host_bank_details to authenticated;
create policy "host_bank_details: members and admin read" on public.host_bank_details
  for select to authenticated
  using (private.is_host_member(host_id) or private.is_admin());
create policy "host_bank_details: members add own" on public.host_bank_details
  for insert to authenticated
  with check (private.is_host_member(host_id));
create policy "host_bank_details: members update own" on public.host_bank_details
  for update to authenticated
  using (private.is_host_member(host_id))
  with check (private.is_host_member(host_id));

grant select on public.host_members to authenticated;
create policy "host_members: team and admin read" on public.host_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_host_member(host_id) or private.is_admin());

-- ---------- operators ----------
grant select on public.operators to anon, authenticated;
grant update (name, area_id, description, website, logo_path) on public.operators to authenticated;
create policy "operators: public reads verified" on public.operators
  for select to anon, authenticated
  using (status = 'verified' or private.is_operator_member(id) or private.is_admin());
create policy "operators: members update own" on public.operators
  for update to authenticated
  using (private.is_operator_member(id))
  with check (private.is_operator_member(id));

grant select on public.operator_private to authenticated;
grant update (contact_email, contact_phone) on public.operator_private to authenticated;
create policy "operator_private: members and admin read" on public.operator_private
  for select to authenticated
  using (private.is_operator_member(operator_id) or private.is_admin());
create policy "operator_private: members update own" on public.operator_private
  for update to authenticated
  using (private.is_operator_member(operator_id))
  with check (private.is_operator_member(operator_id));

grant select on public.operator_members to authenticated;
create policy "operator_members: team and admin read" on public.operator_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_operator_member(operator_id) or private.is_admin());

-- ---------- experiences ----------
grant select on public.experiences to anon, authenticated;
-- Operators write drafts directly; status, featuring and live-listing edits go through the server.
grant insert (
  operator_id, slug, title, summary, description, category, area_id, duration_minutes, price_cents,
  is_group_price, min_people, max_people, included, what_to_bring, meeting_point, meeting_point_map_url,
  operator_cancellation_terms
) on public.experiences to authenticated;
grant update (
  slug, title, summary, description, category, area_id, duration_minutes, price_cents,
  is_group_price, min_people, max_people, included, what_to_bring, meeting_point, meeting_point_map_url,
  operator_cancellation_terms
) on public.experiences to authenticated;
create policy "experiences: public reads live from verified operators" on public.experiences
  for select to anon, authenticated
  using (
    (status = 'live' and exists (select 1 from public.operators o where o.id = operator_id and o.status = 'verified'))
    or private.is_operator_member(operator_id)
    or private.is_admin()
  );
create policy "experiences: operators create drafts" on public.experiences
  for insert to authenticated
  with check (private.is_operator_member(operator_id));
create policy "experiences: operators edit own drafts" on public.experiences
  for update to authenticated
  using (private.can_edit_experience(id, false))
  with check (private.is_operator_member(operator_id));

-- Photos: readable when the experience is; editable by its operator while not live.
grant select on public.experience_photos to anon, authenticated;
grant insert (experience_id, path, alt, sort_order) on public.experience_photos to authenticated;
grant update (path, alt, sort_order) on public.experience_photos to authenticated;
grant delete on public.experience_photos to authenticated;
create policy "experience_photos: read with experience" on public.experience_photos
  for select to anon, authenticated
  using (exists (select 1 from public.experiences e where e.id = experience_id));
create policy "experience_photos: operators add to drafts" on public.experience_photos
  for insert to authenticated
  with check (private.can_edit_experience(experience_id, false));
create policy "experience_photos: operators edit drafts" on public.experience_photos
  for update to authenticated
  using (private.can_edit_experience(experience_id, false))
  with check (private.can_edit_experience(experience_id, false));
create policy "experience_photos: operators remove from drafts" on public.experience_photos
  for delete to authenticated
  using (private.can_edit_experience(experience_id, false));

-- Availability: operators may change it any time, including on live listings.
grant select on public.experience_slots to anon, authenticated;
grant insert (experience_id, weekday, start_time, capacity) on public.experience_slots to authenticated;
grant update (weekday, start_time, capacity) on public.experience_slots to authenticated;
grant delete on public.experience_slots to authenticated;
create policy "experience_slots: read with experience" on public.experience_slots
  for select to anon, authenticated
  using (exists (select 1 from public.experiences e where e.id = experience_id));
create policy "experience_slots: operators add" on public.experience_slots
  for insert to authenticated
  with check (private.can_edit_experience(experience_id, true));
create policy "experience_slots: operators edit" on public.experience_slots
  for update to authenticated
  using (private.can_edit_experience(experience_id, true))
  with check (private.can_edit_experience(experience_id, true));
create policy "experience_slots: operators remove" on public.experience_slots
  for delete to authenticated
  using (private.can_edit_experience(experience_id, true));

grant select on public.experience_blackouts to anon, authenticated;
grant insert (experience_id, date, reason) on public.experience_blackouts to authenticated;
grant update (reason) on public.experience_blackouts to authenticated;
grant delete on public.experience_blackouts to authenticated;
create policy "experience_blackouts: read with experience" on public.experience_blackouts
  for select to anon, authenticated
  using (exists (select 1 from public.experiences e where e.id = experience_id));
create policy "experience_blackouts: operators add" on public.experience_blackouts
  for insert to authenticated
  with check (private.can_edit_experience(experience_id, true));
create policy "experience_blackouts: operators edit" on public.experience_blackouts
  for update to authenticated
  using (private.can_edit_experience(experience_id, true))
  with check (private.can_edit_experience(experience_id, true));
create policy "experience_blackouts: operators remove" on public.experience_blackouts
  for delete to authenticated
  using (private.can_edit_experience(experience_id, true));

-- ---------- recommendations ----------
grant select on public.recommendations to anon, authenticated;
grant insert (host_id, experience_id, tip, sort_order) on public.recommendations to authenticated;
grant update (tip, sort_order) on public.recommendations to authenticated;
grant delete on public.recommendations to authenticated;
create policy "recommendations: public reads visible" on public.recommendations
  for select to anon, authenticated
  using (
    (not is_hidden and exists (select 1 from public.hosts h where h.id = host_id and h.status = 'verified'))
    or private.is_host_member(host_id)
    or private.is_admin()
  );
create policy "recommendations: hosts add own" on public.recommendations
  for insert to authenticated
  with check (private.is_host_member(host_id));
create policy "recommendations: hosts edit own" on public.recommendations
  for update to authenticated
  using (private.is_host_member(host_id))
  with check (private.is_host_member(host_id));
create policy "recommendations: hosts remove own" on public.recommendations
  for delete to authenticated
  using (private.is_host_member(host_id));

-- ---------- bookings ----------
-- Never readable by anon: guest pages load by token on the server with the service role.
-- Operators read their own bookings (every column except the guest's access token).
-- Hosts use public.host_bookings(), which leaves out guest contact details (POPIA).
grant select (
  id, reference, experience_id, operator_id, date, start_time, people,
  guest_name, guest_email, guest_phone, guest_notes, host_id, attribution,
  unit_price_cents, total_cents, deposit_cents, host_commission_cents, platform_cents, balance_cents,
  host_commission_status, status, respond_by, pay_by, confirmed_at, paid_at, completed_at, cancelled_at,
  decline_reason, cancel_reason, cancelled_for_weather, alternative_date, payout_id, created_at
) on public.bookings to authenticated;
create policy "bookings: operators and admin read" on public.bookings
  for select to authenticated
  using (private.is_operator_member(operator_id) or private.is_admin());

-- ---------- payments, strikes, invites (admin / server only) ----------
grant select on public.payments to authenticated;
create policy "payments: admin reads" on public.payments
  for select to authenticated
  using (private.is_admin());

grant select on public.operator_strikes to authenticated;
create policy "operator_strikes: admin reads" on public.operator_strikes
  for select to authenticated
  using (private.is_admin());

-- invites: no anon/authenticated access at all (accepted on the server).

-- ---------- payouts ----------
grant select on public.payouts to authenticated;
create policy "payouts: hosts read own, admin reads all" on public.payouts
  for select to authenticated
  using (private.is_host_member(host_id) or private.is_admin());

-- ---------- reviews ----------
grant select on public.reviews to anon, authenticated;
create policy "reviews: public reads once there are enough" on public.reviews
  for select to anon, authenticated
  using (
    (not is_hidden and private.visible_review_count(experience_id) >= 3) -- lib/config.ts MIN_REVIEWS_TO_SHOW
    or exists (
      select 1 from public.experiences e
      where e.id = experience_id and private.is_operator_member(e.operator_id)
    )
    or private.is_admin()
  );

-- ---------- storefront_visits ----------
grant select on public.storefront_visits to authenticated;
create policy "storefront_visits: hosts read own" on public.storefront_visits
  for select to authenticated
  using (private.is_host_member(host_id) or private.is_admin());

-- ---------- Host-safe bookings ----------
-- A host's referred bookings without guest email, phone, notes or token (docs/07-host-attribution.md).
create function public.host_bookings()
returns table (
  id uuid,
  reference text,
  host_id uuid,
  experience_id uuid,
  experience_title text,
  date date,
  start_time time,
  people int,
  guest_first_name text,
  status public.booking_status,
  host_commission_cents int,
  host_commission_status public.commission_status,
  payout_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id, b.reference, b.host_id, b.experience_id, e.title, b.date, b.start_time, b.people,
    split_part(trim(b.guest_name), ' ', 1),
    b.status, b.host_commission_cents, b.host_commission_status, b.payout_id, b.created_at
  from public.bookings b
  join public.experiences e on e.id = b.experience_id
  where b.host_id is not null
    and (private.is_host_member(b.host_id) or private.is_admin())
  order by b.date desc, b.created_at desc
$$;
revoke all on function public.host_bookings() from public, anon;
grant execute on function public.host_bookings() to authenticated, service_role;
