# Baseline security response headers

Next.js now serves `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a restrictive `Permissions-Policy` for camera, microphone and geolocation. These are defense-in-depth controls, not substitutes for authorization, CSP, rate limiting or a security review. Before deploying behind a reverse proxy, verify it preserves these headers. A tailored Content-Security-Policy and HSTS should be configured with deployment-specific requirements in a separate change.
