import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchWebhook } from '../../../src/services/webhook';

const MOCK_WEBHOOK_URL = 'https://hooks.example.com/automation';
const MOCK_WEBHOOK_SECRET = 'test-webhook-secret';

describe('Webhook Service', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.WEBHOOK_URL = MOCK_WEBHOOK_URL;
    process.env.WEBHOOK_SECRET = MOCK_WEBHOOK_SECRET;

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.WEBHOOK_URL;
    delete process.env.WEBHOOK_SECRET;
  });

  describe('Graceful skip behavior', () => {
    it('should skip silently when WEBHOOK_URL is not set', async () => {
      delete process.env.WEBHOOK_URL;

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1, name: 'Jane Doe' },
        }),
      ).resolves.not.toThrow();

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should skip silently when WEBHOOK_SECRET is not set', async () => {
      delete process.env.WEBHOOK_SECRET;

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1, name: 'Jane Doe' },
        }),
      ).resolves.not.toThrow();

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should log info message when skipping due to missing URL', async () => {
      const logSpy = vi.spyOn(console, 'log');
      delete process.env.WEBHOOK_URL;

      await dispatchWebhook({
        event: 'contact_submission.created',
        data: { id: 1 },
      });

      expect(logSpy).toHaveBeenCalledWith('Webhook dispatch skipped: WEBHOOK_URL is not configured');
    });
  });

  describe('Successful webhook dispatch', () => {
    it('should dispatch webhook with correct payload structure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      await dispatchWebhook({
        event: 'contact_submission.created',
        data: { id: 123, name: 'Jane Doe', email: 'jane@example.com' },
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(requestBody).toEqual({
        event: 'contact_submission.created',
        timestamp: expect.any(String),
        data: { id: 123, name: 'Jane Doe', email: 'jane@example.com' },
      });
    });

    it('should include all required headers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      await dispatchWebhook({
        event: 'intake_submission.created',
        data: { id: 7 },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': MOCK_WEBHOOK_SECRET,
            'X-Webhook-Event': 'intake_submission.created',
          },
        }),
      );
    });

    it('should POST to configured WEBHOOK_URL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      await dispatchWebhook({
        event: 'contact_submission.created',
        data: { id: 1 },
      });

      expect(fetchMock.mock.calls[0][0]).toBe(MOCK_WEBHOOK_URL);
    });

    it('should log success message on HTTP 200 response', async () => {
      const logSpy = vi.spyOn(console, 'log');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      await dispatchWebhook({
        event: 'contact_submission.created',
        data: { id: 1 },
      });

      expect(logSpy).toHaveBeenCalledWith(
        'Webhook dispatched successfully for event: contact_submission.created',
      );
    });
  });

  describe('Non-blocking error handling', () => {
    it('should NOT throw on HTTP 404', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not Found' }),
      });

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        }),
      ).resolves.not.toThrow();
    });

    it('should NOT throw on HTTP 500', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server Error' }),
      });
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server Error' }),
      });

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        }),
      ).resolves.not.toThrow();
    });

    it('should NOT throw on network failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network down'));
      fetchMock.mockRejectedValueOnce(new Error('Network down'));

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        }),
      ).resolves.not.toThrow();
    });

    it('should NOT throw on timeout', async () => {
      vi.useFakeTimers();
      try {
        fetchMock.mockImplementation(() => new Promise(() => {}));

        const webhookPromise = dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        });

        await vi.runAllTimersAsync();

        await expect(webhookPromise).resolves.not.toThrow();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should NOT throw on invalid JSON response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        }),
      ).resolves.not.toThrow();
    });

    it('should NOT throw on AbortError from fetch', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      fetchMock.mockRejectedValueOnce(abortError);
      fetchMock.mockRejectedValueOnce(abortError);

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('Retry logic', () => {
    it('should retry on network failure and succeed on second attempt', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        });

      await dispatchWebhook({
        event: 'contact_submission.created',
        data: { id: 1 },
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should retry on HTTP 500 and succeed on retry', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        });

      await dispatchWebhook({
        event: 'contact_submission.created',
        data: { id: 1 },
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after max attempts but still not throw', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        });

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        }),
      ).resolves.not.toThrow();

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Payload validation', () => {
    it('should include ISO 8601 timestamp in payload', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      await dispatchWebhook({
        event: 'contact_submission.created',
        data: { id: 42 },
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(requestBody.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include event type in both payload and header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      await dispatchWebhook({
        event: 'intake_submission.created',
        data: { id: 99 },
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      const requestHeaders = fetchMock.mock.calls[0][1].headers as Record<string, string>;

      expect(requestBody.event).toBe('intake_submission.created');
      expect(requestHeaders['X-Webhook-Event']).toBe('intake_submission.created');
    });

    it('should include all data fields in payload', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      const payloadData = {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+31 6 1234 5678',
        company_name: 'Acme B.V.',
      };

      await dispatchWebhook({
        event: 'intake_submission.created',
        data: payloadData,
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(requestBody.data).toEqual(payloadData);
    });

    it('should wrap non-webhook errors in dispatch layer without throwing', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      const logSpy = vi.spyOn(console, 'log');
      logSpy
        .mockImplementationOnce(() => {
          throw new Error('Logging failed');
        })
        .mockImplementation(() => {});

      await expect(
        dispatchWebhook({
          event: 'contact_submission.created',
          data: { id: 1 },
        }),
      ).resolves.not.toThrow();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
