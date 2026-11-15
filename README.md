# ec-viagens ♡

Trip planning for annual friends' gatherings, built with Next.js, React,
TypeScript, Prisma and the Erika Carvalho React design system v2.

## Development

Requires Node.js 20+, npm, and PostgreSQL.

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL and AUTH_SECRET before continuing.
npm run db:generate
npm run db:migrate
npm run dev
```

Generate a secure local secret using `openssl rand -base64 32`.
Do not commit real credentials.

## Authentication and trip permissions

- Register with a name, unique email, and password (minimum 12 characters).
- Credentials are verified server-side using salted scrypt hashes.
- Auth.js maintains an HTTP-only JWT-based session.
- The dashboard requires authentication.
- Trip creation persists to PostgreSQL and atomically creates an ADMIN membership.
- Trip listing is filtered to the authenticated user's memberships.
- Trip read checks membership; trip update requires an ADMIN membership.
- Member invitations, role assignment, payments, photo uploads and transport
  coordination are not yet available.

## Design system

React v2 components are vendored from the design system until the package is
published. See `src/design-system/UPSTREAM.md`.

## Checks

```bash
npm run db:generate
npm run typecheck
npm run lint
npm run build
```

The CI workflow runs these checks. It does not provision a PostgreSQL instance,
so end-to-end database operations must be verified against a configured database.

## Production security follow-ups

Before public deployment, add email verification, password reset, rate limiting
on registration and login, audit logging, session invalidation, and full
authorization tests. Do not store production secrets in the repository.

## Test-driven development

All new behavior must follow **Red → Green → Refactor**:

1. Write a focused failing test that describes the expected behavior.
2. Implement only enough production code to pass.
3. Refactor with all tests green.

Tests use Vitest and live next to their feature modules. Run `npm test` for
the full unit suite or `npm run test:watch` while developing. GitHub Actions
runs tests before typecheck, lint, and build. New PRs must include tests for
happy paths, authorization failures, validation, and edge cases.

Unit tests use mocked database boundaries; they do **not** replace PostgreSQL
integration tests for transactional concurrency, database constraints, and
authentication end-to-end. Add those before production release.
