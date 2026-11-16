# Password reset confirmation UI

The `/reset-password?token=<64-hex-token>` route accepts a one-time token delivered through a future email flow. It validates matching passwords, uses the atomic server-side reset implementation and shows a generic error on invalid/expired tokens. The request form, token delivery, throttling and migration baseline remain separate work. Do not manually share tokens or log URLs containing them.
