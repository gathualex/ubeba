-- Public pages use the service-role client to read the public WhatsApp contact.
-- Keep writes restricted to authenticated administrators by the existing RLS policies.
grant select on public.site_settings to service_role;
