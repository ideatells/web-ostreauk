# AGENTS.md — ostrea.uk Migration Project

This document provides all context an AI agent needs to understand, build, test, and maintain this project.

## Project Overview

This is a migration of the ostrea.uk website (a Dutch legal/financial services firm) from a legacy stack to a modern **Strapi v5 + Astro.js** architecture, deployed on **Railway**. The site is bilingual (Dutch default, English secondary) and serves pages for corporate law, trust formation, and tax advisory services.

**Current status**: Planning phase. The full implementation blueprint is in `MIGRATION_PLAN.md`. No application code has been written yet.

---

## Architecture

```
                    +------------------+
                    |   Cloudinary     |
                    | (cloudinary.com) |
                    |  Image CDN       |
                    +--------^---------+
                             |
+---------------+    +-------+--------+    +------------------+
|  Astro.js     |--->|  Strapi API    |--->|  PostgreSQL      |
|  (SSR)        |    |  (Headless)    |    |  (Railway DB)    |
|  Railway      |    |  Railway       |    |                  |
+---------------+    +-------+--------+    +------------------+
  Port 4321           Port   | 1337          Railway managed
  Node adapter        REST   | API
                             |
              +--------------+--------------+
              v              v              v
     +----------------+ +---------+ +--------------------+
     |   SMTP2GO      | | Webhook | | Automation Tool    |
     | (smtp2go.com)  | |  POST   | | (Zapier/Make/n8n)  |
     |  Email API     | | request | | via webhook URL    |
     +----------------+ +---------+ +--------------------+
```

**Data flow for form submissions**:
1. User submits form in Astro frontend (client-side JS)
2. `POST /api/contact-submissions` or `POST /api/intake-submissions` to Strapi REST API
3. Strapi saves record to PostgreSQL automatically
4. Strapi `afterCreate` lifecycle hook fires:
   - Sends email notification via SMTP2GO API
   - Dispatches webhook POST to configured automation tool
5. Frontend redirects user to thank-you page (`/[lang]/bedankt`)
6. GTM conversion tag fires on thank-you page

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Astro.js (SSR) | Node.js adapter, TypeScript, port 4321 |
| Styling | Tailwind CSS | Foundation for shadcn/ui components + custom styling |
| UI Components | shadcn/ui | Accessible, composable components built on Radix UI + Tailwind |
| Backend/CMS | Strapi v5 | Headless CMS with admin panel, TypeScript, port 1337 |
| Database | PostgreSQL | Railway managed instance |
| Media | Cloudinary | Image uploads, CDN, auto-optimization (`f_auto`, `q_auto`, `w_auto`) |
| Email | SMTP2GO API | Transactional email for form notifications |
| Webhooks | Custom Strapi lifecycle hooks | Push form data to Zapier/Make/n8n |
| i18n | Strapi i18n plugin + Astro | Dutch (`nl`, default) + English (`en`) |
| Deployment | Railway | Two Node.js services + one managed PostgreSQL database |
| Package Manager | pnpm | Monorepo workspaces via `pnpm-workspace.yaml` |
| SEO | `@astrojs/sitemap`, JSON-LD, meta tags, hreflang | Comprehensive on-page and technical SEO |
| Analytics | Google Tag Manager + GA4 | CMS-configurable container IDs |
| Unit/Code Testing | Vitest | TypeScript-native test runner for both apps |
| Integration Testing | Supertest + Vitest | Backend API endpoint tests against test DB |
| Functional Testing | Vitest | Full pipeline tests (form -> DB -> email -> webhook) |
| E2E Testing | Playwright | Cross-browser tests (Chrome, Firefox, Safari, mobile) |
| API Mocking | MSW (Mock Service Worker) | Frontend tests mock Strapi responses |
| CI | GitHub Actions | Automated lint, unit, integration, functional, E2E pipeline |

