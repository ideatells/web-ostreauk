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
│   │   │   │   ├── strapi.ts        # Typed Strapi REST API client
│   │   │   │   ├── i18n.ts          # i18n utilities + translation objects
│   │   │   │   ├── seo.ts           # SEO helpers (structured data, meta)
│   │   │   │   ├── form-handler.ts  # Reusable form submission + error display
│   │   │   │   └── cloudinary.ts    # Cloudinary URL builder with responsive sizing
│   │   │   ├── types/
│   │   │   │   └── strapi.ts        # TypeScript interfaces for Strapi API responses
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
│       │   │   ├── smtp2go.ts             # SMTP2GO API email service
│       │   │   ├── webhook.ts             # Webhook dispatcher service
│       │   │   ├── email-templates.ts     # Reusable email HTML/text builders
│       │   │   └── submission-handler.ts  # Shared afterCreate lifecycle handler
│       │   ├── types/
│       │   │   └── index.ts               # Shared TypeScript interfaces (submissions, payloads)
│       │   ├── utils/
│       │   │   └── env.ts                 # Environment variable validation helper
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
├── .eslintrc.cjs                # ESLint config (shared rules)
├── .prettierrc                  # Prettier formatting config
├── .gitignore
├── .env.example
├── .env.test                     # Test environment variables (committed, no secrets)
└── MIGRATION_PLAN.md
```

---

## Code Quality Standards

### TypeScript Configuration

Both apps use strict TypeScript to catch errors at compile time and enforce type safety across the codebase.

**Shared strict settings (each app's `tsconfig.json`):**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Linting & Formatting

| Tool | Config | Purpose |
|------|--------|---------|
| ESLint | `@typescript-eslint/recommended` | Type-aware code quality rules, unused variable detection, import ordering |
| Prettier | `singleQuote: true`, `trailingComma: 'all'` | Consistent formatting across all files |

**Root config files:**

`.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Disables ESLint rules that conflict with Prettier
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

`.prettierrc`:
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

**npm scripts (root `package.json`):**
```json
{
  "scripts": {
    "lint": "eslint apps/*/src --ext .ts,.astro",
    "lint:fix": "eslint apps/*/src --ext .ts,.astro --fix",
    "format": "prettier --write 'apps/*/src/**/*.{ts,astro,json,css}'",
    "format:check": "prettier --check 'apps/*/src/**/*.{ts,astro,json,css}'"
  }
}
```

### Commenting Conventions

Comments should explain **why**, not **what**. Self-explanatory code does not need comments. All public APIs require JSDoc documentation.

#### Module-Level Comments

Every file starts with a JSDoc block explaining its purpose, what uses it, and relevant external references.

```typescript
/**
 * SMTP2GO email service for transactional notifications.
 *
 * Sends HTML + plain text emails via the SMTP2GO REST API.
 * Used by lifecycle hooks to notify admins of form submissions.
 *
 * @see https://www.smtp2go.com/docs/api/
 * @module services/smtp2go
 */
```

#### JSDoc for Exported Functions, Classes, and Interfaces

All exports must have JSDoc documenting purpose, parameters, return values, thrown errors, and a usage example for non-trivial functions.

```typescript
/**
 * Sends a transactional email via the SMTP2GO REST API.
 *
 * @param payload - Email fields (recipients, subject, body). The API key
 *   is injected automatically from the SMTP2GO_API_KEY env var.
 * @throws {Error} If SMTP2GO_API_KEY is not configured
 * @throws {Error} If the SMTP2GO API returns a non-200 response
 * @throws {Error} If there is a network-level failure (DNS, timeout)
 *
 * @example
 * await sendEmail({
 *   to: ['admin@ostrea.uk'],
 *   sender: 'noreply@ostrea.uk',
 *   subject: 'New contact submission',
 *   html_body: '<p>Hello</p>',
 *   text_body: 'Hello',
 * });
 */
async function sendEmail(payload: Omit<SMTP2GOPayload, 'api_key'>): Promise<void> {
```

#### Inline Comments

Use inline comments to explain:
- **Business rules** — why something works a certain way (e.g., "webhook is non-critical because...")
- **Non-obvious decisions** — trade-offs, workarounds, edge cases
- **Complex logic** — regex patterns, bitwise operations, algorithm steps

```typescript
// Webhook is non-critical — swallow error so form submission still
// succeeds even if the automation tool endpoint is down

// Use nullish coalescing because phone is optional and may be null
// from the Strapi API, but we still need a display value in the email
const phone = result.phone ?? 'Niet opgegeven';
```

**Do NOT comment:**
- Self-explanatory code (`const name = result.name; // get name`)
- Type annotations that TypeScript already enforces
- Closing braces or obvious control flow

#### TODO / FIXME Conventions

```typescript
// TODO(#12): Add retry logic for transient SMTP2GO failures (max 3, exponential backoff)
// FIXME: Webhook timeout should be configurable via WEBHOOK_TIMEOUT_MS env var
```

Include a GitHub issue number where applicable for traceability.

### Reusable Module Strategy

Extract shared logic into standalone modules to eliminate duplication and enable independent unit testing. Each reusable module must:

1. **Single responsibility** — do one thing well, with a clear public API
2. **Typed exports** — export TypeScript types/interfaces alongside implementations
3. **JSDoc documented** — module header + JSDoc on all exports
4. **Independently testable** — all external dependencies injectable or mockable
5. **No side effects on import** — no code runs at module load time

#### Backend Reusable Modules

| Module | Path | Reused By | Purpose |
|--------|------|-----------|---------|
| Shared types | `src/types/index.ts` | All services, lifecycle hooks, tests | TypeScript interfaces for submission data, email payloads, webhook payloads |
| Email template builder | `src/services/email-templates.ts` | Both lifecycle hooks | Generate HTML + plain text email content from submission data |
| Submission lifecycle handler | `src/services/submission-handler.ts` | Both lifecycle hooks | Shared afterCreate pattern: email (critical) + webhook (non-critical) |
| Environment validation | `src/utils/env.ts` | Bootstrap, services | Required/optional env var checking with typed results |

