# Gallery filters

Trip members can filter the private gallery by the participant who
uploaded a photo and/or by case-insensitive caption text. The uploader
selector is populated from members of the current trip.

Filters are validated server-side and always combined with the
authenticated trip ID. The gallery retains filters while navigating
to older photos. Clearing filters returns to the unfiltered gallery.

Caption search is limited to 100 characters. The filter does not
search image contents or EXIF metadata.
