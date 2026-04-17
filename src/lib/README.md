# `src/lib`

Shared application utilities.

- Cross-cutting helpers, auth helpers, environment utilities, and shared data modules live here.
- `admin-routing.ts` owns the public-vs-internal admin URL mapping so the admin app can live at `admin.deeboai.com` without duplicating the codebase.
