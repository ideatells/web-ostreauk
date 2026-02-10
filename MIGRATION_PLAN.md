# Migration Plan: ostrea.uk → Strapi + Astro.js on Railway

## Architecture

```
                    ┌─────────────────┐
                    │   Cloudinary    │
                    │  (Image CDN)    │
                    └────────▲────────┘
                             │
┌─────────────┐     ┌───────┴──────┐     ┌────────────────┐
│  Astro.js   │────▶│  Strapi API  │────▶│  PostgreSQL    │
│  (SSR)      │     │  (Headless)  │     │  (Railway DB)  │
│  Railway    │     │  Railway     │     │                │
└─────────────┘     └──────────────┘     └────────────────┘
  Port 4321           Port 1337            Railway managed
  Node adapter        REST API
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Astro.js (SSR) | Node.js adapter, TypeScript |
| Styling | Tailwind CSS | Fresh modern design |
| Backend/CMS | Strapi v5 | Headless CMS with admin panel |
| Database | PostgreSQL | Railway managed instance |
| Media | Cloudinary | Image uploads + CDN + optimization |
| i18n | Strapi i18n plugin + Astro | Dutch (default) + English |
| Deployment | Railway | Two services + one database |
| Package Manager | pnpm | Monorepo workspaces |
| SEO | @astrojs/sitemap, structured data, meta tags | Best practices for organic search |
| SEA Readiness | Google Tag Manager, conversion tracking | Ready for Google Ads / paid campaigns |

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
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── robots.txt
│   │   ├── astro.config.mjs
│   │   ├── tailwind.config.mjs
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
│       │   │   └── intake-submission/  # Intake form entries
│       │   ├── components/
│       │   │   └── shared/            # Reusable components
│       │   └── extensions/
│       ├── config/
│       │   ├── database.ts
│       │   ├── server.ts
│       │   ├── admin.ts
│       │   ├── middlewares.ts
│       │   └── plugins.ts            # i18n + cloudinary config
│       ├── tsconfig.json
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json                  # Root workspace config
├── .gitignore
├── .env.example
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
- Install and configure `@strapi/provider-upload-cloudinary`

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

## Phase 4: Email Notifications

- Install Strapi email plugin (`@strapi/provider-email-nodemailer` or SendGrid)
- Configure lifecycle hooks on Contact Submission and Intake Submission:
  - On `afterCreate`: send email notification to admin
  - Include all submitted form fields in the email
- Environment variables for SMTP/SendGrid credentials

---

## Phase 5: Railway Deployment

### 5.1 Railway Services

| Service | Type | Build Command | Start Command |
|---------|------|---------------|---------------|
| backend | Node.js | `pnpm --filter backend build` | `pnpm --filter backend start` |
| frontend | Node.js | `pnpm --filter frontend build` | `node apps/frontend/dist/server/entry.mjs` |
| database | PostgreSQL | — (managed) | — |

### 5.2 Environment Variables

**Backend (Strapi):**
```
DATABASE_URL=<railway postgres connection string>
APP_KEYS=<random keys>
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
JWT_SECRET=<random>
CLOUDINARY_NAME=<cloudinary cloud name>
CLOUDINARY_KEY=<api key>
CLOUDINARY_SECRET=<api secret>
STRAPI_URL=https://api.ostrea.uk  (or Railway-provided URL)
```

**Frontend (Astro):**
```
STRAPI_URL=https://api.ostrea.uk  (internal Railway URL or public)
STRAPI_API_TOKEN=<generated in Strapi admin>
PUBLIC_STRAPI_URL=https://api.ostrea.uk  (for client-side requests)
```

### 5.3 Custom Domains (optional)
- Frontend: `ostrea.uk` / `www.ostrea.uk`
- Backend: `api.ostrea.uk` (or keep Railway URL for admin)

---

## Phase 6: SEO Optimization (Search Engine Optimization)

### 6.1 Technical SEO

- **Semantic HTML**: Use proper heading hierarchy (single `<h1>` per page, logical `<h2>`-`<h6>`)
- **Performance**: Target Lighthouse score 90+ on all Core Web Vitals (LCP, FID, CLS)
  - Astro ships zero JS by default — leverage this for fast page loads
  - Lazy-load images below the fold with `loading="lazy"` and `decoding="async"`
  - Preload critical fonts and above-the-fold images
  - Use Cloudinary auto-format (`f_auto`) and responsive sizing (`w_auto`) for optimal image delivery
- **Sitemap**: Install `@astrojs/sitemap` to auto-generate `sitemap.xml` with all pages + blog posts for both `nl` and `en` locales
- **robots.txt**: Serve a `robots.txt` allowing all crawlers, pointing to sitemap URL
- **Canonical URLs**: Auto-generate `<link rel="canonical">` on every page (overridable via CMS)
- **Hreflang tags**: Add `<link rel="alternate" hreflang="nl">` and `<link rel="alternate" hreflang="en">` on every page for multilingual SEO
- **SSL/HTTPS**: Enforced by Railway by default
- **Mobile-friendly**: Responsive design with proper `<meta name="viewport">` tag
- **Clean URL structure**: `/nl/bedrijfsjuristen`, `/en/business-lawyers` — no trailing slashes, no query params

### 6.2 On-Page SEO (CMS-Driven)

Every page and blog post gets these editable SEO fields (via the shared SEO component in Strapi):

- **Title tag** (`<title>`): CMS-editable, falls back to page title + site name
- **Meta description**: CMS-editable, falls back to excerpt or first 160 chars
- **OpenGraph tags**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale`
- **Twitter Card tags**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **Focus keyword**: Editorial field in CMS to guide content writers (not rendered)
- **No-index control**: Per-page toggle to exclude from search engines

