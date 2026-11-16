# PostgreSQL CI readiness

The PostgreSQL integration workflow must verify the service is accepting
connections before running Prisma migrations or database-backed tests.

## Acceptance checks

- Run `pg_isready` against the CI service host with bounded retries.
- Fail the job if the database never becomes ready.
- Keep the connection string on the workflow job and never print credentials.
- Only start migrations and integration tests after PostgreSQL is healthy.
- Do not alter the production migration baseline or historical trip memberships.

This step is an infrastructure hardening gate, not a substitute for browser E2E.