#### Frontend Reusable Modules

| Module | Path | Reused By | Purpose |
|--------|------|-----------|---------|
| Strapi response types | `src/types/strapi.ts` | All pages, components, lib modules | TypeScript interfaces for Strapi REST API responses |
| Form submission handler | `src/lib/form-handler.ts` | ContactForm.astro, IntakeForm.astro | Shared validation, submit, loading state, and error display logic |
| Cloudinary URL builder | `src/lib/cloudinary.ts` | Hero, BlogCard, SEOHead, all image components | Build optimized Cloudinary URLs with `f_auto`, `q_auto`, responsive sizing |

### Naming Conventions

Consistent naming across the entire codebase. No exceptions.

| Element | Convention | Example |
|---------|-----------|---------|
| Files & directories | `kebab-case` | `form-handler.ts`, `email-templates.ts`, `blog-post/` |
| Astro components | `PascalCase.astro` | `BlogCard.astro`, `LanguageSwitcher.astro` |
| Variables & functions | `camelCase` | `fetchAPI()`, `buildContactEmail()`, `webhookUrl` |
| Constants (true constants) | `UPPER_SNAKE_CASE` | `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `MAX_WEBHOOK_TIMEOUT_MS` |
| TypeScript interfaces | `PascalCase` (no `I` prefix) | `ContactSubmission`, `EmailContent`, `StrapiEntity<T>` |
| TypeScript type aliases | `PascalCase` | `Locale`, `WebhookEvent` |
| Enum members | `PascalCase` | `ServiceType.TrustFormation` |
| CSS classes (Tailwind) | Utility-first, custom classes in `kebab-case` | `text-brand-green`, `btn-primary` |
| Environment variables | `UPPER_SNAKE_CASE` | `SMTP2GO_API_KEY`, `STRAPI_URL` |
| URL slugs | `kebab-case`, lowercase | `/nl/blog/mijn-eerste-post` |
| Database fields | `snake_case` (Strapi convention) | `company_name`, `service_type`, `hero_image` |

**Naming principles:**
- Be descriptive over brief — `handleSubmissionCreated` over `handleSub`
- Boolean variables/props start with `is`, `has`, `should`, `can` — `isLoading`, `hasError`, `shouldRedirect`
- Event handler functions start with `handle` or `on` — `handleSubmit`, `onLocaleChange`
- Builder/factory functions start with `build` or `create` — `buildContactEmail`, `createStrapiClient`
- Avoid abbreviations unless universally understood — `i18n`, `URL`, `API` are fine; `btn`, `msg`, `cb` are not

### Import Organization

Every file follows a strict import ordering with blank-line separators between groups:

```typescript
// 1. Node.js built-in modules
import { URL } from 'node:url';

// 2. External packages (node_modules)
import { describe, it, expect } from 'vitest';

// 3. Internal aliases / absolute imports (within the same app)
import type { ContactSubmission } from '../types';
import { sendEmail } from '../services/smtp2go';

// 4. Relative imports (siblings and children)
import { renderHtml } from './helpers';
```

**Rules:**
- Type-only imports use `import type { ... }` to avoid runtime overhead
- Barrel exports (`index.ts`) only in `types/` directories — avoid re-export barrels elsewhere as they break tree-shaking
- Prefer explicit named imports over wildcard `import * as` — easier to trace usage
- Never use relative paths that go up more than two levels (`../../..`) — use path aliases if needed

### Git Workflow & Commit Conventions

#### Branch Naming

```
<type>/<short-description>

feature/intake-form-validation
fix/webhook-timeout-error
chore/update-strapi-v5.1
docs/add-api-documentation
```

| Prefix | Usage |
|--------|-------|
| `feature/` | New feature or page |
| `fix/` | Bug fix |
| `chore/` | Dependency updates, config changes, CI tweaks |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring without behaviour change |
| `test/` | Adding or fixing tests |

#### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

<optional body — explain WHY, not WHAT>

<optional footer — references, breaking changes>
```

**Examples:**
```
feat(forms): add client-side phone number validation

Dutch phone numbers must match +31 or 06 format. Added regex
validation in form-handler.ts so invalid numbers are caught
before submission to Strapi API.

Closes #42
```

```
fix(webhook): increase timeout from 10s to 30s

External webhook endpoints (Zapier/Make) occasionally respond
slowly under load. 10s was causing spurious timeout errors
in production logs.
```

| Type | When to use |
|------|-------------|
| `feat` | New feature or user-facing change |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `docs` | Documentation changes |
| `chore` | Build process, dependency updates, config changes |
| `style` | Formatting only (no logic change) |
| `perf` | Performance improvement |

#### Code Review Standards

Every PR requires:
1. **All CI checks pass** — lint, format, unit, integration, E2E
2. **At least one approval** before merge
3. **No `console.log` left in production code** — use `strapi.log` (backend) or remove (frontend)
4. **No `any` types without a justification comment** — prefer `unknown` + type narrowing
5. **No disabled tests** (`it.skip`, `test.skip`) without a linked GitHub issue
6. **All new exports have JSDoc** per commenting conventions

### Accessibility (a11y)

The site must meet **WCAG 2.1 Level AA** compliance — this is a legal requirement for commercial websites in the EU/Netherlands.

#### Semantic HTML

- Use correct HTML elements for their purpose — `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>`, `<header>`, `<footer>`
- One `<main>` landmark per page
- Headings follow a logical hierarchy — never skip levels (e.g., `<h1>` → `<h3>`)
- Lists use `<ul>`/`<ol>` — never styled `<div>` sequences
- Buttons use `<button>` for actions, `<a>` for navigation — never `<div onclick>`

