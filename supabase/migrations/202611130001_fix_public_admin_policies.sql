drop policy if exists "Admins manage categories" on public.categories;
drop policy if exists "Public read published products" on public.products;
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Public read images for published products" on public.product_images;
drop policy if exists "Admins manage product images" on public.product_images;
drop policy if exists "Admins upload product images" on storage.objects;
drop policy if exists "Admins update product images" on storage.objects;
drop policy if exists "Admins delete product images" on storage.objects;
drop policy if exists "Published product images are readable" on storage.objects;

create policy "Admins manage categories" on public.categories
for all to authenticated
using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
)
with check (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Public read published products" on public.products
for select to anon, authenticated
using (
  published
  or exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Admins manage products" on public.products
for all to authenticated
using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
)
with check (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Public read images for published products" on public.product_images
for select to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and (
        p.published
        or exists (select 1 from public.admin_users au where au.user_id = auth.uid())
      )
  )
);

create policy "Admins manage product images" on public.product_images
for all to authenticated
using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
)
with check (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Admins upload product images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Admins update product images" on storage.objects
for update to authenticated
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
)
with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Admins delete product images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "Published product images are readable" on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.product_images i
    join public.products p on p.id = i.product_id
    where i.storage_path = name
      and (
        p.published
        or exists (select 1 from public.admin_users au where au.user_id = auth.uid())
      )
  )
);
