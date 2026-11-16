# Expired invitation renewal

Trip administrators can generate a replacement link for a pending invitation
whose seven-day validity has expired. The original invitation is marked EXPIRED
and the new one has a fresh seven-day validity period. Both operations happen
in one transaction. Already accepted or revoked invitations cannot be renewed.

Only the hash of the new token is persisted. The generated URL is displayed
once for copying or WhatsApp sharing, and cannot be recovered later.

Regular members cannot generate or renew invitations. Renewal never removes
trip memberships or access to archived trips.