#### Keyboard Navigation

- All interactive elements reachable via `Tab` key in logical order
- Focus indicators visible on all focusable elements (never `outline: none` without replacement)
- Modal/dialog traps focus within while open
- Skip-to-content link as first focusable element on every page
- `Escape` key closes modals, dropdowns, and mobile menu

#### Forms

- Every input has an associated `<label>` element (with `for`/`id` match or wrapping)
- Required fields marked with `aria-required="true"` and visual indicator
- Error messages linked to fields via `aria-describedby`
- Form error summary announced to screen readers with `role="alert"` or `aria-live="assertive"`
- Autocomplete attributes set on appropriate fields (`autocomplete="email"`, `autocomplete="tel"`, `autocomplete="name"`)

#### Color & Contrast

- Text-to-background contrast ratio meets WCAG AA:
  - Normal text: minimum **4.5:1**
  - Large text (18px+ bold or 24px+): minimum **3:1**
- Never use color alone to convey information — always pair with text, icon, or pattern
- Brand green `#7AAC2D` must be validated against chosen backgrounds for contrast compliance
- Focus indicators must have minimum **3:1** contrast against surrounding content

#### Images & Media

- All `<img>` elements have `alt` text (from Strapi `alternativeText` field)
- Decorative images use `alt=""` (empty alt, not missing alt)
- Complex images (charts, infographics) have extended descriptions
- No auto-playing media

#### ARIA Usage

- Use ARIA only when native HTML semantics are insufficient — prefer semantic HTML first
- Language switcher has `aria-label="Taal selecteren"` / `"Select language"`
- Mobile menu toggle has `aria-expanded`, `aria-controls`
- Loading states announced with `aria-busy="true"` on the submit button
- Current page indicated in nav with `aria-current="page"`

#### Testing for Accessibility

- Lighthouse accessibility audit score target: **95+**
- `axe-core` integrated into Playwright E2E tests for automated a11y checks
- Manual keyboard navigation tested for all user flows
- Screen reader testing (VoiceOver / NVDA) for critical flows: forms, navigation, language switch

### Security Best Practices

#### Input Sanitization & Validation

- **Server-side validation is mandatory** — never trust client-side validation alone
- Strapi content type schemas enforce field types, required fields, and max lengths
- Rich text output from Strapi is rendered via Astro's built-in HTML escaping — never use `set:html` with raw user input
- Email fields validated with regex at both client and server level
- Phone fields validated against expected format (Dutch `+31` / `06` patterns)

#### XSS Prevention

- Astro escapes all expressions in templates by default — no raw HTML injection
- `set:html` directive used **only** for CMS rich text content from trusted Strapi admin users
- User-submitted data (form fields) is never rendered as HTML — always text content
- Cloudinary URLs are validated before rendering in `src` attributes
- CSP headers configured (see below)

#### Content Security Policy (CSP)

Configure CSP headers in Astro middleware or Railway config:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://res.cloudinary.com data:;
  font-src 'self';
  connect-src 'self' https://*.strapi.io;
  frame-src https://www.googletagmanager.com;
```

#### CSRF Protection

- Strapi has built-in CSRF protection for session-based requests
- API-token-authenticated requests (frontend → backend) are not session-based, so CSRF is not applicable for those
- Form submissions via REST API use `Content-Type: application/json` which is not susceptible to simple CSRF attacks
- Cookie consent and session cookies use `SameSite=Strict` or `SameSite=Lax`

#### Rate Limiting

- Strapi rate limiting middleware enabled to prevent form submission abuse:
  - Contact form: max **5 submissions per IP per 15 minutes**
  - Intake form: max **3 submissions per IP per 15 minutes**
- Return `429 Too Many Requests` with localized user-facing message
- Rate limiting configured in `apps/backend/config/middlewares.ts`

#### Secrets Management

- All secrets stored in environment variables — never committed to git
- `.env.example` documents required variables with placeholder values (no real secrets)
- `.gitignore` excludes `.env`, `.env.local`, `.env.production`
- API tokens rotated on schedule and after team member access changes
- Webhook secret is a minimum 32-character random string
- Strapi admin JWT secret and API token salt unique per environment

#### Dependency Security

- `pnpm audit` run in CI pipeline to detect known vulnerabilities
- Dependabot or Renovate configured for automated dependency update PRs
- Lock file (`pnpm-lock.yaml`) always committed — guarantees reproducible builds
- No `*` or `latest` version ranges — use exact or caret (`^`) ranges only
- Review changelogs before merging major version bumps

### Dependency Management

| Practice | Rule |
|----------|------|
| Package manager | pnpm only — enforced via `packageManager` field in root `package.json` and `engines` |
| Version ranges | Caret `^` for app dependencies, exact versions for critical tooling (TypeScript, Strapi) |
| Lock file | Always committed, never manually edited |
| Adding packages | Justify every new dependency — prefer built-in Node.js APIs and existing packages |
| Auditing | `pnpm audit` runs on every CI build; block merges on high/critical severity findings |
| Unused deps | `depcheck` run periodically to detect and remove unused packages |
| Peer deps | Resolve all peer dependency warnings during install |

**Minimal dependency philosophy**: Before adding a package, ask:
1. Can this be done with the Node.js standard library?
2. Can this be done with what's already installed (Astro, Strapi, Tailwind)?
3. Is the package actively maintained, well-typed, and < 50KB gzipped?
4. Does it have known security issues?

### Constants & Configuration

No magic numbers or hardcoded strings scattered through the codebase. All configurable values live in dedicated constant files or environment variables.

```typescript
// apps/backend/src/constants.ts

/**
 * Application-wide constants. All magic numbers and configurable
 * thresholds are defined here for single-source-of-truth management.
 */

/** Maximum time (ms) to wait for a webhook endpoint to respond */
export const WEBHOOK_TIMEOUT_MS = 10_000;

