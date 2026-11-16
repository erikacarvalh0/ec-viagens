# Private gallery S3 request timeout

All S3 GET, PUT and DELETE requests use a 15-second AbortSignal deadline. Transport failures return a generic error that does not echo upstream exception details or credentials. The existing HTTP-status error handling remains unchanged. A timed-out PUT may still have succeeded remotely; the photo upload handler's best-effort cleanup applies only after it records successful uploads. Operational monitoring and orphan-object cleanup are recommended before launch.
