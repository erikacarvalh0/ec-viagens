# PostgreSQL integration testing

CI provisions a disposable PostgreSQL 16 service, synchronizes the Prisma schema using `prisma db push`, and executes persistence and uniqueness tests. The integration suite is opt-in locally with `RUN_POSTGRES_INTEGRATION=1`; ordinary unit tests skip it. `db push` is for disposable test databases only, not production migrations.