/** Maximum number of retry attempts for transient email failures */
export const EMAIL_MAX_RETRIES = 3;

/** Rate limit: max contact form submissions per IP per window */
export const RATE_LIMIT_CONTACT = { max: 5, windowMs: 15 * 60 * 1000 };

/** Rate limit: max intake form submissions per IP per window */
export const RATE_LIMIT_INTAKE = { max: 3, windowMs: 15 * 60 * 1000 };
```

```typescript
// apps/frontend/src/constants.ts

/**
 * Frontend application constants for UI configuration,
 * breakpoints, and display limits.
 */

/** Number of blog posts per page in the listing */
export const BLOG_POSTS_PER_PAGE = 9;

/** Responsive breakpoints matching Tailwind config */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Cloudinary responsive image widths for srcset generation */
export const IMAGE_WIDTHS = [400, 800, 1200] as const;
```

**Rules:**
- Every number literal in code must have a named constant or a clear inline explanation
- Strings used in more than one location must be a constant
- Configuration that may change per environment belongs in env vars, not constants

### CSS / Tailwind Conventions

#### Class Ordering

Follow a consistent order for Tailwind utility classes (enforced by `prettier-plugin-tailwindcss`):

```
Layout → Positioning → Sizing → Spacing → Typography → Visual → Interactive → Responsive
```

```html
<!-- Good: ordered by category -->
<div class="flex items-center gap-4 px-6 py-3 text-sm font-medium text-white bg-brand-green rounded-lg hover:bg-green-700 md:px-8">

<!-- Bad: random order -->
<div class="bg-brand-green text-sm flex hover:bg-green-700 rounded-lg py-3 px-6 text-white md:px-8 items-center font-medium gap-4">
```

#### Tailwind Theme Extension

Custom design tokens defined in `tailwind.config.mjs`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        'brand-green': '#7AAC2D',
        'brand-green-dark': '#5C8A1E',
        'brand-brown': '#8B6914',
        'brand-gold': '#C9A84C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

#### Styling Rules

- **Utility-first** — use Tailwind classes directly in markup; avoid custom CSS unless absolutely necessary
- **Component extraction** — when the same set of 5+ utilities repeats across 3+ places, extract into an Astro component (not a CSS class)
- **No `@apply` in most cases** — `@apply` hides utilities and breaks searchability; only use for base element styles in `global.css` (e.g., headings, links)
- **Responsive design** — mobile-first: base styles for mobile, then `md:`, `lg:`, `xl:` for larger screens
- **Dark mode** — not in scope for initial launch but Tailwind `dark:` variant ready if needed later
- **No inline `style` attributes** — all styling through Tailwind classes or scoped `<style>` in Astro components

### API Design Conventions

These conventions apply to any custom API endpoints beyond Strapi's auto-generated REST API.

#### Request / Response Format

- All request and response bodies use JSON (`Content-Type: application/json`)
- Follow Strapi's response envelope format for consistency:

```json
{
  "data": { ... },
  "meta": { "pagination": { "page": 1, "pageSize": 25, "pageCount": 4, "total": 100 } }
}
```

- Error responses follow Strapi's error format:

```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "email must be a valid email",
    "details": { "errors": [...] }
  }
}
```

#### Pagination

- Default page size: **25** items
- Maximum page size: **100** items (prevent abuse)
- Use `page` + `pageSize` query parameters (Strapi convention)
- Always return `meta.pagination` in collection responses

#### Query Parameters

- Filtering: `filters[field][$operator]=value` (Strapi convention)
- Sorting: `sort=field:asc` or `sort=field:desc`
- Population: `populate=relation1,relation2` for related data
- Locale: `locale=nl` or `locale=en`
- Field selection: `fields=title,slug,createdAt` to reduce payload size

#### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Successful GET, PUT, PATCH |
| `201` | Successful POST (resource created) |
| `204` | Successful DELETE (no content) |
| `400` | Validation error, malformed request |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `429` | Rate limited |
| `500` | Unexpected server error |

### Async Patterns

#### No Floating Promises

Every `async` function call must be `await`ed or explicitly handled. Unhandled promise rejections crash Node.js.

```typescript
// Good — awaited
await sendEmail(payload);

// Good — explicitly fire-and-forget with error handling
dispatchWebhook(payload).catch((err) =>
  strapi.log.error('Webhook failed:', err.message)
);

// Bad — floating promise, rejection will crash the process
sendEmail(payload);
```

#### Parallel vs Sequential Execution

```typescript
// Good — independent operations run in parallel
const [pages, posts, settings] = await Promise.all([
  fetchAPI<Page[]>('/api/pages', { locale }),
  fetchAPI<BlogPost[]>('/api/blog-posts', { locale, sort: 'createdAt:desc' }),
  fetchAPI<GlobalSettings>('/api/global-settings', { locale }),
]);

// Good — dependent operations run sequentially
const category = await fetchAPI<BlogCategory>(`/api/blog-categories/${id}`);
const posts = await fetchAPI<BlogPost[]>('/api/blog-posts', {
  'filters[category][id][$eq]': String(category.id),
});
```

- Use `Promise.all()` when operations are independent — reduces page load time
- Use `Promise.allSettled()` when some failures are acceptable (e.g., fetching optional sidebar data)
- Never use `Promise.all()` for operations where one failure should not cancel the others

#### Error Boundaries in Async Code

Every async boundary (API calls, form submissions, lifecycle hooks) must have a try/catch or `.catch()` at the top level. Unhandled rejections are never acceptable in production.

### Immutability & Functional Patterns

- Prefer `const` over `let` — only use `let` when reassignment is genuinely needed (loop counters, accumulators)
- Never use `var`
- Avoid mutating function arguments — return new objects/arrays instead:

```typescript
// Good — returns a new array
function addTimestamp<T>(items: T[]): (T & { timestamp: string })[] {
  return items.map((item) => ({ ...item, timestamp: new Date().toISOString() }));
}

