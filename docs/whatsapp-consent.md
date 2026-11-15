# WhatsApp payment reminder consent

Users can explicitly opt in or withdraw their permission at
`/settings/notifications`. Consent is stored as a nullable timestamp on
`User.paymentReminderConsentAt` and defaults to **not granted**.

The reminder scheduling action checks this timestamp before queueing.
A future sending worker **must check consent again immediately before
sending**, as well as payment status and the current phone number.

The opt-in covers payment reminders from this application only. Do not
reuse it for promotional messages. This phase does not send messages.
