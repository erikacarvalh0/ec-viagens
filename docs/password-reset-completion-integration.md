# Password reset completion integration

The PostgreSQL integration suite verifies that a password reset updates the stored hash, consumes the token exactly once, and leaves the password unchanged for expired or reused tokens. Uses a disposable PostgreSQL service and removes test users after execution. Email delivery, request throttling, and production baseline migrations are separate work.
