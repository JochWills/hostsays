-- Count a storefront visit (docs/07-host-attribution.md). Called by the server (proxy) with the service
-- role, once per browser session per host; bots are filtered out before calling. Days are SA calendar days.
create function public.record_storefront_visit(p_host_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.storefront_visits (host_id, day, count)
  select p_host_id, (now() at time zone 'Africa/Johannesburg')::date, 1
  where exists (select 1 from public.hosts where id = p_host_id and status = 'verified')
  on conflict (host_id, day) do update set count = public.storefront_visits.count + 1
$$;

revoke execute on function public.record_storefront_visit(uuid) from public, anon, authenticated;
grant execute on function public.record_storefront_visit(uuid) to service_role;
