# Trip date validation

Trip creation and editing now reject malformed and impossible dates, while accepting valid leap days. Empty dates remain allowed. This validation runs on the shared trip draft schema before persistence.

Four-digit years from `0001` through `0099` are validated as written, without JavaScript's numeric date constructor remapping them into the twentieth century. Year `0000` remains invalid.
