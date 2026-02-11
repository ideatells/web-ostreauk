# Migration Plan: ostrea.uk → Strapi + Astro.js on Railway

## Architecture

```
                    ┌─────────────────┐
                    │   Cloudinary    │
                    │ (cloudinary.com)│
                    │  Image CDN      │
                    └────────▲────────┘
                             │
┌─────────────┐     ┌───────┴──────┐     ┌────────────────┐
│  Astro.js   │────▶│  Strapi API  │────▶│  PostgreSQL    │
│  (SSR)      │     │  (Headless)  │     │  (Railway DB)  │
│  Railway    │     │  Railway     │     │                │
└─────────────┘     └──────┬───────┘     └────────────────┘
  Port 4321           Port │ 1337          Railway managed
  Node adapter        REST │ API
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌─────────┐ ┌──────────────────┐
     │   SMTP2GO    │ │ Webhook │ │  Automation Tool  │
     │ (smtp2go.com)│ │  POST   │ │ (Zapier/Make/n8n) │
     │  Email API   │ │ request │ │  via webhook URL  │
     └──────────────┘ └─────────┘ └──────────────────┘
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Astro.js (SSR) | Node.js adapter, TypeScript |
| Styling | Tailwind CSS | Fresh modern design |
| Backend/CMS | Strapi v5 | Headless CMS with admin panel |
| Database | PostgreSQL | Railway managed instance |
| Media | Cloudinary (cloudinary.com) | Image uploads + CDN + optimization |
| Email | SMTP2GO API (smtp2go.com) | Transactional email for form notifications |
| Webhooks | Custom Strapi lifecycle hooks | Push form data to external automation tools |
| i18n | Strapi i18n plugin + Astro | Dutch (default) + English |
| Deployment | Railway | Two services + one database |
| Package Manager | pnpm | Monorepo workspaces |
| SEO | @astrojs/sitemap, structured data, meta tags | Best practices for organic search |
| SEA Readiness | Google Tag Manager, conversion tracking | Ready for Google Ads / paid campaigns |
| Unit/Code Testing | Vitest | Fast TypeScript-native test runner for both apps |
| Integration Testing | Supertest + Vitest | API endpoint & service integration tests |
| Functional/E2E Testing | Playwright | Cross-browser end-to-end testing of user flows |
| CI Testing | GitHub Actions | Automated test pipeline on push/PR |

## Monorepo Structure

```
web-ostreauk/
├── apps/
│   ├── frontend/                 # Astro.js SSR application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Header.astro
│   │   │   │   ├── Footer.astro
│   │   │   │   ├── Hero.astro
│   │   │   │   ├── ServiceCard.astro
│   │   │   │   ├── BlogCard.astro
│   │   │   │   ├── ContactForm.astro
│   │   │   │   ├── IntakeForm.astro
│   │   │   │   ├── LanguageSwitcher.astro
│   │   │   │   ├── SEOHead.astro        # Meta tags, OG, hreflang, canonical
│   │   │   │   ├── JsonLd.astro         # Structured data (JSON-LD)
│   │   │   │   ├── CookieConsent.astro  # GDPR cookie banner
│   │   │   │   └── GTMScript.astro      # Google Tag Manager snippets
│   │   │   ├── layouts/
│   │   │   │   └── BaseLayout.astro
│   │   │   ├── lib/
│   │   │   │   ├── strapi.ts      # Strapi API client
│   │   │   │   ├── i18n.ts        # i18n utilities
│   │   │   │   └── seo.ts         # SEO helpers (structured data, meta)
│   │   │   ├── pages/
│   │   │   │   ├── index.astro            # Redirect to /nl
│   │   │   │   ├── [lang]/
│   │   │   │   │   ├── index.astro        # Homepage
│   │   │   │   │   ├── [slug].astro       # Dynamic CMS pages
│   │   │   │   │   ├── contact.astro      # Contact form page
│   │   │   │   │   ├── nu-oprichten.astro # Intake form page
│   │   │   │   │   ├── bedankt.astro     # Thank-you page (conversion tracking)
│   │   │   │   │   └── blog/
│   │   │   │   │       ├── index.astro    # Blog listing
│   │   │   │   │       └── [slug].astro   # Blog post detail
│   │   │   └── styles/
│   │   │       └── global.css
│   │   ├── tests/
│   │   │   ├── unit/                      # Unit tests (Vitest)
│   │   │   │   ├── lib/
│   │   │   │   │   ├── strapi.test.ts     # Strapi API client tests
│   │   │   │   │   ├── i18n.test.ts       # i18n utility tests
│   │   │   │   │   └── seo.test.ts        # SEO helper tests
│   │   │   │   └── components/
│   │   │   │       └── JsonLd.test.ts     # JSON-LD output tests
│   │   │   └── e2e/                       # E2E tests (Playwright)
│   │   │       ├── homepage.spec.ts       # Homepage rendering + navigation
│   │   │       ├── contact-form.spec.ts   # Contact form submission flow
│   │   │       ├── intake-form.spec.ts    # Intake form submission flow
│   │   │       ├── blog.spec.ts           # Blog listing + detail pages
│   │   │       ├── i18n.spec.ts           # Language switching + URL patterns
│   │   │       └── seo.spec.ts            # Meta tags, OG, hreflang, sitemap
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── robots.txt
│   │   ├── astro.config.mjs
│   │   ├── tailwind.config.mjs
│   │   ├── vitest.config.ts               # Vitest config for unit tests
│   │   ├── playwright.config.ts           # Playwright config for E2E tests
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── backend/                  # Strapi CMS application
│       ├── src/
│       │   ├── api/
│       │   │   ├── page/              # CMS-managed pages
│       │   │   ├── blog-post/         # Blog posts
│       │   │   ├── blog-category/     # Blog categories
│       │   │   ├── contact-submission/ # Contact form entries
│       │   │   │   └── content-types/
│       │   │   │       └── contact-submission/
│       │   │   │           ├── schema.json
│       │   │   │           └── lifecycles.ts  # afterCreate: email + webhook
│       │   │   └── intake-submission/  # Intake form entries
│       │   │       └── content-types/
│       │   │           └── intake-submission/
│       │   │               ├── schema.json
│       │   │               └── lifecycles.ts  # afterCreate: email + webhook
│       │   ├── components/
│       │   │   └── shared/            # Reusable components
│       │   ├── services/
│       │   │   ├── smtp2go.ts         # SMTP2GO API email service
│       │   │   └── webhook.ts         # Webhook dispatcher service
│       │   └── extensions/
│       ├── tests/
│       │   ├── unit/                  # Unit tests (Vitest)
│       │   │   ├── services/
│       │   │   │   ├── smtp2go.test.ts        # SMTP2GO service tests
│       │   │   │   └── webhook.test.ts        # Webhook dispatcher tests
│       │   │   └── lifecycles/
│       │   │       ├── contact-submission.test.ts  # Contact lifecycle tests
│       │   │       └── intake-submission.test.ts   # Intake lifecycle tests
│       │   ├── integration/           # Integration tests (Supertest + Vitest)
│       │   │   ├── api/
│       │   │   │   ├── contact-submission.test.ts  # POST /api/contact-submissions
│       │   │   │   ├── intake-submission.test.ts   # POST /api/intake-submissions
│       │   │   │   ├── page.test.ts               # GET /api/pages
│       │   │   │   ├── blog-post.test.ts          # GET /api/blog-posts
│       │   │   │   └── global-settings.test.ts    # GET /api/global-settings
│       │   │   └── helpers/
│       │   │       ├── strapi-instance.ts     # Strapi test instance bootstrap
│       │   │       └── test-data.ts           # Seed data / fixtures
│       │   └── functional/            # Functional tests (Vitest)
│       │       ├── form-to-db.test.ts         # Submit form → verify DB record
│       │       ├── form-to-email.test.ts      # Submit form → verify SMTP2GO called
│       │       └── form-to-webhook.test.ts    # Submit form → verify webhook dispatched
│       ├── config/
│       │   ├── database.ts
│       │   ├── server.ts
│       │   ├── admin.ts
│       │   ├── middlewares.ts
│       │   └── plugins.ts            # i18n + cloudinary config
│       ├── vitest.config.ts           # Vitest config for backend tests
│       ├── tsconfig.json
│       └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # CI pipeline: lint, unit, integration, e2e
├── pnpm-workspace.yaml
├── package.json                  # Root workspace config
├── .gitignore
├── .env.example
├── .env.test                     # Test environment variables (committed, no secrets)
└── MIGRATION_PLAN.md
```

---

## Phase 1: Project Scaffolding

### 1.1 Initialize monorepo
- Create root `package.json` with pnpm workspace config
- Create `pnpm-workspace.yaml` pointing to `apps/*`
- Add `.gitignore` for Node.js, Strapi, and environment files

### 1.2 Scaffold Strapi backend
- Initialize Strapi v5 with TypeScript in `apps/backend`
- Configure PostgreSQL connection (using `DATABASE_URL` env var)
- Enable i18n plugin with locales: `nl` (default), `en`
- Install and configure `@strapi/provider-upload-cloudinary` for image hosting on cloudinary.com
  - All media uploads (logos, hero images, blog images, OG images) stored on Cloudinary CDN
  - Auto-optimization with `f_auto` (format) and `q_auto` (quality)
  - Responsive image delivery with `w_auto` transformations

### 1.3 Scaffold Astro.js frontend
- Initialize Astro project in `apps/frontend`
- Install `@astrojs/node` adapter for SSR on Railway
- Install and configure Tailwind CSS
- Set up TypeScript

---

## Phase 2: Strapi Content Modeling

### 2.1 Content Types

#### Page (Collection Type)
| Field | Type | Notes |
|-------|------|-------|
| title | Text | Required, localized |
| slug | UID (from title) | Required, unique |
| content | Rich Text (Blocks) | Localized, main page body |
| hero_image | Media (single) | Optional hero/banner image |
| hero_title | Text | Optional, localized |
| hero_subtitle | Text | Optional, localized |
| show_in_nav | Boolean | Whether to show in navigation menu |
| nav_order | Integer | Order in navigation menu |
| **seo** | Component (shared.seo) | See SEO Component below |

#### SEO Component (shared.seo) - reusable across all content types
| Field | Type | Notes |
|-------|------|-------|
| seo_title | Text | Localized, for `<title>` tag (50-60 chars recommended) |
| seo_description | Text (long) | Localized, for meta description (150-160 chars) |
| canonical_url | Text | Optional, override canonical URL |
| og_image | Media (single) | OpenGraph image for social sharing (1200x630px) |
| no_index | Boolean | Default false, set true to exclude from search engines |
| focus_keyword | Text | Primary keyword for this page (editorial guidance) |
| structured_data_type | Enumeration | Organization, LocalBusiness, Service, BlogPosting, WebPage |

#### Blog Post (Collection Type)
| Field | Type | Notes |
|-------|------|-------|
| title | Text | Required, localized |
| slug | UID (from title) | Required, unique |
| body | Rich Text (Blocks) | Localized |
| featured_image | Media (single) | Optional |
| excerpt | Text (long) | Localized, for blog listing + meta fallback |
| publish_date | Date | Required |
| category | Relation (many-to-one) | → Blog Category |
| **seo** | Component (shared.seo) | Reusable SEO component |

#### Blog Category (Collection Type)
| Field | Type | Notes |
|-------|------|-------|
| name | Text | Required, localized |
| slug | UID (from name) | Required, unique |

#### Contact Submission (Collection Type)
| Field | Type | Notes |
|-------|------|-------|
| name | Text | Required |
| email | Email | Required |
| phone | Text | Optional |
| message | Text (long) | Required |

#### Intake Submission (Collection Type)
| Field | Type | Notes |
|-------|------|-------|
| name | Text | Required |
| email | Email | Required |
| phone | Text | Optional |
| company_name | Text | Optional |
| service_type | Enumeration | bedrijfsjuristen, trust_formation, belastingadvies |
| message | Text (long) | Optional |

#### Global Settings (Single Type)
| Field | Type | Notes |
|-------|------|-------|
| site_name | Text | Localized |
| phone_number | Text | e.g. "085-330 1020" |
| email | Email | |
| address | Text (long) | Localized |
| logo | Media (single) | |
| footer_text | Text (long) | Localized |
| cta_button_text | Text | Localized, e.g. "NU OPRICHTEN" |
| cta_button_url | Text | e.g. "/nu-oprichten" |
| gtm_container_id | Text | Google Tag Manager ID (e.g. GTM-XXXXXXX) |
| ga4_measurement_id | Text | GA4 measurement ID (e.g. G-XXXXXXXXXX) |
| google_ads_id | Text | Google Ads ID for conversion tracking |
| cookie_consent_text | Text (long) | Localized, GDPR cookie banner message |
| default_og_image | Media (single) | Fallback OpenGraph image for social sharing |

### 2.2 API Permissions
- Public role: `find` and `findOne` on Page, Blog Post, Blog Category, Global Settings
- Public role: `create` on Contact Submission and Intake Submission
- Authenticated role: full CRUD on all types (admin only)

---

## Phase 3: Astro.js Frontend

### 3.1 Strapi API Client (`src/lib/strapi.ts`)
- Typed fetch wrapper for Strapi REST API
- Handle locale parameter (`?locale=nl` / `?locale=en`)
- Handle population of relations and media
- Use `STRAPI_URL` and `STRAPI_API_TOKEN` env vars

### 3.2 i18n Setup (`src/lib/i18n.ts`)
- Supported locales: `nl`, `en`
- Default locale: `nl`
- URL pattern: `/nl/...` and `/en/...`
- Root `/` redirects to `/nl`
- Static UI strings (button labels, form labels) as translation objects

### 3.3 Pages

#### Homepage (`/[lang]/`)
- Hero section with CMS-managed image and text
- Welcome text / company intro
- Service highlights (links to Bedrijfsjuristen, Trust, Belastingadviseurs)
- CTA button "NU OPRICHTEN"

#### Service Pages (`/[lang]/[slug]`)
- Dynamic pages loaded from Strapi Page collection
- Hero image + title
- Rich text content body
- CTA section

#### Blog Listing (`/[lang]/blog/`)
- Grid of blog post cards
- Filter by category
- Pagination

#### Blog Detail (`/[lang]/blog/[slug]`)
- Full blog post content
- Featured image
- Date and category
- Back to blog link

#### Contact (`/[lang]/contact`)
- Contact information from Global Settings
- Contact form (name, email, phone, message)
- Form submits to Strapi API via client-side JS

#### Intake Form (`/[lang]/nu-oprichten`)
- "NU OPRICHTEN" intake form
- Fields: name, email, phone, company name, service type dropdown, message
- Form submits to Strapi API via client-side JS

### 3.4 Components
- **Header**: Logo, navigation (driven by Page `show_in_nav` field), language switcher, phone number, CTA button
- **Footer**: Contact info, nav links, footer text from Global Settings
- **Hero**: Full-width hero section with background image, title, subtitle
- **ServiceCard**: Card component for service highlights on homepage
- **BlogCard**: Card with image, title, date, excerpt
- **ContactForm**: Client-side form with validation
- **IntakeForm**: Client-side form with service type selector
- **LanguageSwitcher**: NL/EN toggle that preserves current page

### 3.5 Design Direction
- Fresh, modern design (not replicating current site)
- Keep brand colors (green `#7AAC2D` based on current CTA, brown/gold from logo)
- Clean typography, generous whitespace
- Mobile-first responsive design
- Professional feel appropriate for legal/financial services

---

## Phase 4: Form Submissions — Database, Email & Webhooks

All form submissions (Contact form and Intake form "NU OPRICHTEN") follow a three-step pipeline:

```
Form Submit → Strapi API (create) → PostgreSQL (save) → afterCreate lifecycle hook
                                                              │
                                              ┌───────────────┼───────────────┐
                                              ▼               ▼               ▼
                                        Save to DB      SMTP2GO Email    Webhook POST
                                        (automatic)     (notification)   (automation)
```

### 4.1 Database Storage (Automatic via Strapi)

Form submissions are automatically saved to PostgreSQL via the Strapi REST API:

- **Contact Submission**: `POST /api/contact-submissions` → saved with fields: name, email, phone, message
- **Intake Submission**: `POST /api/intake-submissions` → saved with fields: name, email, phone, company_name, service_type, message
- All submissions are timestamped (`createdAt`, `updatedAt`) by Strapi automatically
- Submissions are viewable and exportable from the Strapi admin panel

### 4.2 Email Notifications via SMTP2GO API

Use the SMTP2GO API (smtp2go.com) to send email notifications when forms are submitted.

#### SMTP2GO Service (`apps/backend/src/services/smtp2go.ts`)

```typescript
// SMTP2GO API integration for transactional email
// Docs: https://www.smtp2go.com/docs/api/

interface SMTP2GOPayload {
  api_key: string;
  to: string[];
  sender: string;
  subject: string;
  html_body: string;
  text_body: string;
}

async function sendEmail(payload: Omit<SMTP2GOPayload, 'api_key'>): Promise<void> {
  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.SMTP2GO_API_KEY,
      ...payload,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    strapi.log.error('SMTP2GO email failed:', error);
    throw new Error(`SMTP2GO error: ${error.data?.error ?? 'Unknown error'}`);
  }
}
```

#### Email Templates

**Contact form notification email:**
- To: admin email (from Global Settings or `ADMIN_NOTIFICATION_EMAIL` env var)
- Subject: `Nieuw contactformulier: {name}`
- Body: all submitted fields (name, email, phone, message)

**Intake form notification email:**
- To: admin email
- Subject: `Nieuwe intake aanvraag: {name} — {service_type}`
- Body: all submitted fields (name, email, phone, company_name, service_type, message)

### 4.3 Webhook Dispatcher

Push form submission data to an external webhook URL so automation tools (Zapier, Make/Integromat, n8n, Power Automate, etc.) can pick up the data for further processing.

#### Webhook Service (`apps/backend/src/services/webhook.ts`)

```typescript
// Generic webhook dispatcher for form submissions

interface WebhookPayload {
  event: 'contact_submission.created' | 'intake_submission.created';
  timestamp: string;
  data: Record<string, unknown>;
}

async function dispatchWebhook(payload: WebhookPayload): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    strapi.log.warn('WEBHOOK_URL not configured, skipping webhook dispatch');
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.WEBHOOK_SECRET ?? '',
      'X-Webhook-Event': payload.event,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    strapi.log.error(`Webhook dispatch failed (${response.status}):`, await response.text());
  }
}
```

#### Webhook Payload Format

Every form submission triggers an HTTP POST to the configured `WEBHOOK_URL` with:

**Contact form webhook payload:**
```json
{
  "event": "contact_submission.created",
  "timestamp": "2026-02-10T12:00:00.000Z",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+31612345678",
    "message": "I'd like to learn more about your services.",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}
```

**Intake form webhook payload:**
```json
{
  "event": "intake_submission.created",
  "timestamp": "2026-02-10T12:00:00.000Z",
  "data": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@company.nl",
    "phone": "+31687654321",
    "company_name": "Smith BV",
    "service_type": "trust_formation",
    "message": "We want to set up a holding structure.",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}
```

**Webhook security headers:**
| Header | Description |
|--------|------------|
| `Content-Type` | `application/json` |
| `X-Webhook-Secret` | Shared secret for verifying authenticity (from `WEBHOOK_SECRET` env var) |
| `X-Webhook-Event` | Event type: `contact_submission.created` or `intake_submission.created` |

### 4.4 Strapi Lifecycle Hooks

Both email and webhook are triggered via Strapi `afterCreate` lifecycle hooks on the submission content types.

#### Contact Submission Lifecycle (`apps/backend/src/api/contact-submission/content-types/contact-submission/lifecycles.ts`)

```typescript
export default {
  async afterCreate(event) {
    const { result } = event;

    // 1. Send email notification via SMTP2GO (critical — throws on failure)
    try {
      await strapi.service('api::services.smtp2go').sendEmail({
        to: [process.env.ADMIN_NOTIFICATION_EMAIL],
        sender: process.env.SMTP2GO_SENDER_EMAIL,
        subject: `Nieuw contactformulier: ${result.name}`,
        html_body: `
          <h2>Nieuw contactformulier ontvangen</h2>
          <p><strong>Naam:</strong> ${result.name}</p>
          <p><strong>Email:</strong> ${result.email}</p>
          <p><strong>Telefoon:</strong> ${result.phone ?? 'Niet opgegeven'}</p>
          <p><strong>Bericht:</strong></p>
          <p>${result.message}</p>
        `,
        text_body: `Naam: ${result.name}\nEmail: ${result.email}\nTelefoon: ${result.phone ?? 'N/A'}\nBericht: ${result.message}`,
      });
    } catch (error) {
      strapi.log.error('Contact submission email failed:', { submissionId: result.id, error: error.message });
      // Email is critical — rethrow so Strapi logs the lifecycle error
      // The submission is already saved to DB at this point (afterCreate)
      throw error;
    }

    // 2. Dispatch webhook for automation tools (non-critical — logs but does not throw)
    try {
      await strapi.service('api::services.webhook').dispatchWebhook({
        event: 'contact_submission.created',
        timestamp: new Date().toISOString(),
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          phone: result.phone,
          message: result.message,
          createdAt: result.createdAt,
        },
      });
    } catch (error) {
      strapi.log.error('Contact submission webhook failed:', { submissionId: result.id, error: error.message });
      // Webhook is non-critical — swallow error, submission is already saved
    }
  },
};
```

#### Intake Submission Lifecycle (`apps/backend/src/api/intake-submission/content-types/intake-submission/lifecycles.ts`)

```typescript
export default {
  async afterCreate(event) {
    const { result } = event;

    // 1. Send email notification via SMTP2GO (critical — throws on failure)
    try {
      await strapi.service('api::services.smtp2go').sendEmail({
        to: [process.env.ADMIN_NOTIFICATION_EMAIL],
        sender: process.env.SMTP2GO_SENDER_EMAIL,
        subject: `Nieuwe intake aanvraag: ${result.name} — ${result.service_type}`,
        html_body: `
          <h2>Nieuwe intake aanvraag ontvangen</h2>
          <p><strong>Naam:</strong> ${result.name}</p>
          <p><strong>Email:</strong> ${result.email}</p>
          <p><strong>Telefoon:</strong> ${result.phone ?? 'Niet opgegeven'}</p>
          <p><strong>Bedrijfsnaam:</strong> ${result.company_name ?? 'Niet opgegeven'}</p>
          <p><strong>Dienst:</strong> ${result.service_type ?? 'Niet opgegeven'}</p>
          <p><strong>Bericht:</strong></p>
          <p>${result.message ?? 'Geen bericht'}</p>
        `,
        text_body: `Naam: ${result.name}\nEmail: ${result.email}\nTelefoon: ${result.phone ?? 'N/A'}\nBedrijfsnaam: ${result.company_name ?? 'N/A'}\nDienst: ${result.service_type ?? 'N/A'}\nBericht: ${result.message ?? 'N/A'}`,
      });
    } catch (error) {
      strapi.log.error('Intake submission email failed:', { submissionId: result.id, error: error.message });
      // Email is critical — rethrow so Strapi logs the lifecycle error
      // The submission is already saved to DB at this point (afterCreate)
      throw error;
    }

    // 2. Dispatch webhook for automation tools (non-critical — logs but does not throw)
    try {
      await strapi.service('api::services.webhook').dispatchWebhook({
        event: 'intake_submission.created',
        timestamp: new Date().toISOString(),
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          phone: result.phone,
          company_name: result.company_name,
          service_type: result.service_type,
          message: result.message,
          createdAt: result.createdAt,
        },
      });
    } catch (error) {
      strapi.log.error('Intake submission webhook failed:', { submissionId: result.id, error: error.message });
      // Webhook is non-critical — swallow error, submission is already saved
    }
  },
};
```

---

## Phase 5: Error Handling

### 5.1 Error Handling Strategy

All errors fall into two categories based on their impact on the user experience:

| Category | Behavior | Examples |
|----------|----------|---------|
| **Critical** | Throw error, propagate to caller, log with `strapi.log.error` | SMTP2GO email failure, Strapi API fetch failure, missing required env vars |
| **Non-critical** | Catch error, log with `strapi.log.error` or `strapi.log.warn`, continue execution | Webhook dispatch failure, analytics tracking failure, optional field missing |

**Key principle**: Form submissions must always be saved to the database. Side effects (email, webhooks) that fail after the database write must not cause the API response to fail for non-critical operations.

### 5.2 Backend Error Handling

#### Environment Variable Validation

Validate required environment variables at Strapi bootstrap time. Missing critical variables should prevent the application from starting.

```typescript
// apps/backend/src/index.ts — Strapi bootstrap lifecycle
export default {
  async bootstrap({ strapi }) {
    const required = [
      'DATABASE_URL',
      'SMTP2GO_API_KEY',
      'SMTP2GO_SENDER_EMAIL',
      'ADMIN_NOTIFICATION_EMAIL',
    ];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      strapi.log.error(`Missing required environment variables: ${missing.join(', ')}`);
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Optional variables — log a warning but do not block startup
    if (!process.env.WEBHOOK_URL) {
      strapi.log.warn('WEBHOOK_URL not configured — webhook dispatching is disabled');
    }
    if (!process.env.CLOUDINARY_NAME) {
      strapi.log.warn('Cloudinary not configured — media uploads will use local storage');
    }
  },
};
```

#### SMTP2GO Service Error Handling

The SMTP2GO email service is critical — failures must propagate so lifecycle hooks can decide how to handle them.

```typescript
// apps/backend/src/services/smtp2go.ts — error handling additions

async function sendEmail(payload: Omit<SMTP2GOPayload, 'api_key'>): Promise<void> {
  if (!process.env.SMTP2GO_API_KEY) {
    throw new Error('SMTP2GO_API_KEY is not configured');
  }

  let response: Response;
  try {
    response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.SMTP2GO_API_KEY,
        ...payload,
      }),
    });
  } catch (error) {
    // Network-level failure (DNS, timeout, connection refused)
    strapi.log.error('SMTP2GO network error:', { error: error.message });
    throw new Error(`SMTP2GO network error: ${error.message}`);
  }

  if (!response.ok) {
    let errorDetail = 'Unknown error';
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.data?.error ?? errorBody.data?.error_code ?? JSON.stringify(errorBody);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    strapi.log.error('SMTP2GO API error:', { status: response.status, error: errorDetail });
    throw new Error(`SMTP2GO error (${response.status}): ${errorDetail}`);
  }
}
```

#### Webhook Dispatcher Error Handling

The webhook service is non-critical — it must never throw. All errors are logged and swallowed.

```typescript
// apps/backend/src/services/webhook.ts — error handling additions

async function dispatchWebhook(payload: WebhookPayload): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    strapi.log.warn('WEBHOOK_URL not configured, skipping webhook dispatch');
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET ?? '',
        'X-Webhook-Event': payload.event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      strapi.log.error('Webhook dispatch failed:', {
        status: response.status,
        event: payload.event,
        url: webhookUrl,
      });
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      strapi.log.error('Webhook dispatch timed out after 10s:', {
        event: payload.event,
        url: webhookUrl,
      });
    } else {
      strapi.log.error('Webhook dispatch network error:', {
        event: payload.event,
        error: error.message,
      });
    }
    // Non-critical — do not rethrow
  }
}
```

#### Lifecycle Hook Error Handling Summary

| Hook | Email failure | Webhook failure |
|------|--------------|-----------------|
| `contact-submission.afterCreate` | Log + rethrow (critical) | Log + swallow (non-critical) |
| `intake-submission.afterCreate` | Log + rethrow (critical) | Log + swallow (non-critical) |

**Important**: Because lifecycle hooks run in `afterCreate`, the database record is already persisted when the hook fires. An email failure will cause Strapi to log a lifecycle error, but the submission data is safe in PostgreSQL and visible in the admin panel.

### 5.3 Frontend Error Handling

#### Strapi API Client (`src/lib/strapi.ts`)

The API client must handle network failures, non-200 responses, and malformed data gracefully.

```typescript
// apps/frontend/src/lib/strapi.ts — error handling

class StrapiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'StrapiError';
  }
}

async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(endpoint, import.meta.env.STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${import.meta.env.STRAPI_API_TOKEN}`,
      },
    });
  } catch (error) {
    // Network failure — Strapi is unreachable
    throw new StrapiError(
      `Failed to connect to Strapi: ${error.message}`,
      0
    );
  }

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new StrapiError(
      `Strapi API error: ${response.status} ${response.statusText}`,
      response.status,
      details
    );
  }

  return response.json() as Promise<T>;
}
```

#### Form Submission Error Handling

Client-side forms must provide clear user feedback for validation errors, network failures, and server errors.

```typescript
// Client-side form submission pattern (used in ContactForm.astro and IntakeForm.astro)

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  const errorContainer = form.querySelector('[data-form-error]') as HTMLElement;

  // Clear previous errors
  errorContainer.textContent = '';
  errorContainer.hidden = true;

  // Client-side validation
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Disable button during submission to prevent double-submit
  submitButton.disabled = true;
  submitButton.textContent = 'Verzenden...';

  try {
    const response = await fetch(`${PUBLIC_STRAPI_URL}/api/contact-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: Object.fromEntries(new FormData(form)) }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      if (response.status === 400) {
        // Validation error from Strapi — show field-level errors
        const message = error?.error?.message ?? 'Controleer de ingevulde gegevens.';
        throw new Error(message);
      }
      throw new Error('Er is iets misgegaan. Probeer het later opnieuw.');
    }

    // Success — redirect to thank-you page
    const lang = window.location.pathname.split('/')[1]; // 'nl' or 'en'
    window.location.href = `/${lang}/bedankt`;
  } catch (error) {
    errorContainer.textContent = error.message;
    errorContainer.hidden = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Versturen';
  }
}
```

**User-facing error messages** (localized):

| Scenario | Dutch (nl) | English (en) |
|----------|-----------|--------------|
| Validation error | Controleer de ingevulde gegevens. | Please check the entered data. |
| Network failure | Kan geen verbinding maken. Controleer uw internetverbinding. | Unable to connect. Check your internet connection. |
| Server error (5xx) | Er is iets misgegaan. Probeer het later opnieuw. | Something went wrong. Please try again later. |
| Rate limited (429) | Te veel verzoeken. Probeer het over een minuut opnieuw. | Too many requests. Please try again in a minute. |

#### SSR Error Pages

Astro SSR pages must handle scenarios where Strapi is unavailable or returns errors.

```typescript
// Pattern for SSR page data fetching (e.g., [slug].astro)

let page;
try {
  page = await fetchAPI(`/api/pages`, {
    'filters[slug][$eq]': slug,
    locale: lang,
    populate: 'seo,hero_image',
  });
} catch (error) {
  if (error instanceof StrapiError && error.status === 404) {
    return Astro.redirect('/404');
  }
  // Log the error server-side, show a generic error page
  console.error(`Failed to load page "${slug}":`, error.message);
  return new Response('Er is een fout opgetreden. Probeer het later opnieuw.', {
    status: 502,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

**Custom error pages to implement:**

| Status | Route | Purpose |
|--------|-------|---------|
| 404 | `pages/404.astro` | Page not found — CMS page doesn't exist or invalid route |
| 500 | `pages/500.astro` | Internal server error — unhandled exception in SSR |
| 502 | Inline response | Bad gateway — Strapi API is unreachable |

#### i18n Error Handling

```typescript
// apps/frontend/src/lib/i18n.ts — locale validation

const SUPPORTED_LOCALES = ['nl', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'nl';

function validateLocale(lang: string): Locale {
  if (SUPPORTED_LOCALES.includes(lang as Locale)) {
    return lang as Locale;
  }
  // Invalid locale — fall back to default rather than throwing
  return DEFAULT_LOCALE;
}

function t(key: string, locale: Locale): string {
  const translation = translations[locale]?.[key];
  if (!translation) {
    // Missing translation — fall back to Dutch, then to the key itself
    return translations[DEFAULT_LOCALE]?.[key] ?? key;
  }
  return translation;
}
```

### 5.4 Error Criticality Matrix

| Component | Error Scenario | Severity | Behavior |
|-----------|---------------|----------|----------|
| Strapi bootstrap | Missing required env var | **Fatal** | Throw, prevent startup |
| Strapi bootstrap | Missing optional env var | Warning | Log warning, continue |
| SMTP2GO service | Network failure / API error | **Critical** | Throw, caller decides |
| Webhook service | Network failure / API error / timeout | Non-critical | Log error, return silently |
| Lifecycle hook | Email send failure | **Critical** | Log + rethrow |
| Lifecycle hook | Webhook dispatch failure | Non-critical | Log + swallow |
| Frontend API client | Strapi unreachable | **Critical** | Throw `StrapiError`, SSR returns 502 |
| Frontend API client | Strapi returns 404 | Normal | Redirect to 404 page |
| Frontend API client | Strapi returns 400/500 | **Critical** | Throw `StrapiError`, SSR returns error page |
| Frontend form | Network failure | User-facing | Show localized error message |
| Frontend form | Validation error (400) | User-facing | Show field-level error messages |
| Frontend form | Server error (5xx) | User-facing | Show generic retry message |
| i18n | Invalid locale in URL | Non-critical | Fall back to `nl` default |
| i18n | Missing translation key | Non-critical | Fall back to Dutch, then to raw key |

### 5.5 Logging Strategy

All backend logging uses Strapi's built-in logger (`strapi.log`) with appropriate log levels:

| Level | Usage | Example |
|-------|-------|---------|
| `strapi.log.error` | Operation failed, needs attention | Email send failure, webhook timeout |
| `strapi.log.warn` | Degraded but functional | Missing optional env var, webhook URL not configured |
| `strapi.log.info` | Normal operational events | Strapi started, content type created |
| `strapi.log.debug` | Development diagnostics | API request details, payload contents |

**Structured log fields**: All error logs include contextual data (submission ID, event type, error message) as a second argument for structured logging and easier debugging.

**Frontend logging**: SSR errors are logged via `console.error` on the server. Client-side errors in form handlers are displayed to the user — no client-side logging to external services in the initial implementation.

---

## Phase 6: Testing — Code, Integration & Functional

### 6.1 Testing Stack

| Tool | Purpose | Scope |
|------|---------|-------|
| Vitest | Unit + integration test runner | Both frontend and backend |
| Supertest | HTTP assertion library | Backend API endpoint tests |
| Playwright | Browser automation | Cross-browser E2E tests |
| MSW (Mock Service Worker) | API mocking | Frontend tests (mock Strapi responses) |
| GitHub Actions | CI pipeline | Automated testing on push/PR |

### 6.2 Code / Unit Tests

Isolated tests for individual functions, utilities, and services. No external dependencies — all I/O is mocked.

#### Backend Unit Tests

**SMTP2GO service** (`tests/unit/services/smtp2go.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('SMTP2GO Service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should call SMTP2GO API with correct payload', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true });

    await sendEmail({
      to: ['admin@ostrea.uk'],
      sender: 'noreply@ostrea.uk',
      subject: 'Test',
      html_body: '<p>Test</p>',
      text_body: 'Test',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.smtp2go.com/v3/email/send',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"api_key"'),
      })
    );
  });

  it('should throw on SMTP2GO API error', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ data: { error: 'Invalid API key' } }),
    });

    await expect(sendEmail({ /* ... */ })).rejects.toThrow('SMTP2GO error');
  });

  it('should include all required email fields', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true });
    await sendEmail({ to: ['a@b.com'], sender: 'x@y.com', subject: 'S', html_body: 'H', text_body: 'T' });

    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body).toHaveProperty('to');
    expect(body).toHaveProperty('sender');
    expect(body).toHaveProperty('subject');
    expect(body).toHaveProperty('html_body');
    expect(body).toHaveProperty('text_body');
  });
});
```

**Webhook dispatcher** (`tests/unit/services/webhook.test.ts`):
- Sends POST to configured `WEBHOOK_URL`
- Includes `X-Webhook-Secret` and `X-Webhook-Event` headers
- Skips silently when `WEBHOOK_URL` is not set
- Logs error on failed dispatch (does not throw — non-blocking)

**Lifecycle hooks** (`tests/unit/lifecycles/*.test.ts`):
- Verifies `afterCreate` calls both `sendEmail` and `dispatchWebhook`
- Verifies correct data mapping from Strapi result to email/webhook payload
- Verifies contact submission includes: name, email, phone, message
- Verifies intake submission includes: name, email, phone, company_name, service_type, message

#### Frontend Unit Tests

**Strapi API client** (`tests/unit/lib/strapi.test.ts`):
- Constructs correct URL with locale parameter
- Handles population parameters
- Returns typed response data
- Throws on API errors with meaningful message

**i18n utilities** (`tests/unit/lib/i18n.test.ts`):
- Returns correct translations for `nl` and `en` locales
- Falls back to default locale for missing keys
- Validates locale parameter (rejects invalid locales)

**SEO helpers** (`tests/unit/lib/seo.test.ts`):
- Generates correct JSON-LD for each schema type (Organization, LocalBusiness, Service, BlogPosting, WebPage)
- Falls back to defaults when CMS SEO fields are empty
- Generates correct canonical URL
- Generates correct hreflang alternate links

### 6.3 Integration Tests

Tests that verify multiple components working together with real (test) database and mocked external services.

#### Backend API Integration Tests

Run against a real Strapi instance with a test PostgreSQL database. External services (SMTP2GO, webhooks) are mocked.

**Setup** (`tests/integration/helpers/strapi-instance.ts`):
```typescript
import { beforeAll, afterAll } from 'vitest';

let strapiInstance;

beforeAll(async () => {
  // Boot Strapi with test database (SQLite or test PostgreSQL)
  strapiInstance = await strapi().load();
  await strapiInstance.server.mount();
});

afterAll(async () => {
  await strapiInstance.destroy();
});
```

**Contact Submission API** (`tests/integration/api/contact-submission.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('POST /api/contact-submissions', () => {
  it('should create submission and return 200', async () => {
    const res = await request(strapi.server.httpServer)
      .post('/api/contact-submissions')
      .send({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+31612345678',
          message: 'Integration test message',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.attributes.name).toBe('Test User');
    expect(res.body.data.attributes.email).toBe('test@example.com');
  });

  it('should reject submission without required fields', async () => {
    const res = await request(strapi.server.httpServer)
      .post('/api/contact-submissions')
      .send({ data: { name: 'No Email' } });

    expect(res.status).toBe(400);
  });

  it('should reject invalid email format', async () => {
    const res = await request(strapi.server.httpServer)
      .post('/api/contact-submissions')
      .send({ data: { name: 'Test', email: 'not-an-email', message: 'Hi' } });

    expect(res.status).toBe(400);
  });
});
```

**Intake Submission API** (`tests/integration/api/intake-submission.test.ts`):
- Creates submission with all fields (name, email, phone, company_name, service_type, message)
- Validates `service_type` enum values (only accepts: bedrijfsjuristen, trust_formation, belastingadvies)
- Rejects invalid enum values
- Accepts submission with only required fields (name, email)

**Read-only API endpoints** (`tests/integration/api/page.test.ts`, `blog-post.test.ts`, `global-settings.test.ts`):
- `GET /api/pages` returns pages with locale parameter
- `GET /api/pages/:id` returns single page with populated SEO component
- `GET /api/blog-posts` returns posts with pagination
- `GET /api/global-settings` returns site configuration
- Verifies public role cannot create/update/delete read-only content types

### 6.4 Functional Tests

End-to-end tests that verify complete user workflows from form submission through to database persistence, email dispatch, and webhook delivery.

**Form → Database** (`tests/functional/form-to-db.test.ts`):
```typescript
describe('Form submission → Database storage', () => {
  it('contact form: submitted data matches database record', async () => {
    const payload = {
      name: 'Functional Test',
      email: 'func@test.nl',
      phone: '+31600000000',
      message: 'Testing full pipeline',
    };

    const res = await request(strapi.server.httpServer)
      .post('/api/contact-submissions')
      .send({ data: payload });

    // Verify the record exists in the database
    const dbRecord = await strapi.db
      .query('api::contact-submission.contact-submission')
      .findOne({ where: { id: res.body.data.id } });

    expect(dbRecord.name).toBe(payload.name);
    expect(dbRecord.email).toBe(payload.email);
    expect(dbRecord.phone).toBe(payload.phone);
    expect(dbRecord.message).toBe(payload.message);
    expect(dbRecord.createdAt).toBeDefined();
  });
});
```

**Form → Email** (`tests/functional/form-to-email.test.ts`):
- Mocks `fetch` (SMTP2GO endpoint) and verifies it was called after submission
- Verifies email subject contains submitter's name
- Verifies email body contains all form fields
- Verifies sender and recipient addresses match env vars

**Form → Webhook** (`tests/functional/form-to-webhook.test.ts`):
- Mocks `fetch` (webhook URL) and verifies it was called after submission
- Verifies webhook payload contains correct event type
- Verifies webhook payload data matches submitted form fields
- Verifies `X-Webhook-Secret` header is present
- Verifies webhook failure does not break form submission (non-blocking)

### 6.5 E2E Tests (Playwright)

Browser-based tests that verify the full user experience across Chrome, Firefox, and Safari.

#### Test Configuration (`apps/frontend/playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm --filter frontend dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E Test Suites

**Homepage** (`tests/e2e/homepage.spec.ts`):
- Page loads and renders hero section
- Navigation links are present and clickable
- CTA "NU OPRICHTEN" button links to intake form
- Phone number is visible in header
- Footer renders contact info from Global Settings

**Contact form** (`tests/e2e/contact-form.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should submit form and redirect to thank-you page', async ({ page }) => {
    await page.goto('/nl/contact');

    await page.fill('input[name="name"]', 'Playwright Test');
    await page.fill('input[name="email"]', 'test@playwright.dev');
    await page.fill('input[name="phone"]', '+31612345678');
    await page.fill('textarea[name="message"]', 'E2E test message');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/nl\/bedankt/);
    await expect(page.locator('h1')).toContainText('Bedankt');
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.goto('/nl/contact');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-error="name"]')).toBeVisible();
    await expect(page.locator('[data-error="email"]')).toBeVisible();
    await expect(page.locator('[data-error="message"]')).toBeVisible();
  });

  test('should reject invalid email format', async ({ page }) => {
    await page.goto('/nl/contact');
    await page.fill('input[name="email"]', 'not-an-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-error="email"]')).toBeVisible();
  });
});
```

**Intake form** (`tests/e2e/intake-form.spec.ts`):
- Fills all fields including service type dropdown
- Submits form and verifies redirect to thank-you page
- Validates required fields (name, email)
- Service type dropdown contains correct options (bedrijfsjuristen, trust_formation, belastingadvies)

**i18n / Language switching** (`tests/e2e/i18n.spec.ts`):
- `/` redirects to `/nl`
- Language switcher toggles between `/nl/...` and `/en/...`
- UI strings change when locale switches
- Form labels render in correct language

**SEO validation** (`tests/e2e/seo.spec.ts`):
- Every page has `<title>` tag
- Every page has `<meta name="description">`
- Every page has `<link rel="canonical">`
- Every page has hreflang alternate links (nl + en)
- Homepage has JSON-LD structured data (Organization + LocalBusiness)
- Blog post pages have BlogPosting JSON-LD
- `robots.txt` is accessible and contains sitemap URL
- `sitemap.xml` is accessible and contains page URLs

**Blog** (`tests/e2e/blog.spec.ts`):
- Blog listing renders cards with title, date, excerpt
- Blog detail page renders full content
- Category filter works
- Pagination works

### 6.6 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, claude/*]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter frontend tsc --noEmit
      - run: pnpm --filter backend tsc --noEmit

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter frontend test:unit
      - run: pnpm --filter backend test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: strapi_test
        ports: ['5432:5432']
        options: >-
          --health-cmd="pg_isready"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/strapi_test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend test:integration

  functional-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: strapi_test
        ports: ['5432:5432']
        options: >-
          --health-cmd="pg_isready"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/strapi_test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend test:functional

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: strapi_test
        ports: ['5432:5432']
        options: >-
          --health-cmd="pg_isready"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/strapi_test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: pnpm --filter backend build && pnpm --filter backend start &
      - run: pnpm --filter frontend test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/frontend/playwright-report/
```

### 6.7 npm Scripts (per package)

**Backend (`apps/backend/package.json`):**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:functional": "vitest run tests/functional",
    "test:watch": "vitest watch"
  }
}
```

**Frontend (`apps/frontend/package.json`):**
```json
{
  "scripts": {
    "test": "vitest run && playwright test",
    "test:unit": "vitest run tests/unit",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:watch": "vitest watch"
  }
}
```

**Root (`package.json`):**
```json
{
  "scripts": {
    "test": "pnpm -r test",
    "test:unit": "pnpm --filter frontend test:unit && pnpm --filter backend test:unit",
    "test:ci": "pnpm -r test"
  }
}
```

---

## Phase 7: Railway Deployment

### 7.1 Railway Services

| Service | Type | Build Command | Start Command |
|---------|------|---------------|---------------|
| backend | Node.js | `pnpm --filter backend build` | `pnpm --filter backend start` |
| frontend | Node.js | `pnpm --filter frontend build` | `node apps/frontend/dist/server/entry.mjs` |
| database | PostgreSQL | — (managed) | — |

### 7.2 Environment Variables

**Backend (Strapi):**
```
# Database
DATABASE_URL=<railway postgres connection string>

# Strapi Security
APP_KEYS=<random keys>
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
JWT_SECRET=<random>

# Cloudinary (cloudinary.com) — Image hosting & CDN
CLOUDINARY_NAME=<cloudinary cloud name>
CLOUDINARY_KEY=<cloudinary api key>
CLOUDINARY_SECRET=<cloudinary api secret>

# SMTP2GO (smtp2go.com) — Transactional email
SMTP2GO_API_KEY=<smtp2go api key>
SMTP2GO_SENDER_EMAIL=noreply@ostrea.uk
ADMIN_NOTIFICATION_EMAIL=info@ostrea.uk

# Webhooks — Form submission automation
WEBHOOK_URL=<webhook endpoint URL, e.g. Zapier/Make/n8n catch hook>
WEBHOOK_SECRET=<shared secret for webhook signature verification>

# Strapi URL
STRAPI_URL=https://api.ostrea.uk  (or Railway-provided URL)
```

**Frontend (Astro):**
```
STRAPI_URL=https://api.ostrea.uk  (internal Railway URL or public)
STRAPI_API_TOKEN=<generated in Strapi admin>
PUBLIC_STRAPI_URL=https://api.ostrea.uk  (for client-side requests)
```

### 7.3 Custom Domains (optional)
- Frontend: `ostrea.uk` / `www.ostrea.uk`
- Backend: `api.ostrea.uk` (or keep Railway URL for admin)

---

## Phase 8: SEO Optimization (Search Engine Optimization)

### 8.1 Technical SEO

- **Semantic HTML**: Use proper heading hierarchy (single `<h1>` per page, logical `<h2>`-`<h6>`)
- **Performance**: Target Lighthouse score 90+ on all Core Web Vitals (LCP, FID, CLS)
  - Astro ships zero JS by default — leverage this for fast page loads
  - Lazy-load images below the fold with `loading="lazy"` and `decoding="async"`
  - Preload critical fonts and above-the-fold images
  - Use Cloudinary (cloudinary.com) auto-format (`f_auto`) and responsive sizing (`w_auto`) for optimal image delivery
- **Sitemap**: Install `@astrojs/sitemap` to auto-generate `sitemap.xml` with all pages + blog posts for both `nl` and `en` locales
- **robots.txt**: Serve a `robots.txt` allowing all crawlers, pointing to sitemap URL
- **Canonical URLs**: Auto-generate `<link rel="canonical">` on every page (overridable via CMS)
- **Hreflang tags**: Add `<link rel="alternate" hreflang="nl">` and `<link rel="alternate" hreflang="en">` on every page for multilingual SEO
- **SSL/HTTPS**: Enforced by Railway by default
- **Mobile-friendly**: Responsive design with proper `<meta name="viewport">` tag
- **Clean URL structure**: `/nl/bedrijfsjuristen`, `/en/business-lawyers` — no trailing slashes, no query params

### 8.2 On-Page SEO (CMS-Driven)

Every page and blog post gets these editable SEO fields (via the shared SEO component in Strapi):

- **Title tag** (`<title>`): CMS-editable, falls back to page title + site name
- **Meta description**: CMS-editable, falls back to excerpt or first 160 chars
- **OpenGraph tags**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale`
- **Twitter Card tags**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **Focus keyword**: Editorial field in CMS to guide content writers (not rendered)
- **No-index control**: Per-page toggle to exclude from search engines

### 8.3 Structured Data (JSON-LD)

Implement JSON-LD structured data on every page, with type driven by the CMS `structured_data_type` field:

| Page | Schema Type | Data |
|------|------------|------|
| All pages | `Organization` | Company name, logo, phone, address |
| Homepage | `WebSite` + `LocalBusiness` | Name, services, contact info, opening hours |
| Service pages | `Service` | Service name, description, provider |
| Blog posts | `BlogPosting` | Title, author, date, image, description |
| Contact page | `ContactPoint` | Phone, email, address |

### 8.4 Blog SEO

- **Clean URLs**: `/nl/blog/post-title-slug`
- **Blog listing pagination**: With `rel="next"` / `rel="prev"` links
- **Category pages**: Filtered blog views for topical authority
- **Publish date**: Rendered in HTML and structured data for freshness signals
- **Featured image alt text**: Editable in CMS, auto-required for accessibility + SEO

### 8.5 Performance & Core Web Vitals

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | Preload hero images, Cloudinary (cloudinary.com) CDN, minimal JS |
| FID (First Input Delay) | < 100ms | Astro ships zero JS by default, forms use progressive enhancement |
| CLS (Cumulative Layout Shift) | < 0.1 | Explicit image dimensions, font-display: swap, no layout-shifting ads |
| TTFB (Time to First Byte) | < 800ms | Railway SSR with edge caching, efficient Strapi queries |

---

## Phase 9: SEA Readiness (Search Engine Advertising)

### 9.1 Tracking & Analytics Infrastructure

- **Google Tag Manager (GTM)**: Install GTM container in `BaseLayout.astro` (both `<head>` and `<body>` snippets)
  - CMS-editable GTM container ID in Global Settings
  - GTM enables adding Google Ads, Analytics, and other tags without code changes
- **Google Analytics 4 (GA4)**: Configured via GTM
  - Track page views, scroll depth, outbound link clicks
  - Set up custom events for form submissions
- **Cookie consent**: Implement a GDPR-compliant cookie consent banner
  - Block tracking scripts until consent is given
  - Store consent preference in cookie
  - Required for EU-based Dutch audience

### 9.2 Conversion Tracking

Set up conversion events for SEA campaign optimization:

| Conversion | Trigger | Value |
|-----------|---------|-------|
| Contact form submission | Form `afterSubmit` success event | Primary |
| Intake form submission | Form `afterSubmit` success event | Primary |
| Phone click | Click on `tel:` link | Secondary |
| Email click | Click on `mailto:` link | Secondary |
| CTA button click | Click on "NU OPRICHTEN" button | Secondary |

- **Thank-you pages**: After form submission, redirect to `/nl/bedankt` or `/en/thank-you` for reliable conversion tracking via URL-based goals
- **Google Ads conversion tag**: Configured via GTM, fires on thank-you pages
- **Enhanced conversions**: Pass hashed email to Google Ads for better attribution (GDPR-compliant)

### 9.3 Landing Page Best Practices for SEA

- **Fast load times**: Critical for Google Ads Quality Score (target < 3s on mobile)
- **Clear CTA above the fold**: "NU OPRICHTEN" button visible without scrolling
- **Phone number in header**: Click-to-call for mobile visitors from ads
- **Service-specific pages**: Each service page can serve as a dedicated ad landing page
- **UTM parameter support**: Ensure UTM params pass through cleanly (no stripping by redirects)
- **Ad extensions data**: Structured data (phone, address, services) feeds Google Ads extensions

### 9.4 Global Settings Additions for SEA

Add to Global Settings single type in Strapi:

| Field | Type | Notes |
|-------|------|-------|
| gtm_container_id | Text | Google Tag Manager container ID (e.g. GTM-XXXXXXX) |
| ga4_measurement_id | Text | GA4 measurement ID (e.g. G-XXXXXXXXXX) |
| google_ads_id | Text | Google Ads account ID for conversion tracking |
| cookie_consent_text | Text (long) | Localized, GDPR cookie banner message |

---

## Phase 10: Content Migration

After deployment:
1. Access Strapi admin panel
2. Create pages: Home, Bedrijfsjuristen, Trust & Company Formation, Belastingadviseurs
3. Upload logo and page images via media library (stored on cloudinary.com CDN)
4. Add Dutch content first, then English translations
5. Configure navigation order
6. Set up Global Settings (phone, email, address, footer)
7. Create initial blog posts if any exist

---

## Implementation Order

| Step | Description | Depends On |
|------|------------|------------|
| 1 | Initialize monorepo + gitignore + workspace config | — |
| 2 | Scaffold Strapi backend with TypeScript | Step 1 |
| 3 | Configure Strapi: PostgreSQL, i18n, Cloudinary (cloudinary.com) | Step 2 |
| 4 | Create all Strapi content types + SEO component | Step 3 |
| 5 | Set API permissions for public access | Step 4 |
| 6 | Scaffold Astro frontend with SSR + Tailwind | Step 1 |
| 7 | Build Strapi API client (with `StrapiError` class + error handling) + i18n (with locale validation + fallback) + SEO utils | Step 6 |
| 8 | Build layout (Header, Footer, BaseLayout) with meta tags + hreflang | Step 7 |
| 9 | Build Homepage with structured data (JSON-LD) | Step 8 |
| 10 | Build dynamic page template ([slug]) with SEO component rendering | Step 8 |
| 11 | Build blog listing + detail pages with BlogPosting schema | Step 8 |
| 12 | Build contact form + intake form with client-side validation, error display, and thank-you pages | Step 8 |
| 13 | Build SMTP2GO email service with network + API error handling (`apps/backend/src/services/smtp2go.ts`) | Step 4 |
| 14 | Build webhook dispatcher service with timeout + non-blocking error handling (`apps/backend/src/services/webhook.ts`) | Step 4 |
| 15 | Add lifecycle hooks on Contact Submission + Intake Submission (try/catch: email critical, webhook non-critical) | Steps 13, 14 |
| 16 | **Add environment variable validation** in Strapi bootstrap (fail on missing critical vars, warn on optional) | Step 3 |
| 17 | **Add SSR error pages** (404, 500) and Strapi-unavailable handling (502) in Astro frontend | Step 10 |
| 18 | **Write backend unit tests** (SMTP2GO service, webhook dispatcher, lifecycle hooks — including error paths) | Steps 13-16 |
| 19 | **Write backend integration tests** (API endpoints with test DB + Supertest — including validation error responses) | Steps 5, 18 |
| 20 | **Write backend functional tests** (form → DB, form → email, form → webhook — including failure scenarios) | Step 19 |
| 21 | **Write frontend unit tests** (Strapi client error handling, i18n fallbacks, SEO helpers, JSON-LD) | Steps 7, 12 |
| 22 | **Write E2E tests** (Playwright: forms with error states, i18n, SEO, blog, navigation, 404 page) | Steps 12, 17, 19 |
| 23 | **Set up CI pipeline** (GitHub Actions: lint, unit, integration, functional, E2E) | Step 22 |
| 24 | Add sitemap.xml + robots.txt + canonical URLs | Steps 9-12 |
| 25 | Implement GTM, GA4, cookie consent + conversion tracking | Steps 9-12 |
| 26 | Add Railway deployment configs (incl. SMTP2GO + webhook env vars) | Steps 5, 25 |
| 27 | Lighthouse audit + Core Web Vitals optimization | Step 26 |
| 28 | **Run full test suite — all tests must pass before deploy** | Steps 18-23 |
| 29 | Deploy to Railway | Steps 26, 27, 28 |
| 30 | Configure Google Ads conversion tracking via GTM | Step 29 |
| 31 | Connect webhook URL to automation tool (Zapier/Make/n8n) | Step 29 |
| 32 | Migrate content in Strapi admin (with SEO fields filled) | Step 29 |
