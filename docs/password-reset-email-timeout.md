# Password reset email provider timeout

Resend API requests now have a 10-second deadline using `AbortSignal.timeout`. Network failures and timeouts return a generic delivery error without including the reset token or provider response body. A timeout may still represent a delivered email; avoid automatically issuing a new token on retry. The public request flow must implement account/IP rate limits and a generic response before exposure.
