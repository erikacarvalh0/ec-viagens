# PostgreSQL password reset integration

The PostgreSQL CI workflow now verifies single-use consumption and expiration of stored password reset tokens against a real database. Test users and their tokens are cleaned up through cascade deletion. This test does not expose a public reset endpoint.
