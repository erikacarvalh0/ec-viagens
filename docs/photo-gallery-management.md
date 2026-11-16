# Photo gallery management

The gallery shows 24 photos per page with a cursor based on the photo
ID, in descending order. Use the next-page link to load older photos.

A photo may be deleted by its uploader or any trip administrator.
Deletion requires current trip membership and is scoped to the trip.
The S3 object is removed before its database record is deleted.

**Operational caveat:** if S3 deletion succeeds but the database
operation fails, the gallery can temporarily reference a missing object.
Such cases require reconciliation. Deletion is permanent and is not
reversible.

S3 credentials now also require `s3:DeleteObject` on the same private
bucket prefix, in addition to `s3:GetObject` and `s3:PutObject`.

Thumbnails and image metadata stripping are not yet implemented.
