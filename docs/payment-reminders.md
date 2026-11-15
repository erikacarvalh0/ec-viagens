# Payment reminder scheduling

Administrators can schedule a payment reminder for an unpaid trip charge.
The participant must have a valid WhatsApp number and the charge must have
an Asaas payment URL.

Reminders are stored in `Notification` with kind `PAYMENT_REMINDER`.
The unique `(kind, referenceId, scheduledFor)` key prevents duplicate
scheduling for the same charge and calendar day. The initial schedule is
15:00 UTC on the next calendar day (12:00 in São Paulo).

**This phase only queues reminders; it does not send WhatsApp messages.**
No external messaging provider is contacted. Before enabling delivery,
implement explicit messaging consent, approved WhatsApp templates,
a protected scheduled worker, status revalidation immediately before send,
retries, and provider webhook delivery receipts. Do not mark notifications
as sent until the provider accepts them.
