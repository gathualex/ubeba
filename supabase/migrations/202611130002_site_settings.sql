create table if not exists public.site_settings (
  id text primary key default 'primary',
  whatsapp_phone text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Admins can view site settings" on public.site_settings
for select to authenticated
using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Admins can update site settings" on public.site_settings
for insert to authenticated
with check (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Admins can modify site settings" on public.site_settings
for update to authenticated
using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
)
with check (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Admins can delete site settings" on public.site_settings
for delete to authenticated
using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

insert into public.site_settings (id, whatsapp_phone)
values ('primary', coalesce(current_setting('app.settings.whatsapp_phone', true), ''))
on conflict (id) do nothing;
