# Downloading trip photos

Any authenticated member of the trip may download a photo through
`GET /api/trips/:tripId/photos/:photoId?download=1`.

The route checks trip membership and scopes the photo lookup to the
trip before reading the private S3 object. Downloads always return
the full-size variant (never a thumbnail), with
`Content-Disposition: attachment`, a generated filename, and
`Cache-Control: private, no-store`.

The gallery includes a "Baixar foto" link for every photo. No
public S3 URL or presigned link is exposed.
