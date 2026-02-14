// Email service configuration
export const SMTP2GO_API_URL = 'https://api.smtp2go.com/v3/email/send' as const;
export const EMAIL_MAX_RETRIES = 3 as const;
export const EMAIL_RETRY_DELAY_MS = 1000 as const;
export const EMAIL_TIMEOUT_MS = 10000 as const;

// Rate limiting (already defined in middleware, but centralized here)
export const RATE_LIMIT_CONTACT = 5 as const;
export const RATE_LIMIT_INTAKE = 3 as const;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 as const;
