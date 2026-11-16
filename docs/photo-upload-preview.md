# Photo upload preview

The gallery upload form displays a browser-local preview of the
selected JPEG/PNG before submission. Selection validation checks
format, empty files and the 5 MB limit, providing immediate feedback.

The preview uses an object URL and revokes it when the selection
changes or the component unmounts. Successful uploads clear the
selection and reset the form; failed uploads preserve the selection
so the participant can retry.

Server-side content validation, Sharp normalization and private S3
storage remain authoritative. Client checks are only for usability.
