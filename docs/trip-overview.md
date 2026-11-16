# Trip overview

Authenticated trip members can view `/trips/:tripId/overview`.
The dashboard summarizes participants, private photos and payment totals.

Administrators see all trip charges. Other members see only their own
charges. Cancelled and refunded charges do not contribute to totals.
All queries are trip-scoped and require membership before execution.

No schema or environment changes are required.