---

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
│   │   │   │   └── BaseLayout.astro     # Wraps all pages: meta, GTM, CSS
│   │   │   ├── lib/
│   │   │   │   ├── strapi.ts            # Typed Strapi REST API client
│   │   │   │   ├── i18n.ts              # i18n utilities + translation objects
│   │   │   │   └── seo.ts              # SEO helpers (JSON-LD, meta generation)
│   │   │   ├── pages/
│   │   │   │   ├── index.astro          # Redirect to /nl
│   │   │   │   └── [lang]/
│   │   │   │       ├── index.astro      # Homepage
│   │   │   │       ├── [slug].astro     # Dynamic CMS pages
│   │   │   │       ├── contact.astro    # Contact form page
│   │   │   │       ├── nu-oprichten.astro # Intake form page
│   │   │   │       ├── bedankt.astro    # Thank-you page (conversion tracking)
│   │   │   │       └── blog/
│   │   │   │           ├── index.astro  # Blog listing
│   │   │   │           └── [slug].astro # Blog post detail
│   │   │   └── styles/
│   │   │       └── global.css
│   │   ├── tests/
│   │   │   ├── unit/                    # Vitest unit tests
│   │   │   │   ├── lib/
│   │   │   │   │   ├── strapi.test.ts
│   │   │   │   │   ├── i18n.test.ts
│   │   │   │   │   └── seo.test.ts
│   │   │   │   └── components/
│   │   │   │       └── JsonLd.test.ts
│   │   │   └── e2e/                     # Playwright E2E tests
│   │   │       ├── homepage.spec.ts
│   │   │       ├── contact-form.spec.ts
│   │   │       ├── intake-form.spec.ts
│   │   │       ├── blog.spec.ts
│   │   │       ├── i18n.spec.ts
│   │   │       └── seo.spec.ts
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── robots.txt
│   │   ├── astro.config.mjs
│   │   ├── tailwind.config.mjs
│   │   ├── vitest.config.ts
│   │   ├── playwright.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── backend/                  # Strapi CMS application
│       ├── src/
│       │   ├── api/
│       │   │   ├── page/              # CMS-managed pages
│       │   │   ├── blog-post/         # Blog posts
│       │   │   ├── blog-category/     # Blog categories
│       │   │   ├── contact-submission/
│       │   │   │   └── content-types/
│       │   │   │       └── contact-submission/
│       │   │   │           ├── schema.json
│       │   │   │           └── lifecycles.ts  # afterCreate: email + webhook
│       │   │   └── intake-submission/
│       │   │       └── content-types/
│       │   │           └── intake-submission/
│       │   │               ├── schema.json
│       │   │               └── lifecycles.ts  # afterCreate: email + webhook
│       │   ├── components/
│       │   │   └── shared/            # Reusable components (e.g., shared.seo)
│       │   ├── services/
│       │   │   ├── smtp2go.ts         # SMTP2GO API email service
│       │   │   └── webhook.ts         # Generic webhook dispatcher
│       │   └── extensions/
│       ├── tests/
│       │   ├── unit/
│       │   │   ├── services/
│       │   │   │   ├── smtp2go.test.ts
│       │   │   │   └── webhook.test.ts
│       │   │   └── lifecycles/
│       │   │       ├── contact-submission.test.ts
│       │   │       └── intake-submission.test.ts
│       │   ├── integration/
│       │   │   ├── api/
│       │   │   │   ├── contact-submission.test.ts
│       │   │   │   ├── intake-submission.test.ts
│       │   │   │   ├── page.test.ts
│       │   │   │   ├── blog-post.test.ts
│       │   │   │   └── global-settings.test.ts
│       │   │   └── helpers/
│       │   │       ├── strapi-instance.ts     # Strapi test instance bootstrap
│       │   │       └── test-data.ts           # Seed data / fixtures
│       │   └── functional/
│       │       ├── form-to-db.test.ts
│       │       ├── form-to-email.test.ts
│       │       └── form-to-webhook.test.ts
│       ├── config/
│       │   ├── database.ts
│       │   ├── server.ts
│       │   ├── admin.ts
│       │   ├── middlewares.ts
│       │   └── plugins.ts            # i18n + Cloudinary config
│       ├── vitest.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # CI pipeline: lint, unit, integration, functional, e2e
├── pnpm-workspace.yaml                # points to apps/*
├── package.json                       # Root workspace config
├── .gitignore
├── .env.example
├── .env.test                          # Test env vars (committed, no secrets)
├── MIGRATION_PLAN.md                  # Full implementation blueprint
├── AGENTS.md                          # This file
└── README.md
```

---

## Build Processes

### Package Manager

This project uses **pnpm** with workspace support. All commands should be run from the project root unless otherwise noted.

```bash
# Install all dependencies (both apps)
pnpm install

# Install with frozen lockfile (CI)
pnpm install --frozen-lockfile
```

### Frontend (Astro.js)

```bash
# Development server (port 4321)
pnpm --filter frontend dev

# Production build
pnpm --filter frontend build

# Start production server
node apps/frontend/dist/server/entry.mjs

# TypeScript type-check (no emit)
pnpm --filter frontend tsc --noEmit
```

**Astro configuration** (`apps/frontend/astro.config.mjs`):
- Uses `@astrojs/node` adapter for SSR on Railway
- Tailwind CSS integration
- `@astrojs/sitemap` for sitemap generation
- Output mode: `server` (SSR)

### Backend (Strapi v5)

```bash
# Development server with auto-reload (port 1337)
pnpm --filter backend develop

# Production build
pnpm --filter backend build

# Start production server
pnpm --filter backend start