// Bad — mutates the input array
function addTimestamp(items: any[]): void {
  items.forEach((item) => { item.timestamp = new Date().toISOString(); });
}
```

- Use `readonly` for interface properties that should never change after creation:

```typescript
interface WebhookPayload {
  readonly event: 'contact_submission.created' | 'intake_submission.created';
  readonly timestamp: string;
  readonly data: Record<string, unknown>;
}
```

- Prefer `as const` for literal arrays and objects that should not be mutated:

```typescript
const SUPPORTED_LOCALES = ['nl', 'en'] as const;
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

### 3.5 Strapi Response Types (`src/types/strapi.ts`)

Shared TypeScript interfaces for all Strapi REST API responses. Used by pages, components, and lib modules to ensure type safety when consuming CMS data.

```typescript
/**
 * TypeScript interfaces for Strapi REST API responses.
 *
 * These types mirror the Strapi v5 response format and are used by
 * the Strapi API client, page components, and test fixtures.
 * Update these when content type schemas change in Strapi.
 *
 * @module types/strapi
 */

/** Generic Strapi collection response wrapper */
export interface StrapiCollectionResponse<T> {
  data: StrapiEntity<T>[];
  meta: { pagination: StrapiPagination };
}

/** Generic Strapi single-item response wrapper */
export interface StrapiSingleResponse<T> {
  data: StrapiEntity<T>;
}

/** A Strapi entity with id and typed attributes */
export interface StrapiEntity<T> {
  id: number;
  attributes: T;
}

/** Strapi pagination metadata */
export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/** Page content type attributes */
export interface PageAttributes {
  title: string;
  slug: string;
  content: unknown; // Rich Text Blocks — rendered by Astro
  hero_image: StrapiMedia | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  show_in_nav: boolean;
  nav_order: number | null;
  seo: SEOComponent | null;
  locale: string;
}

/** Shared SEO component fields */
export interface SEOComponent {
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image: StrapiMedia | null;
  no_index: boolean;
  focus_keyword: string | null;
  structured_data_type: 'Organization' | 'LocalBusiness' | 'Service' | 'BlogPosting' | 'WebPage';
}

/** Strapi media object (Cloudinary-hosted) */
export interface StrapiMedia {
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
}
```

### 3.6 Form Submission Handler (`src/lib/form-handler.ts`)

Reusable client-side form handler shared between ContactForm.astro and IntakeForm.astro. Eliminates duplicated validation, submit, loading state, and error display logic.

```typescript
/**
 * Reusable form submission handler for client-side forms.
 *
 * Handles the full submission lifecycle: client-side validation,
 * API submission to Strapi, loading state management, error display,
 * and success redirect. Used by both ContactForm and IntakeForm.
 *
 * @module lib/form-handler
 */

import { t, type Locale } from './i18n';

interface FormHandlerOptions {
  /** The HTML form element to handle */
  form: HTMLFormElement;
  /** Strapi API endpoint path (e.g., '/api/contact-submissions') */
  endpoint: string;
  /** Current locale for redirect URL and error messages */
  locale: Locale;
}

/**
 * Initializes form submission handling on a form element.
 *
 * Attaches a submit event listener that:
 * 1. Validates all fields client-side
 * 2. Disables the submit button and shows loading text
 * 3. POSTs form data as JSON to the Strapi API endpoint
 * 4. Redirects to the thank-you page on success
 * 5. Displays a localized error message on failure
 *
 * @param options - Form element, API endpoint, and current locale
 *
 * @example
 * // In a <script> tag inside ContactForm.astro:
 * import { initFormHandler } from '../lib/form-handler';
 *
 * const form = document.querySelector('#contact-form') as HTMLFormElement;
 * initFormHandler({
 *   form,
 *   endpoint: '/api/contact-submissions',
 *   locale: 'nl',
 * });
 */
export function initFormHandler({ form, endpoint, locale }: FormHandlerOptions): void {
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  const errorContainer = form.querySelector('[data-form-error]') as HTMLElement;

  // Store original button text for restoring after error
  const originalButtonText = submitButton.textContent;

  form.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();

    // Clear previous errors
    errorContainer.textContent = '';
    errorContainer.hidden = true;

    // Client-side validation via native HTML5 constraint API
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Disable button to prevent double-submit
    submitButton.disabled = true;
    submitButton.textContent = t('form.submitting', locale);

    try {
      const response = await fetch(`${import.meta.env.PUBLIC_STRAPI_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: Object.fromEntries(new FormData(form)) }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        if (response.status === 400) {
          // Strapi validation error — show field-level message
          throw new Error(body?.error?.message ?? t('form.error.validation', locale));
        }
        throw new Error(t('form.error.server', locale));
      }

      // Success — redirect to localized thank-you page
      window.location.href = `/${locale}/bedankt`;
    } catch (error) {
      errorContainer.textContent = (error as Error).message;
      errorContainer.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}
```

### 3.7 Cloudinary URL Builder (`src/lib/cloudinary.ts`)

Reusable utility for generating optimized Cloudinary image URLs. Used by every component that renders images (Hero, BlogCard, SEOHead, etc.) to ensure consistent optimization.

```typescript
/**
 * Cloudinary URL builder for optimized image delivery.
 *
 * Generates Cloudinary URLs with automatic format (f_auto),
 * quality (q_auto), and responsive width transformations.
 * Centralizes image URL logic so all components use consistent
 * optimization settings.
 *
 * @module lib/cloudinary
 */

interface ImageOptions {
  /** Target width in pixels (omit for original size) */
  width?: number;
  /** Target height in pixels (omit for auto based on aspect ratio) */
  height?: number;
  /** Crop mode (default: 'fill') */
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
}

