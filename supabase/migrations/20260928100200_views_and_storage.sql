-- Public read views and Storage buckets.
-- Views use security_invoker, so the caller's RLS applies (anon sees only live/verified/visible rows).

-- ---------- experience_cards ----------
-- Live experiences with everything a card needs. Rating is null until there are 3+ visible reviews.
create view public.experience_cards
with (security_invoker = true)
as
select
  e.id,
  e.slug,
  e.title,
  e.summary,
  e.category,
  e.price_cents,
  e.is_group_price,
  e.duration_minutes,
  e.min_people,
  e.max_people,
  e.featured_rank,
  e.created_at,
  a.id as area_id,
  a.slug as area_slug,
  a.name as area_name,
  o.id as operator_id,
  o.slug as operator_slug,
  o.name as operator_name,
  photo.path as photo_path,
  photo.alt as photo_alt,
  coalesce(recs.host_count, 0)::int as host_count,
  coalesce(recs.host_photo_paths, '{}') as host_photo_paths,
  coalesce(rev.review_count, 0)::int as review_count,
  case when rev.review_count >= 3 then rev.avg_rating end as rating -- lib/config.ts MIN_REVIEWS_TO_SHOW
from public.experiences e
join public.areas a on a.id = e.area_id
join public.operators o on o.id = e.operator_id
left join lateral (
  select p.path, p.alt
  from public.experience_photos p
  where p.experience_id = e.id
  order by p.sort_order, p.id
  limit 1
) photo on true
left join lateral (
  select
    count(*) as host_count,
    (array_agg(h.photo_path order by r.created_at) filter (where h.photo_path is not null))[1:3] as host_photo_paths
  from public.recommendations r
  join public.hosts h on h.id = r.host_id
  where r.experience_id = e.id and not r.is_hidden and h.status = 'verified'
) recs on true
left join lateral (
  select count(*) as review_count, round(avg(rv.rating)::numeric, 1) as avg_rating
  from public.reviews rv
  where rv.experience_id = e.id and not rv.is_hidden
) rev on true
where e.status = 'live' and o.status = 'verified';

-- ---------- host_cards ----------
-- Verified hosts with their number of visible picks (for /hosts, area pages and the homepage).
create view public.host_cards
with (security_invoker = true)
as
select
  h.id,
  h.slug,
  h.name,
  h.type,
  h.photo_path,
  h.welcome_note,
  h.featured_rank,
  a.id as area_id,
  a.slug as area_slug,
  a.name as area_name,
  (
    select count(*)
    from public.recommendations r
    join public.experiences e on e.id = r.experience_id
    where r.host_id = h.id and not r.is_hidden and e.status = 'live'
  )::int as pick_count
from public.hosts h
left join public.areas a on a.id = h.area_id
where h.status = 'verified';

-- ---------- host_storefront ----------
-- One row per visible pick on a verified host's storefront, in the host's order, with the tip.
create view public.host_storefront
with (security_invoker = true)
as
select
  h.id as host_id,
  h.slug as host_slug,
  r.id as recommendation_id,
  r.tip,
  r.sort_order,
  c.*
from public.recommendations r
join public.hosts h on h.id = r.host_id
join public.experience_cards c on c.id = r.experience_id
where h.status = 'verified' and not r.is_hidden;

grant select on public.experience_cards, public.host_cards, public.host_storefront to anon, authenticated;
grant select on public.experience_cards, public.host_cards, public.host_storefront to service_role;

-- ---------- Storage ----------
-- Public-read image buckets. Files are stored under a folder named after the owning row's id,
-- e.g. experience-photos/<experience_id>/1.jpg, host-photos/<host_id>/photo.jpg.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('experience-photos', 'experience-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('host-photos', 'host-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('operator-logos', 'operator-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('area-images', 'area-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function private.folder_uuid(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
  end
$$;
grant execute on function private.folder_uuid(text) to anon, authenticated, service_role;

-- Experience photos: the operator, while the listing isn't live (live edits need approval).
create policy "experience-photos: operators read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'experience-photos' and private.can_edit_experience(private.folder_uuid(name), true));
create policy "experience-photos: operators upload to drafts" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'experience-photos' and private.can_edit_experience(private.folder_uuid(name), false));
create policy "experience-photos: operators replace on drafts" on storage.objects
  for update to authenticated
  using (bucket_id = 'experience-photos' and private.can_edit_experience(private.folder_uuid(name), false));
create policy "experience-photos: operators delete from drafts" on storage.objects
  for delete to authenticated
  using (bucket_id = 'experience-photos' and private.can_edit_experience(private.folder_uuid(name), false));

-- Host photos: host members.
create policy "host-photos: members read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'host-photos' and private.is_host_member(private.folder_uuid(name)));
create policy "host-photos: members upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'host-photos' and private.is_host_member(private.folder_uuid(name)));
create policy "host-photos: members replace" on storage.objects
  for update to authenticated
  using (bucket_id = 'host-photos' and private.is_host_member(private.folder_uuid(name)));
create policy "host-photos: members delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'host-photos' and private.is_host_member(private.folder_uuid(name)));

-- Operator logos: operator members.
create policy "operator-logos: members read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'operator-logos' and private.is_operator_member(private.folder_uuid(name)));
create policy "operator-logos: members upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'operator-logos' and private.is_operator_member(private.folder_uuid(name)));
create policy "operator-logos: members replace" on storage.objects
  for update to authenticated
  using (bucket_id = 'operator-logos' and private.is_operator_member(private.folder_uuid(name)));
create policy "operator-logos: members delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'operator-logos' and private.is_operator_member(private.folder_uuid(name)));

-- area-images: admin uploads via the service role only.
