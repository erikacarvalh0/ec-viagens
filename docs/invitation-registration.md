# Invitation onboarding

When a participant opens an invitation without an account, the
registration link carries a validated callback path. Registration
passes it to the login page, and login returns the participant to
the original invitation so they can accept it.

The same callback is retained when switching between login and
registration. Only local paths matching /invite/<64 lowercase hex>
are accepted, preventing open redirects.

Accepting the invitation continues to create the TripMember record.
Existing memberships and access to archived trip history are unaffected.
