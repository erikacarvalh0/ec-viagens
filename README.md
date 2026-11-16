# EC Viagens ♡

Private group-trip planning application built with Next.js 15, React 19,
TypeScript, Prisma 6, PostgreSQL, Auth.js, Sass and Vitest.

## Local development

Requires Node.js 22+, npm and PostgreSQL.

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL and AUTH_SECRET.
npm run db:generate
npm run db:migrate
npm run dev
```

Generate a local secret with `openssl rand -base64 32`. Never commit secrets.

## Available functionality

- Email/password registration, login, authenticated sessions and profile editing.
- Signup email verification with single-use links and authenticated resend.
- Member-only trips, admin editing, safe empty-trip deletion, archive/restore.
- Active and archived trip history; membership and historical access are retained.
- Trip search and departure-date sorting.
- Invitation links with expiry, revocation, renewal and signup/login return flow.
- Member/admin roles and responsibilities.
- Travel information, ride offers, Uber/van interest and ride coordination.
- Payment plans, individual Asaas charges, webhook reconciliation and recovery.
- Financial reports, member balances and CSV export.
- Opt-in WhatsApp payment reminders, scheduling, delivery tracking and review.
- Private S3 photo gallery, thumbnails, captions, downloads and filters.

## Authorization

All trip-specific reads require membership. Administrative actions require
an ADMIN membership. Archiving a trip does **not** remove memberships:
participants must retain access to previous trips and their records.

## Quality checks

```bash
npm run db:generate
npm test
npm run typecheck
npm run lint
npm run build
```

GitHub Actions runs unit tests, typecheck, lint and build. Unit tests use mocked
database boundaries; PostgreSQL integration and end-to-end tests remain
necessary before production.

## Production readiness backlog

- Public password reset requests and broader rate limiting.
- Database-backed integration tests and browser E2E coverage.
- Security, privacy/LGPD and authorization audit.
- Observability, production deployment and operations documentation.
- Additional photo album and bulk-selection workflows.

See `docs/` for feature-specific details and configuration notes.