### 6.3 Structured Data (JSON-LD)

Implement JSON-LD structured data on every page, with type driven by the CMS `structured_data_type` field:

| Page | Schema Type | Data |
|------|------------|------|
| All pages | `Organization` | Company name, logo, phone, address |
| Homepage | `WebSite` + `LocalBusiness` | Name, services, contact info, opening hours |
| Service pages | `Service` | Service name, description, provider |
| Blog posts | `BlogPosting` | Title, author, date, image, description |
| Contact page | `ContactPoint` | Phone, email, address |

### 6.4 Blog SEO

- **Clean URLs**: `/nl/blog/post-title-slug`
- **Blog listing pagination**: With `rel="next"` / `rel="prev"` links
- **Category pages**: Filtered blog views for topical authority
- **Publish date**: Rendered in HTML and structured data for freshness signals
- **Featured image alt text**: Editable in CMS, auto-required for accessibility + SEO

### 6.5 Performance & Core Web Vitals

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | Preload hero images, Cloudinary CDN, minimal JS |
| FID (First Input Delay) | < 100ms | Astro ships zero JS by default, forms use progressive enhancement |
| CLS (Cumulative Layout Shift) | < 0.1 | Explicit image dimensions, font-display: swap, no layout-shifting ads |
| TTFB (Time to First Byte) | < 800ms | Railway SSR with edge caching, efficient Strapi queries |

---

## Phase 7: SEA Readiness (Search Engine Advertising)

### 7.1 Tracking & Analytics Infrastructure

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

### 7.2 Conversion Tracking

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

### 7.3 Landing Page Best Practices for SEA

- **Fast load times**: Critical for Google Ads Quality Score (target < 3s on mobile)
- **Clear CTA above the fold**: "NU OPRICHTEN" button visible without scrolling
- **Phone number in header**: Click-to-call for mobile visitors from ads
- **Service-specific pages**: Each service page can serve as a dedicated ad landing page
- **UTM parameter support**: Ensure UTM params pass through cleanly (no stripping by redirects)
- **Ad extensions data**: Structured data (phone, address, services) feeds Google Ads extensions

### 7.4 Global Settings Additions for SEA

Add to Global Settings single type in Strapi:

| Field | Type | Notes |
|-------|------|-------|
| gtm_container_id | Text | Google Tag Manager container ID (e.g. GTM-XXXXXXX) |
| ga4_measurement_id | Text | GA4 measurement ID (e.g. G-XXXXXXXXXX) |
| google_ads_id | Text | Google Ads account ID for conversion tracking |
| cookie_consent_text | Text (long) | Localized, GDPR cookie banner message |

---

## Phase 8: Content Migration

After deployment:
1. Access Strapi admin panel
2. Create pages: Home, Bedrijfsjuristen, Trust & Company Formation, Belastingadviseurs
3. Upload logo and page images via media library (stored in Cloudinary)
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
| 3 | Configure Strapi: PostgreSQL, i18n, Cloudinary | Step 2 |
| 4 | Create all Strapi content types + SEO component | Step 3 |
| 5 | Set API permissions for public access | Step 4 |
| 6 | Scaffold Astro frontend with SSR + Tailwind | Step 1 |
| 7 | Build Strapi API client + i18n + SEO utils | Step 6 |
| 8 | Build layout (Header, Footer, BaseLayout) with meta tags + hreflang | Step 7 |
| 9 | Build Homepage with structured data (JSON-LD) | Step 8 |
| 10 | Build dynamic page template ([slug]) with SEO component rendering | Step 8 |
| 11 | Build blog listing + detail pages with BlogPosting schema | Step 8 |
| 12 | Build contact form + intake form with thank-you pages | Step 8 |
| 13 | Configure email notifications in Strapi | Step 4 |
| 14 | Add sitemap.xml + robots.txt + canonical URLs | Steps 9-12 |
| 15 | Implement GTM, GA4, cookie consent + conversion tracking | Steps 9-12 |
| 16 | Add Railway deployment configs | Steps 5, 15 |
| 17 | Lighthouse audit + Core Web Vitals optimization | Step 16 |
| 18 | Deploy to Railway | Step 16, 17 |
| 19 | Configure Google Ads conversion tracking via GTM | Step 18 |
| 20 | Migrate content in Strapi admin (with SEO fields filled) | Step 18 |
