# Asaas payment webhooks

Configure the Asaas dashboard webhook endpoint as:

```text
https://<your-deployed-domain>/api/webhooks/asaas
```

Set the webhook authentication token in the Asaas dashboard and set the same
secret as `ASAAS_WEBHOOK_TOKEN` in your server environment. The endpoint
checks the `asaas-access-token` header with a timing-safe comparison.

Subscribe to payment events, including `PAYMENT_CONFIRMED`,
`PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`,
`PAYMENT_REFUNDED`, and `PAYMENT_RESTORED`.

Event IDs are stored uniquely in `PaymentEvent` to make retries idempotent.
A successful webhook returns HTTP 200; database errors return HTTP 500 so
Asaas can retry. Unsupported events return HTTP 200 without modifying charges.

**Important:** use Sandbox for initial validation. Payment links are issued in
the previous phase; this endpoint only reconciles existing local charges.
Monitor failures and reconcile discrepancies in the Asaas dashboard before
attempting to reissue a charge.
