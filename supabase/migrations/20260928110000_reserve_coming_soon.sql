-- Reserve the coming-soon gate routes so no host or area can take them as a slug.
create or replace function private.reserved_slugs()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'explore', 'x', 'o', 'b', 'host', 'hosts', 'areas', 'for-hosts', 'for-operators',
    'operator', 'operators', 'admin', 'login', 'auth', 'invite', 'about', 'help', 'terms',
    'privacy', 'cancellations', 'operator-terms', 'how-it-works', 'api', 'search', 'book',
    'bookings', 'account', 'settings', 'static', 'images', 'favicon.ico', 'robots.txt', 'sitemap.xml',
    'coming-soon', 'preview'
  ]
$$;
