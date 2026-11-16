# Password reset email delivery

This adapter sends a text-only password reset email using the Resend HTTPS API. Configure server-only `RESEND_API_KEY`, `PASSWORD_RESET_FROM_EMAIL` (verified sending domain) and `APP_BASE_URL` (HTTPS public origin). The token is sent only to the target email, never logged. Do not expose these variables to the client. The adapter is not yet wired to a public reset request endpoint. Add per-account/IP rate limiting, generic public responses and delivery-failure handling before public exposure. Avoid logging provider request bodies containing the reset link.
