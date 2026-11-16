# Financial report amount validation

Financial reporting rejects negative, fractional and unsafe integer amounts in cents before aggregation, avoiding invalid totals. Zero-valued charges remain supported. This is a defensive reporting boundary and does not replace database validation.
