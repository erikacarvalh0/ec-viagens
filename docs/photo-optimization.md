# Photo optimization

Uploads are decoded with Sharp after JPEG/PNG signature validation.
The original upload is **not** stored. The application generates:
- A JPEG of at most 1600 × 1600 pixels (aspect ratio preserved).
- A JPEG thumbnail of at most 360 × 360 pixels.

The processing pipeline applies EXIF orientation and outputs new JPEG
files without preserving source EXIF metadata, including GPS coordinates.
Images above 40 megapixels are rejected by the image decoder.

Both variants are stored in the private S3 bucket and accessed through
the same authenticated photo endpoint. `?size=thumb` selects the
thumbnail; legacy photos without a thumbnail fall back to the original.

The gallery uses thumbnails for faster browsing and provides a link
to the larger image. On deletion, both S3 objects are removed.

**Deployment:** install the new `sharp` dependency and apply the
Prisma schema change (`Photo.thumbnailKey` nullable) before deploying.
The server must have enough memory for image decoding. Existing photos
do not require migration of stored objects.