# TypeScript type-check (no emit)
pnpm --filter backend tsc --noEmit
```

### Railway Deployment

| Service | Build Command | Start Command |
|---------|---------------|---------------|
| backend | `pnpm --filter backend build` | `pnpm --filter backend start` |
| frontend | `pnpm --filter frontend build` | `node apps/frontend/dist/server/entry.mjs` |
| database | Managed by Railway | Managed by Railway |

---

## Testing Procedures

### Test Framework Stack

| Tool | Purpose | Scope |
|------|---------|-------|
| Vitest | Unit + integration + functional test runner | Both frontend and backend |
| Supertest | HTTP assertion library | Backend API endpoint integration tests |
| Playwright | Browser automation | Cross-browser E2E tests (frontend) |
| MSW (Mock Service Worker) | API mocking | Frontend tests (mock Strapi API responses) |

### Running Tests

**From the project root:**

```bash
# Run all tests across both apps
pnpm -r test

# Run all unit tests
pnpm --filter frontend test:unit && pnpm --filter backend test:unit

# Full CI suite
pnpm -r test
```

**Backend tests:**

```bash
# All backend tests
pnpm --filter backend test

# Unit tests only (services, lifecycle hooks)
pnpm --filter backend test:unit

# Integration tests (API endpoints with test PostgreSQL, external services mocked)
pnpm --filter backend test:integration

# Functional tests (form -> DB -> email -> webhook pipeline)
pnpm --filter backend test:functional

# Watch mode
pnpm --filter backend test:watch
```

**Frontend tests:**

```bash
# All frontend tests (unit + E2E)
pnpm --filter frontend test

# Unit tests only (Strapi client, i18n utils, SEO helpers)
pnpm --filter frontend test:unit

# E2E tests via Playwright
pnpm --filter frontend test:e2e

# E2E tests with interactive UI
pnpm --filter frontend test:e2e:ui

# Watch mode
pnpm --filter frontend test:watch
```

### Test File Naming Conventions

- **Unit tests**: `*.test.ts` in `tests/unit/` directories
- **Integration tests**: `*.test.ts` in `tests/integration/` directories
- **Functional tests**: `*.test.ts` in `tests/functional/` directories
- **E2E tests**: `*.spec.ts` in `tests/e2e/` directories

### Backend Unit Tests

Located in `apps/backend/tests/unit/`. All external I/O is mocked (no database, no network).

**What to test:**
- `services/smtp2go.test.ts` — SMTP2GO API calls (correct payload, error handling, required fields)
- `services/webhook.test.ts` — Webhook POST dispatch (correct headers, graceful skip when URL not set, non-blocking on failure)
- `lifecycles/contact-submission.test.ts` — `afterCreate` calls both `sendEmail` and `dispatchWebhook` with correct data
- `lifecycles/intake-submission.test.ts` — `afterCreate` calls both services with all intake-specific fields

**Mocking pattern:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
```

### Backend Integration Tests

Located in `apps/backend/tests/integration/`. Run against a real Strapi instance with a test PostgreSQL database. External services (SMTP2GO, webhooks) are mocked.

**Setup helper** (`tests/integration/helpers/strapi-instance.ts`):
- Boots a full Strapi instance with test database in `beforeAll`
- Destroys the instance in `afterAll`
- Uses Supertest for HTTP assertions

**API endpoints tested:**
- `POST /api/contact-submissions` — create, validation, required fields, email format
- `POST /api/intake-submissions` — create, enum validation (`service_type`), required fields
- `GET /api/pages` — locale param, populated SEO component
- `GET /api/blog-posts` — pagination, locale
- `GET /api/global-settings` — site configuration
- Public role cannot create/update/delete read-only content types

### Backend Functional Tests

Located in `apps/backend/tests/functional/`. End-to-end data pipeline verification.

- `form-to-db.test.ts` — Submit form via API, verify record in database
- `form-to-email.test.ts` — Submit form, verify SMTP2GO fetch was called with correct payload
- `form-to-webhook.test.ts` — Submit form, verify webhook fetch was called, verify non-blocking on failure

### Frontend Unit Tests

Located in `apps/frontend/tests/unit/`.

- `lib/strapi.test.ts` — URL construction, locale params, population, error handling
- `lib/i18n.test.ts` — Translation lookups, locale fallback, invalid locale rejection
- `lib/seo.test.ts` — JSON-LD generation per schema type, canonical URL, hreflang links, fallbacks
- `components/JsonLd.test.ts` — Rendered JSON-LD output validation

### E2E Tests (Playwright)

Located in `apps/frontend/tests/e2e/`. Run against a live frontend + backend.

**Browser targets:**
- Desktop: Chrome, Firefox, Safari
- Mobile: Pixel 5 (Chrome), iPhone 13 (Safari)

**Playwright config** (`apps/frontend/playwright.config.ts`):
- `baseURL`: `http://localhost:4321`
- `retries`: 2 in CI, 0 locally
- `workers`: 1 in CI, auto locally
- `webServer.command`: `pnpm --filter frontend dev`
- Trace recording on first retry

