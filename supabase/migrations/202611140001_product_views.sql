alter table public.products
  add column if not exists view_count bigint not null default 0 check (view_count >= 0);

create or replace function public.increment_product_view(product_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products
  set view_count = view_count + 1
  where slug = product_slug and published;
$$;

revoke all on function public.increment_product_view(text) from public, anon, authenticated;
grant execute on function public.increment_product_view(text) to service_role;