create extension if not exists pgcrypto;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "Admins may view their own role" on public.admin_users for select to authenticated using (auth.uid() = user_id);
create policy "Trusted postgres may assign admin roles" on public.admin_users for insert to postgres with check (true);

create or replace function public.is_ubeba_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_ubeba_admin() from public;
grant execute on function public.is_ubeba_admin() to anon, authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_path text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  price numeric(12,2) check (price is null or price >= 0),
  currency text not null default 'KES' check (currency = 'KES'),
  price_on_request boolean not null default false,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'available' check (status in ('available','reserved','sold')),
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_published_idx on public.products(published);
create index products_category_idx on public.products(category_id);
create index products_created_idx on public.products(created_at desc);
create index products_featured_idx on public.products(featured) where published;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id,sort_order);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
create policy "Public read categories" on public.categories for select to anon,authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_ubeba_admin()) with check (public.is_ubeba_admin());
create policy "Public read published products" on public.products for select to anon,authenticated using (published or public.is_ubeba_admin());
create policy "Admins manage products" on public.products for all to authenticated using (public.is_ubeba_admin()) with check (public.is_ubeba_admin());
create policy "Public read images for published products" on public.product_images for select to anon,authenticated using (exists (select 1 from public.products p where p.id=product_id and (p.published or public.is_ubeba_admin())));
create policy "Admins manage product images" on public.product_images for all to authenticated using (public.is_ubeba_admin()) with check (public.is_ubeba_admin());

-- Table grants allow the API operations; RLS above still limits which rows are visible or writable.
grant select on public.admin_users to authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',false,8388608,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=false,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif'];
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.is_ubeba_admin());
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id='product-images' and public.is_ubeba_admin()) with check (bucket_id='product-images' and public.is_ubeba_admin());
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.is_ubeba_admin());
create policy "Published product images are readable" on storage.objects for select to anon,authenticated using (
  bucket_id='product-images' and exists (
    select 1 from public.product_images i join public.products p on p.id=i.product_id
    where i.storage_path=name and (p.published or (auth.uid() is not null and public.is_ubeba_admin()))
  )
);