/**
 * Builds an optimized Cloudinary image URL with transformations.
 *
 * Always applies `f_auto` (automatic format: WebP/AVIF where supported)
 * and `q_auto` (automatic quality optimization). Additional transforms
 * can be specified via the options parameter.
 *
 * @param url - Full Cloudinary URL or public ID from Strapi media
 * @param options - Optional width, height, and crop settings
 * @returns URL string with Cloudinary transformation parameters applied
 *
 * @example
 * // Auto-optimized, no resize
 * cloudinaryUrl('https://res.cloudinary.com/demo/image/upload/hero.jpg')
 * // => 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/hero.jpg'
 *
 * // Resized to 800px wide
 * cloudinaryUrl('https://res.cloudinary.com/demo/image/upload/hero.jpg', { width: 800 })
 * // => 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_fill/hero.jpg'
 */
export function cloudinaryUrl(url: string, options?: ImageOptions): string {
  // Build transformation string from options
  const transforms = ['f_auto', 'q_auto'];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.width || options?.height) transforms.push(`c_${options?.crop ?? 'fill'}`);

  const transformStr = transforms.join(',');

  // Insert transformations into the Cloudinary URL path
  // Cloudinary URLs follow: .../image/upload/{transforms}/{public_id}
  return url.replace('/image/upload/', `/image/upload/${transformStr}/`);
}

/**
 * Generates a srcset string for responsive images.
 *
 * Creates multiple sized variants for use with the HTML `srcset` attribute,
 * enabling browsers to load the most appropriate image size.
 *
 * @param url - Full Cloudinary URL from Strapi media
 * @param widths - Array of pixel widths to generate (default: [400, 800, 1200])
 * @returns srcset string for use in <img> or <source> elements
 *
 * @example
 * <img
 *   src={cloudinaryUrl(image.url, { width: 800 })}
 *   srcset={cloudinarySrcset(image.url)}
 *   sizes="(max-width: 768px) 100vw, 800px"
 * />
 */
