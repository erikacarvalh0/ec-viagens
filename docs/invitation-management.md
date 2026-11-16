# Invitation management

Trip administrators can view all invitation statuses and revoke pending
invites from the member management page. Revocation is trip-scoped and
permission-checked server-side. Used and revoked links cannot be
reused; expired links are labeled according to their expiry time.

Invitation secrets are never stored in plaintext, so previously
generated URLs cannot be recovered from the database. The original
single-use invite behavior and seven-day validity remain unchanged.

Archiving a trip does not remove memberships or prevent participants
from accessing their historical trips.
