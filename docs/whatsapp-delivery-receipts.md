# WhatsApp delivery receipts

Configure a public HTTPS callback URL:
`https://<your-host>/api/webhooks/whatsapp`

In Meta's WhatsApp Business Platform webhook settings, set the callback
verification token to `WHATSAPP_VERIFY_TOKEN` and subscribe to the
`messages` field. Set `WHATSAPP_APP_SECRET` to the app secret from
Meta. All incoming POST callbacks are authenticated using the raw-body
`X-Hub-Signature-256` HMAC-SHA256 signature.

The endpoint reconciles Meta's `sent`, `delivered`, `read`, and
`failed` statuses against `Notification.providerMessageId`.
Transitions are monotonic: delivered messages cannot be downgraded
to sent, and read messages cannot be downgraded to delivered.
Failures require manual review.

The dashboard reports notification statuses as recorded locally.
Provider callbacks are not guaranteed to arrive in order. This endpoint
does not expose message bodies or phone numbers publicly.

Required environment variables:

```env
WHATSAPP_VERIFY_TOKEN="random-verification-token"
WHATSAPP_APP_SECRET="meta-app-secret"
```

Keep `WHATSAPP_REMINDERS_ENABLED=false` until the end-to-end
configuration and approved templates have been validated.
