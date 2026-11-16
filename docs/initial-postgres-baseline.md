# Initial PostgreSQL migration baseline

The initial migration creates the original eleven tables and five enums. The existing subsequent migration creates `PasswordResetToken` separately. Fresh empty PostgreSQL 16 databases are validated in CI with `npx prisma migrate deploy`, followed by `prisma migrate diff --from-url ... --to-schema-datamodel ... --exit-code` to detect drift, then integration tests.

For **existing databases created using `prisma db push`**, do not apply this baseline to populated tables: first reconcile actual schema and mark the baseline as applied using `prisma migrate resolve --applied 20261115000000_initial_baseline` only after review. Verify migration status and schema drift before production rollout.
