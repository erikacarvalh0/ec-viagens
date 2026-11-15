# ec-viagens ♡

Trip planning application for annual friends' gatherings, including planned
participant management, ride sharing, payments, reminders and photos.

## Development

Requirements: Node.js 20+, npm and PostgreSQL for future database work.

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000.

```bash
npm run typecheck
npm run lint
npm run build
```

To prepare Prisma and your configured PostgreSQL database:

```bash
npm run db:generate
npm run db:migrate
```

Set `DATABASE_URL` before running migrations. The browser preview does not
require a database connection.

## Implemented in this PR

- Responsive dashboard, navigation, empty state and trip detail view.
- Create a trip with name, optional dates, location and HTTPS map link.
- Validate trip fields and date order with Zod.
- Store preview trips **only in the current browser** using localStorage.
- Model trips, membership roles, invitations, travel, payments and photos in Prisma.
- Reuse the **actual React v2 design-system component APIs**: Button, Card,
  Input and Select (locally vendored and reformatted).

## Design system integration

The reference repository is:
https://github.com/erikacarvalh0/erikacarvalho-ds

Its React v2 package is in `packages/react`, named `@erikacarvalho/react`.
It has not yet been published. Therefore the four primitives and their tokens
are sourced from upstream commit
`915106759794f25d7f0751bdfd16ea2e55454623`
and stored under `src/design-system`.

See `src/design-system/UPSTREAM.md` for replacement/migration notes.
This avoids pretending that a non-published dependency can be installed.

## Limitations

**This is a local preview, not a production multi-user application.** Trips
are not saved to PostgreSQL and are not shared between members. There is
no authentication or authorization yet. The participants, payments,
transportation and gallery sections are placeholders.

Do not add unauthenticated write endpoints for trips, members or payments.
The next milestone is secure authentication, trip-scoped RBAC and Prisma-backed
operations. Asaas and WhatsApp integrations come after that.

## Git and coding conventions

Use feature branches and readable two-space indentation. Commit and PR
content must be written in English and follow Conventional Commits + Gitmoji:

```text
feat(trips): :sparkles: add trip creation
fix(ui): :bug: correct date validation
chore(ci): :wrench: add build verification
```
