-- Hosts and operators can change their own "Somewhere else" town request from their settings
-- (RLS still limits them to their own row).
grant update (requested_province_id, requested_town) on public.host_private to authenticated;
grant update (requested_province_id, requested_town) on public.operator_private to authenticated;
