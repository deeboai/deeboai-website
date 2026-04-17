# `src/app/admin`

Admin route entrypoints.

- Auth gating happens at the route level.
- In production, the middleware exposes these routes through `admin.deeboai.com` and rewrites clean subdomain paths back to the internal `/admin/...` routes.
- UI and data behavior live under `src/features/admin`.
- Legacy routes that are no longer first-class should redirect instead of duplicating UI.
