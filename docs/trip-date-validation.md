# Trip date validation

Trip creation and editing now reject malformed and impossible dates, while accepting valid leap days. Empty dates remain allowed. This validation runs on the shared trip draft schema before persistence.
