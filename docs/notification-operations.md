# Notification operations

When the scheduled worker runs, notifications stuck in `PROCESSING`
for more than 30 minutes are marked `REVIEW_REQUIRED`. This uses a
`processingStartedAt` timestamp set at the moment the worker claims
a notification. Existing processing records with no timestamp are not
automatically changed and should be reviewed manually.

Trip administrators can close `REVIEW_REQUIRED` notifications from the
delivery dashboard. Closing a review sets status to `REVIEWED` and
**does not send or retry** a WhatsApp message.

Always check Meta's message history before closing an uncertain delivery.
A timeout can occur after Meta accepts a message, so automatic retries
can produce duplicate notifications.

Database schema change: add `Notification.processingStartedAt`.
Apply the Prisma schema change to deployed databases before enabling the worker.
