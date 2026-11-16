# Safe trip deletion

Only trip administrators can delete a trip. The edit page requires
typing `EXCLUIR` and a second browser confirmation.

Deletion runs in a serializable transaction and refuses trips with
any photos or financial charges. This avoids leaving private S3
objects orphaned or destroying Asaas payment records. Empty payment
plans, invitations, memberships and their dependent travel/title
records are removed by existing database cascades.

Trips containing financial history cannot be deleted with this
workflow. A future archival feature should preserve financial
records without keeping the trip active. Trips containing photos
must have those photos deleted first through the existing authorized
photo deletion flow.
