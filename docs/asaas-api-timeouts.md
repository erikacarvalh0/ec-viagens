# Asaas API request deadlines

Asaas customer/payment creation and recovery lookup now use 15-second AbortSignal deadlines. Network errors are normalized to avoid exposing upstream exception details. A timed-out payment creation request may still succeed at Asaas: **never automatically retry payment creation without reconciling its externalReference**. The existing recovery flow should be used to inspect the remote state before retrying.
