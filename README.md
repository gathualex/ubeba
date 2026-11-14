# Ubeba

Responsive product catalog for a Kenya based business sourcing products in the USA. Customers browse products and send inquiries through WhatsApp; the site does not take payments or manage orders.

## Stack

Next.js App Router, React, strict TypeScript, Tailwind CSS v4, Supabase PostgreSQL, Supabase Auth and private Supabase Storage. Supabase SSR cookies are used for server authentication. The migration applies row level security to every application table and storage operation.

## Local setup

Requirements: Node.js 20.9 or later, npm, and a Supabase project.

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

Fill in `.env.local` as described below before connecting Supabase. The public catalog remains in a graceful empty/setup state without the database configuration.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; safe for browser use with RLS enabled. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional server-only key for signing private product image URLs. Never prefix it with `NEXT_PUBLIC_` or expose it to client code. |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL, no trailing slash; use the deployed domain in production |

Never expose a service role or secret API key to the browser. Admin database operations use the signed-in user's session and database RLS; private image signing may use the server-only service role key.

## Supabase project setup

1. Create a Supabase project and copy its URL and publishable key from Project Connect/API settings.
2. Apply all SQL files in `supabase/migrations` in timestamp order using the Supabase SQL Editor or Supabase CLI (`supabase db push`). They create the `categories`, `products`, `product_images`, and `admin_users` tables, indexes, RLS policies, and the private `product-images` bucket with an 8 MB image limit. The public admin-check grant is safe because the function only returns true when the current authenticated user is an administrator.
3. Create the first user in Supabase Dashboard → Authentication → Users using a strong unique password. Copy that user's UUID.
4. Grant the initial administrator role through the trusted SQL Editor only: `insert into public.admin_users(user_id) values ('USER-UUID');`. Do not expose role assignment to the app. Additional admins must also be granted by a trusted operator.
5. Configure Auth site URL as the deployed domain and add local/deployed redirect URLs in Supabase Auth settings.
6. Add the environment variables to `.env.local` locally and to Vercel project settings. Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS domain and keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
7. Set the customer WhatsApp number in `/admin/settings`; the contact is stored in the `site_settings` database table and is not read from an environment variable.
8. Add categories in `/admin/categories`, then products in `/admin/products/new`. Image uploads accept JPEG, PNG, WebP, or AVIF, up to 8 MB each. The storage bucket is private; public images are served with short lived signed URLs only when their product is published.

RLS grants visitors read access only to published products and their images. Admin status is checked from `admin_users` on the server and by the database policies. Category deletion is blocked while products reference the category. Product deletion removes its storage images before deleting the database row. If storage cleanup fails, deletion stops and reports an error.

## Commands

```sh
npm run dev
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

The Playwright responsive suite checks homepage and shop horizontal overflow at 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 1920×1080, and 2560×1440. Without Supabase credentials it exercises the setup/empty states; category, product, and authenticated dashboard workflows need a configured project for end to end checks.

## Deployment

Push the repository to GitHub, import it into Vercel, keep the default Next.js build settings, add the environment variables above to the Vercel project, and deploy. Apply all SQL migrations in `supabase/migrations` to the production Supabase project before launch. Set `NEXT_PUBLIC_SITE_URL` to the HTTPS custom domain and add that domain in Supabase Auth URL configuration. Follow the current Vercel and Supabase commercial terms for your intended usage and check their plans for current quotas and costs. Configure Supabase backups appropriate to the selected plan, monitor Supabase logs and Vercel function errors, and periodically verify a restore process.

Budget for Supabase database compute/storage/egress and any paid backup tier, Vercel hosting/build/function/traffic usage, and custom domain registration. This site uses standard WhatsApp click-to-chat links and does not use a paid WhatsApp API; customers may still incur their usual data charges. Check current provider pricing before launch because quotas and plan prices can change.

## Current scope and operational notes

- `/`, `/shop`, `/categories/[slug]`, and `/product/[slug]` are public pages; `/admin/login`, `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, and `/admin/categories` are administrator routes.
- Product metadata, sitemap, and product detail queries exclude unpublished products. WhatsApp links include product, displayed price, and canonical product URL when configured.
- Product/category text search and catalog sorting use server-side Supabase queries; public catalog reads are bounded.
- Sample inventory is not seeded. Empty catalog is supported. No addresses, delivery timelines, shipping fees, testimonials, or guarantees are asserted.
- Admin product image uploads append images. Existing-image reordering and removal are not yet exposed in the dashboard; remove image rows and storage objects together through a trusted workflow until that UI is added.
- For production, use Supabase's database backups/PITR according to plan, rotate admin passwords, keep dependencies updated, and review authentication and storage logs.
