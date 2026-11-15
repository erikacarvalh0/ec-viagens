# WhatsApp payment reminder delivery

This integration is **disabled by default**. It sends only when
`WHATSAPP_REMINDERS_ENABLED=true` and an authenticated scheduler calls
`GET /api/cron/payment-reminders` with `Authorization: Bearer <CRON_SECRET>`.

Configure the server environment:

```env
CRON_SECRET="replace-with-a-long-random-secret"
WHATSAPP_ACCESS_TOKEN="your-meta-system-user-token"
WHATSAPP_PHONE_NUMBER_ID="your-whatsapp-phone-number-id"
WHATSAPP_GRAPH_VERSION="v23.0"
WHATSAPP_PAYMENT_TEMPLATE="payment_reminder"
WHATSAPP_REMINDERS_ENABLED="false"
```

Create and get approval for a **pt_BR utility template** named
`payment_reminder` with two body parameters in this order:
participant name and payment URL. Adjust the template name in the
environment if you use a different approved name. This integration
requires a configured WhatsApp Business Platform phone number and
appropriate recipient permissions. A scheduler must invoke the endpoint
periodically; no schedule is automatically provisioned by this PR.

The worker claims each notification atomically and checks the current
charge status, phone number and explicit consent immediately before
sending. Paid, refunded, cancelled or opted-out recipients are skipped.

**Operational limitation:** A network timeout may happen after Meta
accepted a message. Such notifications are marked `REVIEW_REQUIRED`
instead of being retried automatically to avoid duplicate sends.
`SENT` means Meta accepted the API request, **not** that the message
was delivered. Delivery receipts, manual review tools, and stale
`PROCESSING` recovery are separate follow-ups.

Enable sending only after testing the approved template with authorized
test recipients and reviewing the privacy/consent policy.
