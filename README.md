# DeeboAI Website + Finance Admin

This repository now runs on Next.js and contains two surfaces:

1. The public DeeboAI marketing site.
2. A protected `/admin` finance and business tracking application backed by Supabase.

The admin app is built as a real transaction/event system:

- Every income payment is its own record.
- Every business expense is its own record.
- Every mileage trip is its own record.
- Every monthly housing row is its own record.
- Every reserve transfer target is its own record.

The app then summarizes those records into dashboard, monthly, quarterly, and yearly views.

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- TanStack Query
- Recharts

## Admin Features

- Dashboard with YTD summaries, business breakdowns, reserve tracking, recent activity, and charts.
- Income CRUD with business/category/date filters and stored net calculations.
- Expense CRUD with business-use allocation and private receipt uploads to Supabase Storage.
- Mileage log with editable mileage-rate defaults and monthly/quarterly summaries.
- Housing deduction tracking with one monthly row per month plus legacy housing-expense support.
- Tax reserve tracking for target vs actual transfers.
- Settings for business management, mileage defaults, reserve defaults, W-2 baseline values, and profile/state info.

## Security Model

- Authentication uses Supabase Auth.
- Every data table is protected by row-level security.
- Each signed-in user only sees rows where `user_id = auth.uid()`.
- Receipt files are stored in a private Supabase bucket.
- Receipt access is restricted to the authenticated owner’s folder path.
- Secrets stay in environment variables, not in the repository.

## Environment Variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
CONTACT_TO_EMAIL=support@deeboai.com
CONTACT_FROM_EMAIL=website@your-verified-resend-domain.com
CONTACT_REPLY_TO_EMAIL=support@deeboai.com
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for the admin app.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and enables username-based sign-in resolution.
- If the service-role key is omitted, email/password sign-in still works.
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` are required for the public contact form.
- `CONTACT_FROM_EMAIL` must use a sending domain verified in Resend.
- `CONTACT_REPLY_TO_EMAIL` is optional. The contact API uses the submitter's email as the reply-to address when available.
- For local contact-form testing, set these values in `.env.local`, run `npm run dev`, open `http://localhost:3000/contact`, and submit the form with a valid name, email, and message.
- For deployed contact-form testing, set the same Resend variables in the deployment host environment, redeploy, and submit a live test message from `/contact`.

## Supabase Setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run the migration in:
   - `supabase/migrations/20260402160000_finance_admin_schema.sql`
   - `supabase/migrations/20260405150000_tax_planning_and_home_office.sql`
   - `supabase/migrations/20260405170000_w2_paychecks.sql`
   - `supabase/migrations/20260405183000_home_office_space_periods.sql`
3. Confirm the private storage bucket `expense-receipts` exists.
4. Create your first auth user in Supabase Auth.
5. Sign in through `/admin`.

The migration creates:

- `profiles`
- `user_settings`
- `businesses`
- `income_entries`
- `expense_entries`
- `mileage_entries`
- `personal_cashflow_entries`
- `tax_reserves`
- `tax_planning_profiles`
- `home_office_profiles`
- `home_office_space_periods`
- `w2_paychecks`
- `assets`

It also creates:

- the `business_kind` enum
- updated-at triggers
- new-user bootstrap trigger
- row-level policies
- private storage policies for receipt uploads

## Local Development

```bash
npm install
npm run dev
```

Open:

- Public site: `http://localhost:3000`
- Admin app: `http://localhost:3000/admin`

## First-Use Behavior

On first authenticated visit to `/admin`, the app bootstraps:

- a `profiles` row if one does not exist
- a `user_settings` row if one does not exist
- default businesses for:
  - HLC Tutoring
  - Consulting / Websites
  - Other Self-Employment

## Project Structure

```text
.
├── public/
│   ├── assets/
│   └── favicon/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── contact/
│   │   ├── deeboai/
│   │   ├── partners/
│   │   ├── products/
│   │   ├── services/
│   │   ├── team/
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── providers/
│   │   └── ui/
│   ├── features/
│   │   └── admin/
│   │       ├── components/
│   │       ├── config/
│   │       ├── hooks/
│   │       ├── lib/
│   │       └── pages/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth.ts
│   │   ├── env.ts
│   │   ├── team-data.ts
│   │   └── utils.ts
│   ├── pages/
│   └── types/
├── supabase/
│   └── migrations/
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

## Deployment

Recommended flow:

1. Deploy the Next.js app to Vercel or another Next-compatible host.
2. Add the same environment variables in the host dashboard.
3. Point the deployed app at the Supabase project.
4. Make sure the Supabase URL is allowed by your deployment environment.

## Assumptions

- W-2 income is tracked in this version as a settings-driven baseline rather than a separate event ledger.
- Username sign-in is implemented by resolving a username to an email server-side.
- Categories are standardized in this version for cleaner reporting; business management is fully editable in-app.
- Mileage and reserve defaults are editable and intentionally not presented as legal or filing advice.

## Verification

Completed locally:

- `npm run typecheck`

Attempted locally:

- `npm run build`

Build notes:

- The app compiles past TypeScript validation.
- In this sandbox, Next’s production build cache has been unstable under `.next/cache/webpack`, so a full production build may need to be re-run in a normal local shell or CI runner if the cache writer stalls.
