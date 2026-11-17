# EC Viagens — production release runbook

## Release gates

- Merge only PRs with passing Application CI, PostgreSQL Integration and Prisma Schema Check.
- Run full end-to-end smoke tests on a production-like environment: signup, login, reset, trip creation, invitation, archiving, historical membership, payment webhook, opt-out and private photo access.
- Confirm that an archived trip remains visible to **all existing participants**. Never delete historical trip memberships on archive.
- Confirm environment variables are configured in the deployment secret manager, not committed to Git. Validate Asaas and WhatsApp sandbox versus production credentials separately.
- Verify HTTPS, secure session cookies, webhook signatures, private storage permissions, rate limits and access-control boundaries.
- Verify the database backup schedule and perform a **restoration drill** on an isolated environment before release.
- Verify health checks, error monitoring, alerts for payment webhook failures, WhatsApp delivery backlog and storage failures.

## Private beta monitoring gates

Configure an external HTTPS probe of /api/health (every minute); alert the operator after three consecutive non-200 responses. Confirm a 503 produces a readiness_failed event and the response X-Request-Id matches the log. Do not expose raw logs to beta users.

Configure log alerts for payment_reconciliation_failed and reminder_processing_failed (any event), and review notification REVIEW_REQUIRED backlog every day. A correlation ID is diagnostic only, not an authorization token. Never log provider payloads or credentials. Exercise these alerts in staging before enabling real integrations.

Record alert destination, operator, test date, and evidence in the release record. Until the checks are verified, real payments and automatic WhatsApp must remain disabled through deployment configuration or an independently verified feature gate.

## Deployment sequence

1. Capture release SHA, migration list, environment and rollback owner.
2. Take a verified database backup and record the restore point.
3. Apply versioned Prisma migrations with `prisma migrate deploy` before enabling new application traffic.
4. Deploy the release artifact and run smoke tests on all critical flows.
5. Check application errors, webhook delivery, notification queues and database health.
6. Record approval, deployment SHA and operational evidence.

## Incident response and rollback

- Pause new deployments and notify the responsible operator.
- For application regressions, redeploy the previously known-good artifact.
- **Do not blindly roll back applied database migrations.** Assess forward fixes or a tested restoration plan, including potential data loss.
- For failed Asaas webhooks, reconcile event identifiers and payment states before retrying. Never blindly issue a second charge.
- For WhatsApp failures, preserve idempotency and opt-out records; review unknown delivery state before requeueing.
- For private photos, validate storage access policy before reopening uploads.
- Record incident timeline, impact, resolution and follow-up actions.

## Privacy and retention

Document legal basis, retention period, deletion/export procedures and access audit for personal data under LGPD. Confirm production log redaction for tokens, credentials, WhatsApp numbers and payment payloads. Archived trips retain historical member links unless a separately reviewed privacy deletion policy applies.

**Status:** operational checklist only; deployment, backups, restore drills, monitoring and E2E checks must be verified in the real environment before declaring version 1.0 ready.
