-- Area names aren't sensitive, and hosts/experiences in not-yet-live areas still need their area label.
-- `is_live` now only controls which areas the site lists, not whether they can be read.
drop policy "areas: public reads live" on public.areas;
drop policy "areas: signed-in users read all" on public.areas;
create policy "areas: anyone reads" on public.areas
  for select to anon, authenticated
  using (true);
