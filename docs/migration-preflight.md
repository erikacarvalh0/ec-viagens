# Migration baseline preflight

A dedicated workflow checks that an initial baseline migration precedes additive migrations. The current repository is expected to fail this preflight because it contains only the password-reset-token additive migration. This is an intentional deployment blocker, not proof that the baseline is present. Before deployment, generate and review the complete baseline against the real database and reconcile existing migration history.
