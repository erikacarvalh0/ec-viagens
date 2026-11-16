# fix(auth): :shield: reject malformed stored password hashes

Validates stored salt and key hex strings before scrypt, rejecting malformed hashes safely.