**Test suites:**
- `homepage.spec.ts` — Hero renders, navigation present, CTA links to intake, phone visible, footer renders
- `contact-form.spec.ts` — Submit flow, thank-you redirect, validation errors, email format rejection
- `intake-form.spec.ts` — All fields including service type dropdown, submit + redirect, required field validation
- `i18n.spec.ts` — Root redirects to `/nl`, language switcher toggles `/nl/` <-> `/en/`, UI strings change
- `seo.spec.ts` — `<title>`, meta description, canonical, hreflang, JSON-LD, robots.txt, sitemap.xml
- `blog.spec.ts` — Listing cards, detail page, category filter, pagination

### CI Pipeline (GitHub Actions)

Defined in `.github/workflows/ci.yml`. Triggers on push to `main` and `claude/*` branches, and on PRs to `main`.

**Jobs (in dependency order):**

1. **lint** — TypeScript type checking on both apps (`tsc --noEmit`)
2. **unit-tests** — All unit tests for frontend and backend
3. **integration-tests** — Backend API tests with PostgreSQL 16 service container
4. **functional-tests** — Backend pipeline tests (depends on unit-tests)
5. **e2e-tests** — Playwright browser tests (depends on unit-tests + integration-tests)

**PostgreSQL service container** (for integration, functional, e2e jobs):
- Image: `postgres:16`
- Credentials: `test/test`
- Database: `strapi_test`
- Port: `5432`
- `DATABASE_URL=postgresql://test:test@localhost:5432/strapi_test`

**Node version**: 20

**E2E job additionally:**
- Installs Playwright browsers with deps
- Builds and starts backend in background
- Uploads `playwright-report/` as artifact

---

## Coding Conventions

> **Comprehensive best practices are defined in `MIGRATION_PLAN.md` § Code Quality Standards.** This section summarizes the key conventions. When in doubt, defer to the migration plan.

### Language

- **TypeScript** is the primary language for both frontend and backend
- Strict type checking enabled via `tsconfig.json`
- Type checking enforced in CI pipeline

### Naming Conventions

> Full rules: `MIGRATION_PLAN.md` § Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files & directories | `kebab-case` | `form-handler.ts`, `blog-post/` |
| Astro components | `PascalCase.astro` | `Header.astro`, `JsonLd.astro` |
| Variables & functions | `camelCase` | `fetchAPI()`, `buildContactEmail()` |
| Constants | `UPPER_SNAKE_CASE` | `SUPPORTED_LOCALES`, `WEBHOOK_TIMEOUT_MS` |
| TypeScript interfaces/types | `PascalCase` (no `I` prefix) | `ContactSubmission`, `Locale` |
| CSS classes (custom) | `kebab-case` | `text-brand-green`, `btn-primary` |
| Environment variables | `UPPER_SNAKE_CASE` | `SMTP2GO_API_KEY`, `STRAPI_URL` |
| URL slugs | `kebab-case`, lowercase | `/nl/blog/mijn-eerste-post` |

- Booleans: prefix with `is`, `has`, `should`, `can`
- Event handlers: prefix with `handle` or `on`
- Builders/factories: prefix with `build` or `create`

### Import Organization

> Full rules: `MIGRATION_PLAN.md` § Import Organization

Strict 4-group ordering with blank-line separators:
1. Node.js built-in modules
2. External packages (`node_modules`)
3. Internal aliases / absolute imports
4. Relative imports (siblings and children)

- Use `import type { ... }` for type-only imports
- No relative paths deeper than two levels (`../../..`) — use path aliases
- Barrel exports (`index.ts`) only in `types/` directories

### Frontend Conventions

- **Components**: Astro components (`.astro` files) for all UI, using shadcn/ui as the component library
- **Styling**: Tailwind CSS utility classes exclusively; global styles only in `styles/global.css` (see CSS / Tailwind Conventions and shadcn/ui Conventions below)
- **Zero JS by default**: Astro ships no client-side JavaScript unless explicitly opted in. Use `client:load` or `client:visible` directives only when interactivity is needed (forms, language switcher)
- **i18n routing**: All pages under `[lang]/` dynamic route. Root `/` redirects to `/nl`
- **Static UI strings**: Stored as TypeScript translation objects in `src/lib/i18n.ts`, not in CMS
- **CMS content**: All page copy, blog content, and configuration comes from Strapi API
- **Image handling**: All images served from Cloudinary CDN. Use `f_auto` (format), `q_auto` (quality), `w_auto` (responsive sizing). Lazy-load below-fold images with `loading="lazy"` and `decoding="async"`

### Backend Conventions

