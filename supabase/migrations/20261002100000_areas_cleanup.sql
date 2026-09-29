-- Areas clean-up (docs/05-data-model.md → Areas):
--  1. `areas.is_live` is now kept up to date automatically: an area shows on the site while it has a live
--     experience from a verified operator, or a verified host. No more switching areas on by hand.
--  2. Hosts and operators whose town isn't listed can ask for it at sign-up ("Somewhere else in <province>").
--     The request waits on their private row until an admin assigns (or creates) an area.
--  3. Old area addresses keep working: area_redirects maps an old slug to the area it became.
--  4. merge_areas() folds one area into another in one transaction (admin only).
--  5. Addo becomes Sundays River Valley; /addo redirects.

-- ---------- 1. Automatic visibility ----------
create or replace function private.refresh_area_live(p_area_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.areas a
  set is_live = exists (
        select 1 from public.experiences e
        join public.operators o on o.id = e.operator_id
        where e.area_id = a.id and e.status = 'live' and o.status = 'verified'
      ) or exists (
        select 1 from public.hosts h where h.area_id = a.id and h.status = 'verified'
      )
  where a.id = p_area_id;
$$;

create or replace function private.area_live_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'operators' then
    -- An operator's status decides whether its experiences count.
    perform private.refresh_area_live(e.area_id)
    from (select distinct area_id from public.experiences where operator_id = coalesce(new.id, old.id)) e;
    return null;
  end if;
  if tg_op <> 'INSERT' and old.area_id is not null then
    perform private.refresh_area_live(old.area_id);
  end if;
  if tg_op <> 'DELETE' and new.area_id is not null then
    perform private.refresh_area_live(new.area_id);
  end if;
  return null;
end;
$$;

create trigger experiences_area_live after insert or delete or update of status, area_id, operator_id on public.experiences
  for each row execute function private.area_live_after_change();
create trigger hosts_area_live after insert or delete or update of status, area_id on public.hosts
  for each row execute function private.area_live_after_change();
create trigger operators_area_live after update of status on public.operators
  for each row execute function private.area_live_after_change();

-- ---------- 2. "Somewhere else" requests ----------
alter table public.host_private
  add column requested_province_id uuid references public.provinces,
  add column requested_town text check (char_length(requested_town) <= 60);
alter table public.operator_private
  add column requested_province_id uuid references public.provinces,
  add column requested_town text check (char_length(requested_town) <= 60);

-- Sign-up: `areaId` is an area id, or "other:<province id>" with `town`.
create or replace function public.complete_signup(p_user_id uuid, p_email text, p_type text, p_data jsonb)
returns public.user_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_base text;
  v_slug text;
  v_id uuid;
  v_n int := 1;
  v_area uuid;
  v_province uuid;
  v_town text;
begin
  select role into v_role from public.profiles where id = p_user_id;
  if found then
    return v_role;
  end if;

  if p_type not in ('guest', 'host', 'operator') then
    raise exception 'Unknown account type "%"', p_type using errcode = '22023';
  end if;
  v_role := p_type::public.user_role;

  if p_data ->> 'areaId' like 'other:%' then
    v_province := substr(p_data ->> 'areaId', 7)::uuid;
    v_town := nullif(btrim(p_data ->> 'town'), '');
  elsif nullif(p_data ->> 'areaId', '') is not null then
    v_area := (p_data ->> 'areaId')::uuid;
  end if;

  insert into public.profiles (id, role, full_name, phone)
  values (p_user_id, v_role, p_data ->> 'fullName', nullif(p_data ->> 'phone', ''));

  if v_role = 'host' then
    v_base := private.slugify(p_data ->> 'name', 34);
    if char_length(v_base) < 3 then v_base := 'host'; end if;
    v_slug := v_base;
    while v_slug = any (private.reserved_slugs())
       or exists (select 1 from public.hosts where slug = v_slug)
       or exists (select 1 from public.areas where slug = v_slug)
       or exists (select 1 from public.provinces where slug = v_slug)
       or exists (select 1 from public.area_redirects where old_slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    insert into public.hosts (slug, name, type, area_id, status)
    values (v_slug, p_data ->> 'name', (p_data ->> 'hostType')::public.host_type, v_area, 'pending')
    returning id into v_id;
    insert into public.host_private (host_id, listing_url, contact_email, contact_phone, terms_accepted_at, requested_province_id, requested_town)
    values (v_id, p_data ->> 'listingUrl', p_email, nullif(p_data ->> 'phone', ''), now(), v_province, v_town);
    insert into public.host_members (host_id, user_id, is_owner) values (v_id, p_user_id, true);

  elsif v_role = 'operator' then
    v_base := private.slugify(p_data ->> 'name', 54);
    if char_length(v_base) < 2 then v_base := 'operator'; end if;
    v_slug := v_base;
    while exists (select 1 from public.operators where slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    insert into public.operators (slug, name, area_id, website, status)
    values (v_slug, p_data ->> 'name', v_area, nullif(p_data ->> 'website', ''), 'pending')
    returning id into v_id;
    insert into public.operator_private (operator_id, contact_email, contact_phone, terms_accepted_at, requested_province_id, requested_town)
    values (v_id, p_email, nullif(p_data ->> 'phone', ''), now(), v_province, v_town);
    insert into public.operator_members (operator_id, user_id, is_owner) values (v_id, p_user_id, true);
  end if;

  return v_role;
end;
$$;

-- ---------- 3. Old addresses ----------
create table public.area_redirects (
  old_slug text primary key check (old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  area_id uuid not null references public.areas on delete cascade
);
alter table public.area_redirects enable row level security;
grant select on public.area_redirects to anon, authenticated;
create policy "area_redirects: anyone reads" on public.area_redirects for select to anon, authenticated using (true);

-- An old address stays reserved, so nothing new takes it over.
create or replace function private.check_top_level_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug = any (private.reserved_slugs()) then
    raise exception 'The address "%" is reserved', new.slug using errcode = '23514';
  end if;
  if tg_table_name <> 'areas' and exists (select 1 from public.areas where slug = new.slug) then
    raise exception 'The address "%" is already used by an area', new.slug using errcode = '23505';
  end if;
  if tg_table_name <> 'hosts' and exists (select 1 from public.hosts where slug = new.slug) then
    raise exception 'The address "%" is already used by a host', new.slug using errcode = '23505';
  end if;
  if tg_table_name <> 'provinces' and exists (select 1 from public.provinces where slug = new.slug) then
    raise exception 'The address "%" is already used by a province', new.slug using errcode = '23505';
  end if;
  if exists (select 1 from public.area_redirects where old_slug = new.slug and (tg_table_name <> 'areas' or area_id <> new.id)) then
    raise exception 'The address "%" is an old area address', new.slug using errcode = '23505';
  end if;
  return new;
end;
$$;

-- When an area's address changes, the old one redirects to it (and a redirect to the new one is no longer needed).
create or replace function private.area_slug_redirect()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug then
    delete from public.area_redirects where old_slug = new.slug;
    insert into public.area_redirects (old_slug, area_id) values (old.slug, new.id)
    on conflict (old_slug) do update set area_id = excluded.area_id;
  end if;
  return new;
end;
$$;
create trigger areas_slug_redirect after update of slug on public.areas
  for each row execute function private.area_slug_redirect();

-- ---------- 4. Merge ----------
-- Moves everything from one area into another, keeps the old address as a redirect, then deletes it.
create or replace function public.merge_areas(p_from uuid, p_into uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_slug text;
begin
  if p_from = p_into then
    raise exception 'Choose a different area to merge into' using errcode = '22023';
  end if;
  select slug into v_old_slug from public.areas where id = p_from;
  if v_old_slug is null or not exists (select 1 from public.areas where id = p_into) then
    raise exception 'Area not found' using errcode = 'P0002';
  end if;
  update public.experiences set area_id = p_into where area_id = p_from;
  update public.hosts set area_id = p_into where area_id = p_from;
  update public.operators set area_id = p_into where area_id = p_from;
  update public.area_redirects set area_id = p_into where area_id = p_from;
  delete from public.areas where id = p_from;
  insert into public.area_redirects (old_slug, area_id) values (v_old_slug, p_into)
  on conflict (old_slug) do update set area_id = excluded.area_id;
  perform private.refresh_area_live(p_into);
end;
$$;
revoke execute on function public.merge_areas(uuid, uuid) from public, anon, authenticated;
grant execute on function public.merge_areas(uuid, uuid) to service_role;

-- ---------- 5. Addo → Sundays River Valley ----------
update public.areas
set name = 'Sundays River Valley',
    slug = 'sundays-river-valley',
    intro = 'Elephant country, with Addo Elephant National Park on the doorstep. Hosts in the Sundays River Valley know which drives and trails are worth your morning.'
where slug = 'addo';

-- Recompute every area once now that visibility is automatic.
select private.refresh_area_live(id) from public.areas;
