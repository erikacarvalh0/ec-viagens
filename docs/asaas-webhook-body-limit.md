# Asaas webhook body size limit

Authenticated Asaas webhook requests are limited to 1 MiB. The handler checks Content-Length when supplied and also counts streamed bytes, so clients cannot bypass the limit by omitting or falsifying the header. Requests above the limit return HTTP 413 before parsing or reconciliation. Token authentication remains the first gate. This protects the application from unnecessarily large webhook payloads; infrastructure-level body limits and rate limits should also be configured.
