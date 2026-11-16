# Gallery multipart upload size enforcement

The photo upload route enforces a 5 MiB image limit plus 4096 bytes of multipart overhead. It checks Content-Length when present and also counts bytes while streaming before parsing multipart form data. This prevents clients from bypassing the limit by omitting or falsifying Content-Length. Requests exceeding the limit return HTTP 413 without invoking image processing or S3 storage. Keep an equivalent request body limit at the edge or reverse proxy.
