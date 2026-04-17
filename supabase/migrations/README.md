# `supabase/migrations`

Ordered SQL migrations for the finance/admin schema.

- Name files with a sortable timestamp prefix.
- When a migration changes derived fields, update both the base date/value and any stored rollup columns in the same migration.
- Review production impact before applying data-repair migrations.
