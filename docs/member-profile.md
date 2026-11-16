# Member profile

Authenticated members can edit their own name, city, state and
WhatsApp number at `/settings/profile`. Email is displayed but is
not editable in this flow. The server action always derives the user
ID from the authenticated session, not from client input.

WhatsApp numbers use 10–15 digits (including country code as
applicable), consistent with the existing reminder format. Optional
fields may be cleared. Duplicate WhatsApp values are rejected by
the database unique constraint and return a generic safe error.

Updating a profile does not change trip memberships or historical
access. The notification consent setting is managed separately.
