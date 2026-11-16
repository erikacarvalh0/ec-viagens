# Password reset token persistence

Reset tokens are 32 random bytes and stored only as SHA-256 hashes. Records expire after one hour and are atomically claimed once. This change adds the Prisma model; a database migration, email delivery and password update flow are still required. Token consumption and password update should be combined into a single transaction when implementing the reset endpoint.
