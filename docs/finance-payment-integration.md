# Finance payment lifecycle integration (finance--task-13)

`src/integration/payment-lifecycle.test.ts` exercises the real charge action,
Asaas HTTP adapter, webhook route, reconciliation transaction and participant
payments page against PostgreSQL. Only the authenticated session, Next cache
invalidation and outgoing provider HTTP boundary are simulated. No Asaas account
or real provider credentials are needed, and unexpected provider requests fail.

The scenario checks the local reference and amount sent to the provider, the
returned payment link, rejection of an unauthenticated webhook, persistence of
the payment event and paid date, duplicate callback handling, and the page's
change from a pending charge to one paid charge after reloading its data.

Use a disposable PostgreSQL database with the repository migrations applied:

```bash
npm install
npm run db:generate
# Set DATABASE_URL to the disposable database before applying migrations.
npx prisma migrate deploy
RUN_POSTGRES_INTEGRATION=1 npm test -- src/integration/payment-lifecycle.test.ts
```

The test creates uniquely named fixtures and removes its plans, charges, events,
memberships, trip and users afterward. Like the other PostgreSQL integration
tests, it is skipped unless `RUN_POSTGRES_INTEGRATION=1`.

Interface assertions use React's server-rendered HTML from the actual payments
page. This covers updated page data and payment links on reload; browser form
interaction, client hydration and automatic refresh are outside this test.
