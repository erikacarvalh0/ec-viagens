# Prisma migration baseline required

This repository previously used `prisma db push` and did not have an initial baseline migration. The password reset migration is **additive only** for databases that already have the `User` table and no `PasswordResetToken` table. **Do not run `prisma migrate deploy` on a fresh database yet**: the baseline for all existing models is not included in this PR.

Before deploying, inspect the actual production schema and migration history. Generate and review a complete baseline from the current Prisma schema, mark that baseline as applied on an existing matching database with `prisma migrate resolve --applied <baseline_name>`, and then apply additive migrations in order. If the password reset table was already created with `db push`, reconcile that state before applying this migration. Never use `db push` as a production migration strategy.
