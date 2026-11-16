# Password reset request cooldown

For existing accounts, the internal password reset request service suppresses additional token issuance if any reset token was created within the previous 15 minutes. The check applies even if the prior token has been used. This is a defense-in-depth account cooldown, **not an atomic rate limit**: concurrent requests can still race. Before exposing a public endpoint, add atomic account/IP throttling, generic responses and delivery failure handling. Do not disclose whether an account exists or is in cooldown.
