import type { Core } from '@strapi/strapi';

const CONTACT_RATE_LIMIT = 5;
const INTAKE_RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

type RequestRecord = {
  count: number;
  resetTime: number;
};

type KoaLikeContext = {
  request: {
    path: string;
    ip: string;
    method: string;
  };
  status: number;
  body: unknown;
};

type NextFn = () => Promise<unknown>;

// In-memory store for rate limiting (use Redis for multi-instance deployments)
const requestStore = new Map<string, RequestRecord>();

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  void strapi;

  return async (ctx: KoaLikeContext, next: NextFn): Promise<unknown> => {
    const path = ctx.request.path;
    const ip = ctx.request.ip;
    const method = ctx.request.method;

    // Only apply to form submission endpoints
    if (!path.includes('/contact-submissions') && !path.includes('/intake-submissions')) {
      return next();
    }

    // Only rate limit write methods (POST); skip GET/list/admin calls
    if (method !== 'POST') {
      return next();
    }

    // Determine rate limit based on endpoint
    const maxRequests = path.includes('/contact-submissions') ? CONTACT_RATE_LIMIT : INTAKE_RATE_LIMIT;

    const key = `${ip}:${path}`;
    const now = Date.now();
    const record = requestStore.get(key);

    // Reset if window has expired
    if (!record || now > record.resetTime) {
      requestStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return next();
    }

    // Increment request count
    if (record.count >= maxRequests) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequests',
          message: 'Te veel verzoeken. Probeer het later opnieuw.',
          details: {
            retryAfter: Math.ceil((record.resetTime - now) / 1000),
          },
        },
      };
      return;
    }

    record.count += 1;
    requestStore.set(key, record);
    return next();
  };
};
