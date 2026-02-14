import type { SendEmailParams, SMTP2GOEmailRequest, SMTP2GOResponse } from './types';
import { SMTP2GO_API_URL, EMAIL_MAX_RETRIES, EMAIL_RETRY_DELAY_MS, EMAIL_TIMEOUT_MS } from '../constants';

/**
 * Custom error class for SMTP2GO API failures
 */
export class SMTP2GOError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown,
  ) {
    super(message);
    this.name = 'SMTP2GOError';
  }
}

/**
 * Send email via SMTP2GO API with retry logic
 *
 * @throws {SMTP2GOError} If email sending fails after all retries
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, sender, subject, htmlBody, textBody } = params;

  // Validate required environment variables
  const apiKey = process.env.SMTP2GO_API_KEY;
  if (!apiKey) {
    throw new SMTP2GOError('SMTP2GO_API_KEY environment variable is not set');
  }

  // Validate required parameters
  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new SMTP2GOError('Recipient email address(es) required');
  }
  if (!sender) {
    throw new SMTP2GOError('Sender email address required');
  }
  if (!subject) {
    throw new SMTP2GOError('Email subject required');
  }
  if (!htmlBody && !textBody) {
    throw new SMTP2GOError('At least one of htmlBody or textBody is required');
  }

  // Normalize recipient to array
  const recipients = Array.isArray(to) ? to : [to];

  // Build request payload
  const payload: SMTP2GOEmailRequest = {
    sender,
    to: recipients,
    subject,
  };

  if (htmlBody) {
    payload.html_body = htmlBody;
  }
  if (textBody) {
    payload.text_body = textBody;
  }

  // Attempt to send with retry logic
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= EMAIL_MAX_RETRIES; attempt++) {
    try {
      await sendEmailRequest(apiKey, payload);
      return; // Success - exit function
    } catch (error) {
      const smtpError = error instanceof SMTP2GOError
        ? error
        : new SMTP2GOError((error as Error).message);
      lastError = smtpError;

      // Log retry attempt
      console.error(`SMTP2GO send attempt ${attempt}/${EMAIL_MAX_RETRIES} failed:`, smtpError);

      // Do not retry non-transient errors
      if (!isRetryableError(smtpError)) {
        throw smtpError;
      }

      // If this was the last attempt, throw the error
      if (attempt === EMAIL_MAX_RETRIES) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = EMAIL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw new SMTP2GOError(
    `Failed to send email after ${EMAIL_MAX_RETRIES} attempts: ${lastError?.message}`,
    (lastError as SMTP2GOError)?.statusCode,
    (lastError as SMTP2GOError)?.responseBody,
  );
}

/**
 * Make a single SMTP2GO API request
 */
async function sendEmailRequest(apiKey: string, payload: SMTP2GOEmailRequest): Promise<void> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const response = await Promise.race([
      fetch(SMTP2GO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Smtp2go-Api-Key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new SMTP2GOError(`SMTP2GO API request timed out after ${EMAIL_TIMEOUT_MS}ms`));
        }, EMAIL_TIMEOUT_MS);
      }),
    ]);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Parse response body
    let responseBody: SMTP2GOResponse;
    try {
      responseBody = await response.json() as SMTP2GOResponse;
    } catch {
      throw new SMTP2GOError(
        `Invalid JSON response from SMTP2GO API (status ${response.status})`,
        response.status,
      );
    }

    // Check HTTP status
    if (!response.ok) {
      throw new SMTP2GOError(
        `SMTP2GO API returned error status ${response.status}`,
        response.status,
        responseBody,
      );
    }

    // Check for failed recipients
    if (responseBody.data.failed > 0) {
      const failures = responseBody.data.failures || [];
      const failureDetails = failures.map((f) => `${f.email}: ${f.error}`).join(', ');
      throw new SMTP2GOError(
        `SMTP2GO reported ${responseBody.data.failed} failed recipient(s): ${failureDetails}`,
        response.status,
        responseBody,
      );
    }

    // Success
    console.log(`Email sent successfully via SMTP2GO (request_id: ${responseBody.request_id})`);
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SMTP2GOError(`SMTP2GO API request timed out after ${EMAIL_TIMEOUT_MS}ms`);
    }

    // Re-throw SMTP2GOError as-is
    if (error instanceof SMTP2GOError) {
      throw error;
    }

    // Wrap other errors
    throw new SMTP2GOError(
      `SMTP2GO API request failed: ${(error as Error).message}`,
    );
  }
}

function isRetryableError(error: SMTP2GOError): boolean {
  if (error.statusCode !== undefined) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }

  const message = error.message.toLowerCase();
  return message.includes('request failed') || message.includes('timed out');
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
