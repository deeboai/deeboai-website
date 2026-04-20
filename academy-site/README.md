# Academy Site

This directory contains the standalone Deebo Academy site that is intended to deploy separately from the main `deeboai.com` app.

## Netlify Setup

1. Create a second Netlify site that points at this same repository.
2. Set the site's base directory to `academy-site`.
3. Set the build command to `npm run build`.
4. Add the same Academy intake environment variables used by the main app:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `ACADEMY_FROM_EMAIL`
   - `ACADEMY_NOTIFICATION_EMAIL`
5. Add `academy.deeboai.com` as the custom domain for that Netlify site.

## Local Run

```bash
cd academy-site
npm install
npm run dev
```
