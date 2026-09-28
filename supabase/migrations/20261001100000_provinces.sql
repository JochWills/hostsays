-- Provinces above areas (towns): Eastern Cape → Gqeberha, Addo, … All 9 are shown on the site; a province
-- with nothing listed yet says so. Province pages live at the top level (/eastern-cape), like areas and hosts.
create table public.provinces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  intro text,
  sort_order int not null default 0,
  constraint provinces_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40)
);

alter table public.provinces enable row level security;
grant select on public.provinces to anon, authenticated;
create policy "provinces: anyone reads" on public.provinces for select to anon, authenticated using (true);

insert into public.provinces (slug, name, sort_order, intro) values
  ('eastern-cape', 'Eastern Cape', 1, 'Big Five reserves, wild beaches and warm river towns, from Addo to the Sunshine Coast.'),
  ('western-cape', 'Western Cape', 2, 'Mountains, winelands and the Garden Route, picked by the hosts who live there.'),
  ('kwazulu-natal', 'KwaZulu-Natal', 3, 'Warm Indian Ocean beaches, the Drakensberg and Zululand game reserves.'),
  ('gauteng', 'Gauteng', 4, 'City food, culture and history in Johannesburg and Pretoria.'),
  ('mpumalanga', 'Mpumalanga', 5, 'The Panorama Route, the Lowveld and the edge of the Kruger.'),
  ('limpopo', 'Limpopo', 6, 'Bushveld, baobabs and quiet private reserves.'),
  ('free-state', 'Free State', 7, 'Wide skies, sandstone mountains and slow country towns.'),
  ('north-west', 'North West', 8, 'Pilanesberg, Madikwe and the Magaliesberg.'),
  ('northern-cape', 'Northern Cape', 9, 'Spring flowers, desert stars and the Orange River.');

alter table public.areas add column province_id uuid references public.provinces;
update public.areas set province_id = (select id from public.provinces where slug = 'eastern-cape');
alter table public.areas alter column province_id set not null;
create index on public.areas (province_id);

-- Provinces, areas and hosts share the top-level namespace: no slug may be used twice across them.
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
  return new;
end;
$$;
create trigger provinces_slug_check before insert or update of slug on public.provinces
  for each row execute function private.check_top_level_slug();

-- New hosts pick a free slug at sign-up: skip province slugs too.
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
begin
  select role into v_role from public.profiles where id = p_user_id;
  if found then
    return v_role;
  end if;

  if p_type not in ('guest', 'host', 'operator') then
    raise exception 'Unknown account type "%"', p_type using errcode = '22023';
  end if;
  v_role := p_type::public.user_role;

  insert into public.profiles (id, role, full_name, phone)
  values (p_user_id, v_role, p_data ->> 'fullName', nullif(p_data ->> 'phone', ''));

  if v_role = 'host' then
    v_base := private.slugify(p_data ->> 'name', 34);
    if char_length(v_base) < 3 then v_base := 'host'; end if;
    v_slug := v_base;
    while v_slug = any (private.reserved_slugs())
       or exists (select 1 from public.hosts where slug = v_slug)
       or exists (select 1 from public.areas where slug = v_slug)
       or exists (select 1 from public.provinces where slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    insert into public.hosts (slug, name, type, area_id, status)
    values (v_slug, p_data ->> 'name', (p_data ->> 'hostType')::public.host_type, (p_data ->> 'areaId')::uuid, 'pending')
    returning id into v_id;
    insert into public.host_private (host_id, listing_url, contact_email, contact_phone, terms_accepted_at)
    values (v_id, p_data ->> 'listingUrl', p_email, nullif(p_data ->> 'phone', ''), now());
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
    values (v_slug, p_data ->> 'name', (p_data ->> 'areaId')::uuid, nullif(p_data ->> 'website', ''), 'pending')
    returning id into v_id;
    insert into public.operator_private (operator_id, contact_email, contact_phone, terms_accepted_at)
    values (v_id, p_email, nullif(p_data ->> 'phone', ''), now());
    insert into public.operator_members (operator_id, user_id, is_owner) values (v_id, p_user_id, true);
  end if;

  return v_role;
end;
$$;
