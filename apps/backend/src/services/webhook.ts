import { WEBHOOK_MAX_RETRIES, WEBHOOK_RETRY_DELAY_MS, WEBHOOK_TIMEOUT_MS } from '../constants';
import type { DispatchWebhookParams, WebhookPayload } from './types';

/**
 * Custom error class for webhook dispatch failures.
 */
export class WebhookError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown,
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

/**
 * Dispatch webhook with non-blocking behavior.
 *
 * If webhook configuration is missing or dispatch fails, errors are logged
 * and execution returns without throwing to avoid breaking form submissions.
 */
export async function dispatchWebhook(params: DispatchWebhookParams): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Webhook dispatch skipped: WEBHOOK_URL is not configured');
    return;
  }

  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('Webhook dispatch skipped: WEBHOOK_SECRET is not configured');
    return;
  }

  const payload: WebhookPayload = {
    event: params.event,
    timestamp: new Date().toISOString(),
    data: params.data,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= WEBHOOK_MAX_RETRIES; attempt++) {
    try {
      await sendWebhookRequest(webhookUrl, webhookSecret, payload);
      console.log(`Webhook dispatched successfully for event: ${params.event}`);
      return;
    } catch (error) {
      const webhookError = error instanceof WebhookError
        ? error
        : new WebhookError((error as Error).message);
      lastError = webhookError;

      console.error(`Webhook dispatch attempt ${attempt}/${WEBHOOK_MAX_RETRIES} failed:`, webhookError);

      if (!isRetryableError(webhookError) || attempt === WEBHOOK_MAX_RETRIES) {
        break;
      }

      const delay = WEBHOOK_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  console.error(
    `Webhook dispatch failed after ${WEBHOOK_MAX_RETRIES} attempts for event ${params.event}: ${lastError?.message}`,
  );
}

async function sendWebhookRequest(
  webhookUrl: string,
  webhookSecret: string,
  payload: WebhookPayload,
): Promise<void> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const response = await Promise.race([
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret,
          'X-Webhook-Event': payload.event,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new WebhookError(`Webhook request timed out after ${WEBHOOK_TIMEOUT_MS}ms`));
        }, WEBHOOK_TIMEOUT_MS);
      }),
    ]);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const getHeaderValue = (headerName: string): string | null => {
      if (!response.headers) {
        return null;
      }

      if (typeof response.headers.get === 'function') {
        return response.headers.get(headerName);
      }

      if (typeof response.headers === 'object') {
        const headerMap = response.headers as Record<string, string | undefined>;
        return headerMap[headerName] ?? headerMap[headerName.toLowerCase()] ?? null;
      }

      return null;
    };

    const contentType = getHeaderValue('content-type')?.toLowerCase() ?? '';
    const contentLength = getHeaderValue('content-length');
    const isJsonResponse = contentType.includes('application/json');
    const hasEmptyBody = response.status === 204 || contentLength === '0';

    if (response.ok) {
      if (response.status === 204 || hasEmptyBody || !isJsonResponse) {
        return;
      }

      try {
        await response.json();
      } catch {
        // Successful responses without valid JSON are still considered successful.
      }

      return;
    }

    let responseBody: unknown = '';
    if (isJsonResponse) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = '';
      }
    } else {
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '';
      }
    }

    throw new WebhookError(
      `Webhook endpoint returned error status ${response.status}`,
      response.status,
      responseBody,
    );
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new WebhookError(`Webhook request timed out after ${WEBHOOK_TIMEOUT_MS}ms`);
    }

    if (error instanceof WebhookError) {
      throw error;
    }

    throw new WebhookError(`Webhook request failed: ${(error as Error).message}`);
  }
}

function isRetryableError(error: WebhookError): boolean {
  if (error.statusCode !== undefined) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }

  const message = error.message.toLowerCase();
  return message.includes('request failed') || message.includes('timed out');
}

/**
 * Sleep utility for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
