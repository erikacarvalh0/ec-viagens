# Signup email verification

Registration attempts to send a verification email after creating the account.
A delivery failure does not undo registration: signed-in users can retry from
`/settings/profile`. Delivery uses the existing Resend configuration:
`RESEND_API_KEY`, `PASSWORD_RESET_FROM_EMAIL` (shared sender), and HTTPS
`APP_BASE_URL`. No new dependency is required.

Apply the additive `20261116010000_email_verification` migration before using
this feature and regenerate the Prisma client. Existing accounts remain
unverified and can request a link from their profile. Verification records a
status; it does not change existing login or trip authorization rules.

The email opens `/verify-email?token=...`. Sign in to the registered account,
then explicitly submit confirmation. Opening a link alone does not consume it.
If sign-in navigates away, reopen the email link. Tokens contain 32 random
bytes; only SHA-256 hashes are stored. Tokens are bound to both the user and
the email at issuance. Confirmation claims the token and updates the matching
account in one serializable transaction. Used tokens, concurrent claims,
changed addresses and expiration at or before the confirmation time fail.

Tokens expire one hour after issuance. Resends are limited to one per minute
and do not invalidate earlier links or extend their expiration. Failed sends
retain the cooldown record; wait one minute before retrying. Already verified
accounts do not receive additional mail. Transaction conflicts return a safe
failure and can be retried.

Unit tests cover sending, failures, authenticated actions, ownership, token
hashing, expiration boundaries and conditional claims. They mock Prisma;
real PostgreSQL concurrency and browser/email delivery still require integration
validation before production.
