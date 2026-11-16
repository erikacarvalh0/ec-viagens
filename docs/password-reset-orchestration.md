# Password reset email orchestration

`requestPasswordResetByEmail` connects the existing reset-token service to the configured Resend delivery adapter. It is an internal orchestration function, **not a public endpoint**. The reset request service already handles unknown accounts and a per-account 15-minute cooldown. Before exposing a public form or route, implement IP-based throttling, concurrency-safe request limits, uniform responses, and production logging that never records tokens.
