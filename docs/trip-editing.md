# Editing trips

Trip administrators can edit the name, optional dates, location and
HTTPS map link at `/trips/:tripId/edit`. The server action validates
the same schema used for creation and requires administrator membership.
The edit page also checks permissions server-side.

Deletion is intentionally not included here: trips can have Asaas
charges and private S3 photos, so deleting only the database record
would leave external resources orphaned. A separate deletion workflow
must define external cleanup, financial retention and safe confirmation.
