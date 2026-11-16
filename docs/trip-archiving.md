# Trip archiving

Admins can archive and restore trips from the trip overview.
Archiving sets a nullable `Trip.archivedAt` timestamp without deleting
payments, participants, invitations or private photos. All existing
trip permissions remain in force. The dashboard defaults to active
trips and offers a toggle to view archived trips.

Archived trips remain accessible by direct URL and retain existing
workflows; archiving is organizational, not a read-only lock.
A future enhancement may restrict modifications on archived trips.

Deploy: apply the Prisma schema change to PostgreSQL before deploying
the application. For existing databases, run the project's migration
workflow or `npx prisma db push` in development.
