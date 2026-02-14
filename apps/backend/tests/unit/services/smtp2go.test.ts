import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail, SMTP2GOError } from '../../../src/services/smtp2go';
import type { SMTP2GOResponse } from '../../../src/services/types';

// Mock environment variables
const MOCK_API_KEY = 'test-api-key-12345';
const MOCK_SENDER = 'noreply@ostrea.uk';
const MOCK_RECIPIENT = 'admin@ostrea.uk';

describe('SMTP2GO Email Service', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Set up environment
    process.env.SMTP2GO_API_KEY = MOCK_API_KEY;

    // Mock global fetch
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // Mock console methods to avoid noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SMTP2GO_API_KEY;
  });

  describe('Successful email sending', () => {
    it('should send email with HTML body successfully', async () => {
      const mockResponse: SMTP2GOResponse = {
        data: { succeeded: 1, failed: 0 },
        request_id: 'req-123',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await sendEmail({
        to: MOCK_RECIPIENT,
        sender: MOCK_SENDER,
        subject: 'Test Email',
        htmlBody: '<p>Test content</p>',
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.smtp2go.com/v3/email/send',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Smtp2go-Api-Key': MOCK_API_KEY,
          },
          body: JSON.stringify({
            sender: MOCK_SENDER,
            to: [MOCK_RECIPIENT],
            subject: 'Test Email',
            html_body: '<p>Test content</p>',
          }),
        }),
      );
    });

    it('should send email with both HTML and text bodies', async () => {
      const mockResponse: SMTP2GOResponse = {
        data: { succeeded: 1, failed: 0 },
        request_id: 'req-456',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await sendEmail({
        to: MOCK_RECIPIENT,
        sender: MOCK_SENDER,
        subject: 'Test Email',
        htmlBody: '<p>HTML content</p>',
        textBody: 'Plain text content',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.html_body).toBe('<p>HTML content</p>');
      expect(callBody.text_body).toBe('Plain text content');
    });

    it('should send email to multiple recipients', async () => {
      const mockResponse: SMTP2GOResponse = {
        data: { succeeded: 2, failed: 0 },
        request_id: 'req-789',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await sendEmail({
        to: ['admin1@ostrea.uk', 'admin2@ostrea.uk'],
        sender: MOCK_SENDER,
        subject: 'Test Email',
        textBody: 'Test content',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.to).toEqual(['admin1@ostrea.uk', 'admin2@ostrea.uk']);
    });
  });

  describe('Validation errors', () => {
    it('should throw error if API key is not set', async () => {
      delete process.env.SMTP2GO_API_KEY;

      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow('SMTP2GO_API_KEY environment variable is not set');
    });

    it('should throw error if recipient is missing', async () => {
      await expect(
        sendEmail({
          to: '',
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow('Recipient email address(es) required');
    });

    it('should throw error if recipient array is empty', async () => {
      await expect(
        sendEmail({
          to: [],
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow('Recipient email address(es) required');
    });

    it('should throw error if sender is missing', async () => {
      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: '',
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow('Sender email address required');
    });

    it('should throw error if subject is missing', async () => {
      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: '',
          textBody: 'Test',
        }),
      ).rejects.toThrow('Email subject required');
    });

    it('should throw error if both htmlBody and textBody are missing', async () => {
      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
        }),
      ).rejects.toThrow('At least one of htmlBody or textBody is required');
    });
  });

  describe('API error handling', () => {
    it('should throw error on HTTP 401 (unauthorized)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid API key' }),
      });

      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow(SMTP2GOError);
    });

    it('should throw error on HTTP 500 (server error)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow(SMTP2GOError);
    });

    it('should throw error if response is not valid JSON', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow('Invalid JSON response from SMTP2GO API');
    });

    it('should throw error if API reports failed recipients', async () => {
      const mockResponse: SMTP2GOResponse = {
        data: {
          succeeded: 0,
          failed: 1,
          failures: [
            { email: MOCK_RECIPIENT, error: 'Invalid email address' },
          ],
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow('SMTP2GO reported 1 failed recipient(s)');
    });
  });

  describe('Retry logic', () => {
    it('should retry on network failure and succeed on second attempt', async () => {
      const mockResponse: SMTP2GOResponse = {
        data: { succeeded: 1, failed: 0 },
        request_id: 'req-retry',
      };

      // First call fails, second succeeds
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

      await sendEmail({
        to: MOCK_RECIPIENT,
        sender: MOCK_SENDER,
        subject: 'Test',
        textBody: 'Test',
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should retry on HTTP 500 and succeed on third attempt', async () => {
      const mockResponse: SMTP2GOResponse = {
        data: { succeeded: 1, failed: 0 },
        request_id: 'req-retry-500',
      };

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
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

      await sendEmail({
        to: MOCK_RECIPIENT,
        sender: MOCK_SENDER,
        subject: 'Test',
        textBody: 'Test',
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retries exhausted', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(
        sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        }),
      ).rejects.toThrow('Failed to send email after 3 attempts');

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Timeout handling', () => {
    it('should timeout if request takes too long', async () => {
      vi.useFakeTimers();
      try {
        // Mock requests that never resolve to trigger timeout and retry behavior
        fetchMock.mockImplementationOnce(
          () => new Promise(() => {}), // Never resolves
        );
        fetchMock.mockImplementationOnce(
          () => new Promise(() => {}), // Never resolves
        );
        fetchMock.mockImplementationOnce(
          () => new Promise(() => {}), // Never resolves
        );

        const sendPromise = sendEmail({
          to: MOCK_RECIPIENT,
          sender: MOCK_SENDER,
          subject: 'Test',
          textBody: 'Test',
        });
        const rejectionExpectation = expect(sendPromise).rejects.toThrow('timed out');

        await vi.runAllTimersAsync();

        await rejectionExpectation;
        expect(fetchMock).toHaveBeenCalledTimes(3);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
