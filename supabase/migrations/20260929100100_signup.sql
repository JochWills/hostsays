-- Self sign-up for guests, hosts and operators. Hosts and operators start as 'pending' until admin verifies them.

-- Reserve the sign-up routes and the operator one-tap links (/r/[token]).
create or replace function private.reserved_slugs()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'explore', 'x', 'o', 'b', 'r', 'host', 'hosts', 'areas', 'for-hosts', 'for-operators',
    'operator', 'operators', 'admin', 'login', 'signup', 'sign-up', 'join', 'auth', 'invite', 'about', 'help',
    'terms', 'privacy', 'cancellations', 'operator-terms', 'how-it-works', 'api', 'search', 'book',
    'bookings', 'account', 'settings', 'static', 'images', 'favicon.ico', 'robots.txt', 'sitemap.xml',
    'coming-soon', 'preview'
  ]
$$;

-- When the host agreed to the host terms at sign-up (operators already have operator_private.terms_accepted_at).
alter table public.host_private add column terms_accepted_at timestamptz;

-- 'Anna''s B&B, Kenton!' → 'anna-s-b-b-kenton'
create function private.slugify(p_value text, p_max int)
returns text
language sql
immutable
set search_path = ''
as $$
  select rtrim(left(trim(both '-' from regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9]+', '-', 'g')), p_max), '-')
$$;

-- Creates the HostSays profile (and pending host/operator) for a confirmed auth user, from the details
-- they gave at sign-up. Validated in lib/validation/auth.ts first; called by the server with the
-- service role only. Idempotent: if the profile already exists, returns its role and changes nothing.
create function public.complete_signup(p_user_id uuid, p_email text, p_type text, p_data jsonb)
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
       or exists (select 1 from public.areas where slug = v_slug) loop
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

revoke execute on function public.complete_signup(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.complete_signup(uuid, text, text, jsonb) to service_role;
