# Atomic password reset completion

Validates the token and new password, hashes the new password, then atomically claims the single-use token and updates the user's password in one serializable database transaction. The transaction rolls back if the update fails. The public reset request/confirmation UI, email delivery, throttling, and production migration remain separate work.
