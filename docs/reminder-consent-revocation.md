# WhatsApp consent revocation

Revoking reminder consent now cancels pending payment reminders addressed to the user's saved WhatsApp number. Already claimed messages are not automatically cancelled: the dispatcher rechecks the user's current consent immediately before sending. Notifications for other recipients are not touched. The cancellation is scoped by recipient number, so shared numbers are not supported as independent consent identities; revisit this if the product allows multiple users per number.