- **Strapi API namespacing**: Services referenced as `api::services.smtp2go`, `api::services.webhook`
- **Content type structure**: Each content type has `schema.json` (fields) and optionally `lifecycles.ts` (hooks)
- **Lifecycle hooks**: Use `afterCreate` for side effects (email, webhooks). Side effects must not block the API response for non-critical operations (webhooks log errors but don't throw)
- **Services**: Reusable business logic in `src/services/`. Each service is a standalone module
- **Configuration**: All config in `config/` directory (`database.ts`, `server.ts`, `admin.ts`, `middlewares.ts`, `plugins.ts`)

### CSS / Tailwind Conventions

> Full rules: `MIGRATION_PLAN.md` § CSS / Tailwind Conventions

- **Utility-first** — use Tailwind classes directly in markup; avoid custom CSS unless necessary
- **Class ordering**: Layout → Positioning → Sizing → Spacing → Typography → Visual → Interactive → Responsive (enforced by `prettier-plugin-tailwindcss`)
- **Component extraction** over CSS classes — when 5+ utilities repeat in 3+ places, extract an Astro component
- **No `@apply`** in most cases — only for base element styles in `global.css`
- **Mobile-first**: base styles for mobile, `md:`, `lg:`, `xl:` for larger screens
- **No inline `style` attributes**
- **Brand tokens**: `brand-green` (#7AAC2D), `brand-green-dark` (#5C8A1E), `brand-brown` (#8B6914), `brand-gold` (#C9A84C) defined in `tailwind.config.mjs`

### shadcn/ui Conventions

> Full rules: `MIGRATION_PLAN.md` § shadcn/ui Component Conventions

All UI components **must** use [shadcn/ui](https://ui.shadcn.com/) as the component library. shadcn/ui provides accessible, composable components built on Radix UI primitives and styled with Tailwind CSS.

**MCP setup**: `npx shadcn@latest mcp init --client claude`

- **shadcn/ui first** — always check if a shadcn/ui component exists before building a custom one (Button, Card, Dialog, Form, Input, Select, etc.)
- **Install components as needed** — use `npx shadcn@latest add <component>` to add individual components
- **Customization via Tailwind** — shadcn/ui components are copied into the project and customized using Tailwind classes and brand design tokens
- **No alternative UI libraries** — do not install other component libraries (Material UI, Chakra, Ant Design, etc.); shadcn/ui is the single source of UI primitives
- **Accessibility built-in** — shadcn/ui components are built on Radix UI, providing WAI-ARIA compliant keyboard navigation, focus management, and screen reader support

### Constants & Configuration

> Full rules: `MIGRATION_PLAN.md` § Constants & Configuration

- No magic numbers or hardcoded strings — all configurable values in dedicated constant files
- Backend constants: `apps/backend/src/constants.ts` (`WEBHOOK_TIMEOUT_MS`, `EMAIL_MAX_RETRIES`, `RATE_LIMIT_CONTACT`, `RATE_LIMIT_INTAKE`)
- Frontend constants: `apps/frontend/src/constants.ts` (`BLOG_POSTS_PER_PAGE`, `BREAKPOINTS`, `IMAGE_WIDTHS`)
- Configuration that varies per environment belongs in env vars, not constants

### Async Patterns

> Full rules: `MIGRATION_PLAN.md` § Async Patterns

- **No floating promises** — every `async` call must be `await`ed or have an explicit `.catch()`
- **`Promise.all()`** for independent parallel operations (reduces page load time)
- **`Promise.allSettled()`** when some failures are acceptable
- **Error boundaries** at every async boundary — unhandled rejections are never acceptable

### Immutability

> Full rules: `MIGRATION_PLAN.md` § Immutability & Functional Patterns

- Prefer `const` over `let`; never use `var`
- Don't mutate function arguments — return new objects/arrays
- Use `readonly` for properties that shouldn't change after creation
- Use `as const` for literal arrays/objects (`SUPPORTED_LOCALES`, etc.)

### Strapi Content Type API Permissions

- **Public role**: `find` and `findOne` on Page, Blog Post, Blog Category, Global Settings
- **Public role**: `create` on Contact Submission and Intake Submission
- **Authenticated role**: Full CRUD on all types (admin only)

### Environment Variables

Never commit secrets. Use `.env.example` as a template. Test environment uses `.env.test` (committed, contains no secrets).

**Backend env vars:**
- `DATABASE_URL` — PostgreSQL connection string
- `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET` — Strapi security keys
- `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` — Image CDN
- `SMTP2GO_API_KEY` — Email service API key
- `SMTP2GO_SENDER_EMAIL` — Sender address (e.g., `noreply@ostrea.uk`)
- `ADMIN_NOTIFICATION_EMAIL` — Recipient for form notifications (e.g., `info@ostrea.uk`)
- `WEBHOOK_URL` — Automation tool endpoint (Zapier/Make/n8n catch hook)
- `WEBHOOK_SECRET` — Shared secret for webhook signature verification
- `STRAPI_URL` — Public Strapi URL

**Frontend env vars:**
- `STRAPI_URL` — Internal Strapi API endpoint (server-side fetching)
- `STRAPI_API_TOKEN` — API token for authenticated Strapi requests
- `PUBLIC_STRAPI_URL` — Public Strapi URL for client-side requests (prefixed `PUBLIC_` so Astro exposes it)

### HTML & SEO Conventions

- **Semantic HTML**: Proper heading hierarchy — single `<h1>` per page, logical `<h2>`-`<h6>`
- **Every page must have**: `<title>`, `<meta name="description">`, `<link rel="canonical">`, hreflang alternates (nl + en)
- **JSON-LD structured data**: On every page. Type driven by CMS `structured_data_type` field (Organization, LocalBusiness, Service, BlogPosting, WebPage)
- **OpenGraph + Twitter Card tags**: Generated from CMS SEO component fields with fallbacks
- **Clean URLs**: `/nl/bedrijfsjuristen`, `/en/business-lawyers` — no trailing slashes, no query params
- **robots.txt**: Allow all crawlers, include sitemap URL
- **sitemap.xml**: Auto-generated via `@astrojs/sitemap` for both locales

### Design Conventions

- **Brand colors**: Green `#7AAC2D` (CTA), brown/gold from logo
- **Mobile-first**: Responsive design, all layouts start from mobile breakpoint
- **Professional tone**: Appropriate for legal/financial services
- **Clean typography**: Generous whitespace
- **Performance targets**: Lighthouse 90+, LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## Architectural Patterns

### Monorepo Pattern

Uses **pnpm workspaces** with two apps under `apps/`. The root `pnpm-workspace.yaml` points to `apps/*`. Shared dependencies are hoisted. Each app has its own `package.json`, `tsconfig.json`, and test configuration.

### Frontend Architecture (Astro.js)

**Rendering**: Server-side rendering (SSR) via `@astrojs/node` adapter. Astro generates HTML on the server for every request, fetching data from Strapi at render time. This ensures SEO-friendly output and fresh content.

**Component model**: Astro components (`.astro` files) are the primary UI building blocks. They run only at build/request time on the server. Client-side interactivity (forms, language switcher) uses `<script>` tags or Astro's `client:*` hydration directives.

**Data fetching**: A typed API client (`src/lib/strapi.ts`) wraps `fetch()` calls to the Strapi REST API. It:
- Constructs URLs with locale parameter (`?locale=nl` or `?locale=en`)
- Handles population of relations and media fields
- Uses `STRAPI_URL` and `STRAPI_API_TOKEN` env vars
- Returns typed response data

**Routing**:
- `/` -> redirects to `/nl` (default locale)
- `/[lang]/` -> Homepage
- `/[lang]/[slug]` -> Dynamic CMS-managed pages (loaded from Strapi Page collection)
- `/[lang]/blog/` -> Blog listing with pagination and category filter
- `/[lang]/blog/[slug]` -> Blog post detail
- `/[lang]/contact` -> Contact form
- `/[lang]/nu-oprichten` -> Intake form ("NU OPRICHTEN")
- `/[lang]/bedankt` -> Thank-you / conversion tracking page

**i18n**:
- URL-based routing: `/nl/...` and `/en/...`
- Default locale: `nl`
- CMS content localized via Strapi i18n plugin (`?locale=` parameter)
- Static UI strings (buttons, labels, form text) as TypeScript translation objects in `src/lib/i18n.ts`
- `LanguageSwitcher` component preserves the current page when toggling locale

**Layout**:
- `BaseLayout.astro` wraps all pages — includes `<head>` (meta, GTM, CSS), header, footer
- `SEOHead.astro` renders all meta tags, OG tags, canonical, hreflang
- `JsonLd.astro` renders structured data based on page type
- `GTMScript.astro` loads Google Tag Manager (head + body snippets)
- `CookieConsent.astro` renders GDPR banner, blocks tracking until consent

### Backend Architecture (Strapi v5)

**Content modeling**: Six content types define the data model:

| Content Type | Type | Key Fields |
|-------------|------|------------|
| Page | Collection | title, slug, content (Rich Text Blocks), hero_image, show_in_nav, nav_order, seo (component) |
| Blog Post | Collection | title, slug, body, featured_image, excerpt, publish_date, category (relation), seo (component) |
| Blog Category | Collection | name, slug |
| Contact Submission | Collection | name, email, phone, message |
| Intake Submission | Collection | name, email, phone, company_name, service_type (enum), message |
| Global Settings | Single Type | site_name, phone_number, email, address, logo, footer_text, cta_button_text/url, gtm_container_id, ga4_measurement_id, google_ads_id, cookie_consent_text, default_og_image |

**Reusable SEO component** (`shared.seo`): Attached to Page and Blog Post. Fields: `seo_title`, `seo_description`, `canonical_url`, `og_image`, `no_index`, `focus_keyword`, `structured_data_type` (enum: Organization, LocalBusiness, Service, BlogPosting, WebPage).

**Service layer**:
- `smtp2go.ts` — Sends transactional email via SMTP2GO REST API (`POST https://api.smtp2go.com/v3/email/send`). Takes `to`, `sender`, `subject`, `html_body`, `text_body`. Throws on API errors.
- `webhook.ts` — Dispatches webhook POST to `WEBHOOK_URL`. Includes `X-Webhook-Secret` and `X-Webhook-Event` headers. Skips silently if URL not configured. Logs but does not throw on failure (non-blocking).

**Lifecycle hooks**: `afterCreate` on Contact Submission and Intake Submission content types. Each hook:
1. Calls SMTP2GO service to send notification email
2. Calls webhook service to dispatch form data to automation tools

**Webhook payload format**:
```json
{
  "event": "contact_submission.created",
  "timestamp": "2026-02-10T12:00:00.000Z",
  "data": {
    "id": 1,
    "name": "...",
    "email": "...",
    "createdAt": "..."
  }
}
```

Events: `contact_submission.created`, `intake_submission.created`

### Form Handling Pattern

1. **Client-side**: Astro form components (`ContactForm.astro`, `IntakeForm.astro`) with client-side validation
2. **Submission**: Client-side JS `fetch()` POST to Strapi REST API (public `create` permission)
3. **Storage**: Strapi automatically saves to PostgreSQL
4. **Side effects**: `afterCreate` lifecycle hook triggers email + webhook
5. **Response**: Frontend redirects to thank-you page for conversion tracking

### SEO Pattern

Every page renders:
1. `SEOHead.astro` — `<title>`, meta description, canonical URL, OG tags, Twitter Card tags, hreflang alternates
2. `JsonLd.astro` — JSON-LD structured data based on content type
3. All SEO fields are CMS-editable with sensible fallbacks (page title + site name, excerpt or first 160 chars, default OG image)

### Analytics & Tracking Pattern

1. GTM container loaded in `BaseLayout.astro` (head + body snippets)
2. GTM container ID stored in CMS Global Settings (editable without code changes)
3. Cookie consent banner blocks all tracking scripts until user consents
4. Conversion events fire on thank-you pages (URL-based goals)
5. Enhanced conversions: hashed email sent to Google Ads for attribution

### Error Handling Pattern

- **Strapi API client**: Throws meaningful errors on API failures
- **SMTP2GO service**: Throws on send failure (email notification is considered critical)
- **Webhook service**: Logs error but does NOT throw (webhook failure must not break form submission)
- **Frontend forms**: Client-side validation before submission, server-side validation in Strapi schema

> Full error handling strategy with custom error classes, retry logic, and criticality matrix: `MIGRATION_PLAN.md` § Phase 5: Error Handling

### Security

> Full rules: `MIGRATION_PLAN.md` § Security Best Practices

- **Input sanitization**: Server-side validation mandatory — never trust client-side alone
- **XSS prevention**: Astro auto-escapes templates; `set:html` only for trusted CMS rich text
- **CSP headers**: Configured in middleware — `default-src 'self'`, whitelists for Cloudinary, GTM, Strapi
- **Rate limiting**: Contact form 5/15min, intake form 3/15min per IP; returns `429` with localized message
- **Secrets management**: All secrets in env vars, `.env` files gitignored, tokens rotated on schedule
- **Dependency security**: `pnpm audit` in CI, no `*`/`latest` ranges, lock file always committed

### Accessibility (a11y)

> Full rules: `MIGRATION_PLAN.md` § Accessibility (a11y)

Target: **WCAG 2.1 Level AA** (EU/Netherlands legal requirement).

- **Semantic HTML**: `<nav>`, `<main>`, `<article>`, etc.; logical heading hierarchy; no `<div onclick>`
- **Keyboard navigation**: All interactive elements reachable via Tab; visible focus indicators; skip-to-content link; Escape closes modals
- **Forms**: Every input has a `<label>`; errors linked via `aria-describedby`; error summary with `role="alert"`
- **Color contrast**: Normal text 4.5:1, large text 3:1; never color alone to convey information
- **Images**: All `<img>` have `alt` text (from Strapi); decorative images use `alt=""`
- **Testing**: Lighthouse a11y score 95+; `axe-core` in Playwright E2E; manual keyboard + screen reader testing

### API Design

> Full rules: `MIGRATION_PLAN.md` § API Design Conventions

- JSON request/response bodies following Strapi envelope format (`{ data, meta }`)
- Error responses: `{ error: { status, name, message, details } }`
- Pagination: default 25, max 100, `page` + `pageSize` params
- Filtering/sorting: Strapi conventions (`filters[field][$operator]`, `sort=field:asc`)
- Standard HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 429, 500

### Dependency Management

> Full rules: `MIGRATION_PLAN.md` § Dependency Management

- **pnpm only** — enforced via `packageManager` field and `engines`
- Caret `^` for app deps, exact versions for critical tooling (TypeScript, Strapi)
- Lock file always committed, never manually edited
- Before adding a package: Can Node.js stdlib do it? Is it already installed? Is it maintained, typed, < 50KB?
- `pnpm audit` blocks merges on high/critical findings; `depcheck` for unused packages

### Git Workflow

> Full rules: `MIGRATION_PLAN.md` § Git Workflow & Commit Conventions

- **Branch naming**: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/` prefixes
- **Commit messages**: Conventional Commits format — `<type>(<scope>): <summary>`
- **Code review**: All CI checks pass, at least one approval, no `console.log` in production, no untyped `any`, no `it.skip` without linked issue

---

## Content Types Reference

### Contact Submission Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | Text | Yes | |
| email | Email | Yes | Validated format |
| phone | Text | No | |
| message | Text (long) | Yes | |

### Intake Submission Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | Text | Yes | |
| email | Email | Yes | Validated format |
| phone | Text | No | |
| company_name | Text | No | |
| service_type | Enumeration | No | Values: `bedrijfsjuristen`, `trust_formation`, `belastingadvies` |
| message | Text (long) | No | |

### Page Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | Text | Yes | Localized |
| slug | UID (from title) | Yes | Unique |
| content | Rich Text (Blocks) | No | Localized |
| hero_image | Media (single) | No | |
| hero_title | Text | No | Localized |
| hero_subtitle | Text | No | Localized |
| show_in_nav | Boolean | No | Controls navigation visibility |
| nav_order | Integer | No | Navigation sort order |
| seo | Component (shared.seo) | No | See SEO component |

### Blog Post Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | Text | Yes | Localized |
| slug | UID (from title) | Yes | Unique |
| body | Rich Text (Blocks) | No | Localized |
| featured_image | Media (single) | No | |
| excerpt | Text (long) | No | Localized, used in listings + meta fallback |
| publish_date | Date | Yes | |
| category | Relation (many-to-one) | No | -> Blog Category |
| seo | Component (shared.seo) | No | |

### Global Settings Fields

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
| gtm_container_id | Text | e.g. GTM-XXXXXXX |
| ga4_measurement_id | Text | e.g. G-XXXXXXXXXX |
| google_ads_id | Text | For conversion tracking |
| cookie_consent_text | Text (long) | Localized, GDPR banner |
| default_og_image | Media (single) | Fallback social sharing image |

### Shared SEO Component Fields

| Field | Type | Notes |
|-------|------|-------|
| seo_title | Text | Localized, for `<title>` (50-60 chars) |
| seo_description | Text (long) | Localized, meta description (150-160 chars) |
| canonical_url | Text | Optional canonical URL override |
| og_image | Media (single) | OpenGraph image (1200x630px) |
| no_index | Boolean | Default false, set true to exclude from search |
| focus_keyword | Text | Editorial guidance, not rendered |
| structured_data_type | Enumeration | Organization, LocalBusiness, Service, BlogPosting, WebPage |

---

## Implementation Order

The project follows a 30-step implementation plan with explicit dependencies. See `MIGRATION_PLAN.md` for full details.

**High-level phases:**

1. **Scaffolding** (Steps 1-3): Initialize monorepo, scaffold Strapi backend, scaffold Astro frontend
2. **Content Modeling** (Steps 4-5): Create Strapi content types, set API permissions
3. **Frontend Development** (Steps 6-12): API client, i18n, layouts, pages, forms
4. **Backend Services** (Steps 13-15): SMTP2GO email service, webhook dispatcher, lifecycle hooks
5. **Testing** (Steps 16-21): Unit tests, integration tests, functional tests, E2E tests, CI pipeline
6. **SEO & Analytics** (Steps 22-23): Sitemap, robots.txt, GTM, GA4, cookie consent, conversion tracking
7. **Deployment** (Steps 24-27): Railway config, Lighthouse audit, full test suite, deploy
8. **Post-Deploy** (Steps 28-30): Google Ads tracking, webhook automation, content migration

**Critical rule**: All tests must pass (Step 26) before deployment (Step 27).

---

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | Preload hero images, Cloudinary CDN, minimal JS |
| FID (First Input Delay) | < 100ms | Astro ships zero JS by default, progressive enhancement |
| CLS (Cumulative Layout Shift) | < 0.1 | Explicit image dimensions, `font-display: swap` |
| TTFB (Time to First Byte) | < 800ms | Railway SSR, efficient Strapi queries |
| Lighthouse Score | 90+ | All Core Web Vitals optimized |

---

## Key External Services

| Service | Domain | Purpose | Auth |
|---------|--------|---------|------|
| Cloudinary | cloudinary.com | Image hosting, CDN, optimization | `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` |
| SMTP2GO | smtp2go.com / api.smtp2go.com | Transactional email | `SMTP2GO_API_KEY` |
| Railway | railway.app | Hosting (2 services + PostgreSQL) | Railway dashboard |
| Google Tag Manager | tagmanager.google.com | Tag management | GTM container ID in CMS |
| Google Analytics 4 | analytics.google.com | Analytics | GA4 measurement ID in CMS |
| Google Ads | ads.google.com | Conversion tracking | Google Ads ID in CMS |
