# WhatsApp webhook request size limit

Meta delivery callbacks are capped at 1 MiB. The endpoint checks Content-Length when provided and enforces the limit while streaming the body. Oversized callbacks return HTTP 413 without JSON parsing or reconciliation. The HMAC signature is still verified against the exact raw body before processing valid-sized callbacks. Configure matching limits at the reverse proxy and monitor 413 rates.
