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

For finance--task-11, supported events also compare `payment.value` (gross
BRL amount, not `netValue`) with the current local `Charge.amountCents` inside
the serializable transaction. Missing values, fractions of a cent, unsafe
amounts and mismatches produce a `PAYMENT_AMOUNT_MISMATCH` PaymentEvent with
the original event and local/remote amounts in cents. The response is
`{ "result": "divergent" }` (HTTP 200), and the charge and report balances
remain unchanged. Invalid negative/nonfinite values fail schema validation.

Repeated event IDs return `duplicate`, including discrepancies. After checking
the amount in Sandbox and correcting the source, a new provider event ID with
a matching value can reconcile through the existing status guards. Replaying
the same ID never applies a second update. No remote payment is created or
modified. Inspect PaymentEvent records for discrepancies; this change does not
add a dashboard or reconcile the Asaas account's available bank balance.

Run `npm test -- src/features/payments/webhook.test.ts` for mocked matching,
divergent, duplicate and corrected-event scenarios without contacting Asaas.
