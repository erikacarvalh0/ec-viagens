# WhatsApp provider request timeout

WhatsApp Cloud API requests now have a 10-second deadline. The existing notification worker should treat timeout failures as retryable according to its retry policy. Since a timed-out request may have been accepted by the provider, retries must be deduplicated at the business-event level to avoid duplicate reminders.