export function cloudinarySrcset(
  url: string,
  widths: number[] = [400, 800, 1200],
): string {
  return widths
    .map((w) => `${cloudinaryUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
```

### 3.8 Design Direction
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
/**
 * SMTP2GO email service for transactional notifications.
 *
 * Sends HTML + plain text emails via the SMTP2GO REST API.
 * Used by the shared submission handler to notify admins
 * when contact or intake forms are submitted.
 *
 * @see https://www.smtp2go.com/docs/api/
 * @module services/smtp2go
 */

/** SMTP2GO API request payload shape */
interface SMTP2GOPayload {
  api_key: string;
  to: string[];
  sender: string;
  subject: string;
  html_body: string;
  text_body: string;
}

/**
 * Sends a transactional email via the SMTP2GO REST API.
 *
 * The API key is injected automatically from the SMTP2GO_API_KEY env var.
 * See Phase 5 for detailed error handling additions (network errors,
 * response parsing, structured logging).
 *
 * @param payload - Email fields (recipients, sender, subject, body)
 * @throws {Error} If the SMTP2GO API returns a non-200 response
 */
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
/**
 * Generic webhook dispatcher for form submission events.
 *
 * POSTs form submission data to an external webhook URL so automation
 * tools (Zapier, Make, n8n) can pick up the data for further processing.
 * This service is non-critical — failures are logged but never thrown.
 *
 * See Phase 5 for detailed error handling additions (AbortController
 * timeout, structured logging, network error handling).
 *
 * @module services/webhook
 */

/** Webhook POST request payload shape */
interface WebhookPayload {
  event: 'contact_submission.created' | 'intake_submission.created';
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Dispatches a webhook POST to the configured automation tool endpoint.
 *
 * Skips silently if WEBHOOK_URL is not configured. Logs errors but
 * does NOT throw — webhook delivery must never break form submissions.
 *
 * @param payload - Event type, timestamp, and submission data to send
 */
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

### 4.4 Shared Types (`apps/backend/src/types/index.ts`)

Centralized TypeScript interfaces reused across services, lifecycle hooks, and tests.

```typescript
/**
 * Shared TypeScript interfaces for form submissions and service payloads.
 *
 * These types are the single source of truth for submission data shapes,
 * used by services, lifecycle hooks, and test fixtures.
 *
 * @module types
 */

/** Fields stored for a contact form submission */
export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
}

/** Fields stored for an intake form submission */
export interface IntakeSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  service_type: 'bedrijfsjuristen' | 'trust_formation' | 'belastingadvies' | null;
  message: string | null;
  createdAt: string;
}

/** Rendered email content ready to send via SMTP2GO */
export interface EmailContent {
  subject: string;
  html_body: string;
  text_body: string;
}
```

### 4.5 Email Template Builder (`apps/backend/src/services/email-templates.ts`)

Reusable module that generates email content from submission data. Used by both lifecycle hooks via the shared submission handler, eliminating duplicated HTML template strings.

```typescript
/**
 * Email template builder for form submission notifications.
 *
 * Generates consistent HTML + plain text email content from submission data.
 * Reused by both contact and intake lifecycle hooks via submission-handler.
 *
 * @module services/email-templates
 */

import type { ContactSubmission, IntakeSubmission, EmailContent } from '../types';

/** A single field to render in the email body */
interface EmailField {
  label: string;
  value: string;
}

/**
 * Renders an array of fields into an HTML email body.
 *
 * @param fields - Label/value pairs to render
 * @param heading - Email heading text (h2)
 * @returns HTML string with styled field list
 */
function renderHtml(fields: EmailField[], heading: string): string {
  const rows = fields
    .map((f) => `<p><strong>${f.label}:</strong> ${f.value}</p>`)
    .join('\n      ');
  return `
    <h2>${heading}</h2>
    ${rows}
  `;
}

/**
 * Renders an array of fields into a plain text email body.
 *
 * @param fields - Label/value pairs to render
 * @returns Plain text string with one field per line
 */
function renderPlainText(fields: EmailField[]): string {
  return fields.map((f) => `${f.label}: ${f.value}`).join('\n');
}

/**
 * Builds notification email content for a contact form submission.
 *
 * @param submission - The saved contact submission record from Strapi
 * @returns Email content with Dutch subject, HTML body, and plain text body
 */
export function buildContactEmail(submission: ContactSubmission): EmailContent {
  const fields: EmailField[] = [
    { label: 'Naam', value: submission.name },
    { label: 'Email', value: submission.email },
    { label: 'Telefoon', value: submission.phone ?? 'Niet opgegeven' },
    { label: 'Bericht', value: submission.message },
  ];
  return {
    subject: `Nieuw contactformulier: ${submission.name}`,
    html_body: renderHtml(fields, 'Nieuw contactformulier ontvangen'),
    text_body: renderPlainText(fields),
  };
}

/**
 * Builds notification email content for an intake form submission.
 *
 * @param submission - The saved intake submission record from Strapi
 * @returns Email content with Dutch subject, HTML body, and plain text body
 */
export function buildIntakeEmail(submission: IntakeSubmission): EmailContent {
  const fields: EmailField[] = [
    { label: 'Naam', value: submission.name },
    { label: 'Email', value: submission.email },
    { label: 'Telefoon', value: submission.phone ?? 'Niet opgegeven' },
    { label: 'Bedrijfsnaam', value: submission.company_name ?? 'Niet opgegeven' },
    { label: 'Dienst', value: submission.service_type ?? 'Niet opgegeven' },
    { label: 'Bericht', value: submission.message ?? 'Geen bericht' },
  ];
  return {
    subject: `Nieuwe intake aanvraag: ${submission.name} — ${submission.service_type}`,
    html_body: renderHtml(fields, 'Nieuwe intake aanvraag ontvangen'),
    text_body: renderPlainText(fields),
  };
}
```

### 4.6 Submission Lifecycle Handler (`apps/backend/src/services/submission-handler.ts`)

Shared handler that orchestrates the afterCreate pipeline for both submission types. Eliminates duplicated try/catch + email + webhook logic in each lifecycle file.

```typescript
/**
 * Shared lifecycle handler for form submission afterCreate hooks.
 *
 * Orchestrates the post-submission pipeline: email notification (critical)
 * followed by webhook dispatch (non-critical). Ensures consistent error
 * handling across both contact and intake submission types.
 *
 * @module services/submission-handler
 */

import type { EmailContent } from '../types';

interface WebhookEvent {
  event: 'contact_submission.created' | 'intake_submission.created';
}

interface SubmissionHandlerOptions<T> {
  /** The saved submission record from Strapi afterCreate event */
  result: T;
  /** Function that builds email content from the submission data */
  buildEmail: (submission: T) => EmailContent;
  /** Webhook event name dispatched to automation tools */
  webhookEvent: WebhookEvent['event'];
  /** Function that extracts webhook payload data from the submission */
  buildWebhookData: (submission: T) => Record<string, unknown>;
}

/**
 * Handles the afterCreate pipeline for a form submission.
 *
 * Pipeline steps:
 * 1. Send email notification via SMTP2GO (critical — throws on failure)
 * 2. Dispatch webhook to automation tool (non-critical — logs on failure)
 *
 * The submission is already saved to PostgreSQL before this runs (afterCreate),
 * so data is safe regardless of side-effect failures.
 *
 * @param options - Submission data, email builder, and webhook config
 * @throws {Error} If email notification fails (email is a critical side effect)
 *
 * @example
 * // In a lifecycle hook:
 * await handleSubmissionCreated({
 *   result,
 *   buildEmail: buildContactEmail,
 *   webhookEvent: 'contact_submission.created',
 *   buildWebhookData: (r) => ({ id: r.id, name: r.name, email: r.email }),
 * });
 */
export async function handleSubmissionCreated<T extends { id: number }>({
  result,
  buildEmail,
  webhookEvent,
  buildWebhookData,
}: SubmissionHandlerOptions<T>): Promise<void> {
  // Build email content using the type-specific template builder
  const email = buildEmail(result);

  // 1. Email is critical — propagate errors to the lifecycle hook caller
  try {
    await strapi.service('api::services.smtp2go').sendEmail({
      to: [process.env.ADMIN_NOTIFICATION_EMAIL],
      sender: process.env.SMTP2GO_SENDER_EMAIL,
      ...email,
    });
  } catch (error) {
    strapi.log.error('Submission email failed:', {
      submissionId: result.id,
      event: webhookEvent,
      error: error.message,
    });
    throw error;
  }

  // 2. Webhook is non-critical — log and swallow errors
  try {
    await strapi.service('api::services.webhook').dispatchWebhook({
      event: webhookEvent,
      timestamp: new Date().toISOString(),
      data: buildWebhookData(result),
    });
  } catch (error) {
    strapi.log.error('Submission webhook failed:', {
      submissionId: result.id,
      event: webhookEvent,
      error: error.message,
    });
    // Non-critical — do not rethrow
  }
}
```

### 4.7 Strapi Lifecycle Hooks

Both email and webhook are triggered via Strapi `afterCreate` lifecycle hooks on the submission content types. Each hook delegates to the shared `handleSubmissionCreated` handler.

#### Contact Submission Lifecycle (`apps/backend/src/api/contact-submission/content-types/contact-submission/lifecycles.ts`)

Uses the shared `handleSubmissionCreated` handler and `buildContactEmail` template builder — no duplicated email/webhook logic.

```typescript
/**
 * Contact submission afterCreate lifecycle hook.
 *
 * Delegates to the shared submission handler which sends an email
 * notification (critical) and dispatches a webhook (non-critical).
 * The submission is already saved to PostgreSQL before this runs.
 */
import { handleSubmissionCreated } from '../../../services/submission-handler';
import { buildContactEmail } from '../../../services/email-templates';
import type { ContactSubmission } from '../../../types';

export default {
  async afterCreate(event: { result: ContactSubmission }) {
    const { result } = event;

    await handleSubmissionCreated({
      result,
      buildEmail: buildContactEmail,
      webhookEvent: 'contact_submission.created',
      buildWebhookData: (r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        message: r.message,
        createdAt: r.createdAt,
      }),
    });
  },
};
```

#### Intake Submission Lifecycle (`apps/backend/src/api/intake-submission/content-types/intake-submission/lifecycles.ts`)

Same pattern as contact — delegates to the shared handler with intake-specific email template and webhook data.

```typescript
/**
 * Intake submission afterCreate lifecycle hook.
 *
 * Delegates to the shared submission handler which sends an email
 * notification (critical) and dispatches a webhook (non-critical).
 * The submission is already saved to PostgreSQL before this runs.
 */
import { handleSubmissionCreated } from '../../../services/submission-handler';
import { buildIntakeEmail } from '../../../services/email-templates';
import type { IntakeSubmission } from '../../../types';

export default {
  async afterCreate(event: { result: IntakeSubmission }) {
    const { result } = event;

    await handleSubmissionCreated({
      result,
      buildEmail: buildIntakeEmail,
      webhookEvent: 'intake_submission.created',
      buildWebhookData: (r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company_name: r.company_name,
        service_type: r.service_type,
        message: r.message,
        createdAt: r.createdAt,
      }),
    });
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
| 1 | Initialize monorepo + gitignore + workspace config + ESLint + Prettier | — |
| 2 | Scaffold Strapi backend with TypeScript (strict `tsconfig.json`) | Step 1 |
| 3 | Configure Strapi: PostgreSQL, i18n, Cloudinary (cloudinary.com) | Step 2 |
| 4 | Create all Strapi content types + SEO component | Step 3 |
| 5 | Set API permissions for public access | Step 4 |
| 6 | Scaffold Astro frontend with SSR + Tailwind (strict `tsconfig.json`) | Step 1 |
| 7 | **Build shared backend types** (`src/types/index.ts`: `ContactSubmission`, `IntakeSubmission`, `EmailContent`) | Step 4 |
| 8 | **Build shared frontend types** (`src/types/strapi.ts`: `StrapiCollectionResponse`, `PageAttributes`, `SEOComponent`, etc.) | Step 6 |
| 9 | Build Strapi API client (with `StrapiError` class + JSDoc) + i18n (with locale validation + fallback) + SEO utils | Step 8 |
| 10 | **Build Cloudinary URL builder** (`src/lib/cloudinary.ts`: `cloudinaryUrl`, `cloudinarySrcset`) | Step 6 |
| 11 | Build layout (Header, Footer, BaseLayout) with meta tags + hreflang | Steps 9, 10 |
| 12 | Build Homepage with structured data (JSON-LD) | Step 11 |
| 13 | Build dynamic page template ([slug]) with SEO component rendering | Step 11 |
| 14 | Build blog listing + detail pages with BlogPosting schema | Step 11 |
| 15 | **Build reusable form handler** (`src/lib/form-handler.ts`: `initFormHandler`) | Step 9 |
| 16 | Build contact form + intake form using shared form handler, with thank-you pages | Steps 11, 15 |
| 17 | Build SMTP2GO email service with JSDoc + network + API error handling | Step 7 |
| 18 | Build webhook dispatcher service with JSDoc + timeout + non-blocking error handling | Step 7 |
| 19 | **Build email template builder** (`email-templates.ts`: `buildContactEmail`, `buildIntakeEmail`) | Step 7 |
| 20 | **Build shared submission handler** (`submission-handler.ts`: `handleSubmissionCreated`) | Steps 17, 18, 19 |
| 21 | Add lifecycle hooks on Contact + Intake Submission (delegates to shared handler) | Step 20 |
| 22 | **Add environment variable validation** (`src/utils/env.ts` + Strapi bootstrap) | Step 3 |
| 23 | **Add SSR error pages** (404, 500) and Strapi-unavailable handling (502) | Step 13 |
| 24 | **Write backend unit tests** (SMTP2GO, webhook, email templates, submission handler, lifecycle hooks — including error paths) | Steps 17-22 |
| 25 | **Write backend integration tests** (API endpoints with test DB + Supertest — including validation error responses) | Steps 5, 24 |
| 26 | **Write backend functional tests** (form → DB, form → email, form → webhook — including failure scenarios) | Step 25 |
| 27 | **Write frontend unit tests** (Strapi client error handling, i18n fallbacks, SEO helpers, JSON-LD, Cloudinary URL builder, form handler) | Steps 9, 15, 16 |
| 28 | **Write E2E tests** (Playwright: forms with error states, i18n, SEO, blog, navigation, 404 page) | Steps 16, 23, 25 |
| 29 | **Set up CI pipeline** (GitHub Actions: lint, format check, unit, integration, functional, E2E) | Step 28 |
| 30 | Add sitemap.xml + robots.txt + canonical URLs | Steps 12-14 |
| 31 | Implement GTM, GA4, cookie consent + conversion tracking | Steps 12-14 |
| 32 | Add Railway deployment configs (incl. SMTP2GO + webhook env vars) | Steps 5, 31 |
| 33 | Lighthouse audit + Core Web Vitals optimization | Step 32 |
| 34 | **Run full test suite — all tests must pass before deploy** | Steps 24-29 |
| 35 | Deploy to Railway | Steps 32, 33, 34 |
| 36 | Configure Google Ads conversion tracking via GTM | Step 35 |
| 37 | Connect webhook URL to automation tool (Zapier/Make/n8n) | Step 35 |
| 38 | Migrate content in Strapi admin (with SEO fields filled) | Step 35 |
