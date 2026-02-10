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
│   │   │   │   └── LanguageSwitcher.astro
│   │   │   ├── layouts/
│   │   │   │   └── BaseLayout.astro
│   │   │   ├── lib/
│   │   │   │   ├── strapi.ts      # Strapi API client
│   │   │   │   └── i18n.ts        # i18n utilities
│   │   │   ├── pages/
│   │   │   │   ├── index.astro            # Redirect to /nl
│   │   │   │   ├── [lang]/
│   │   │   │   │   ├── index.astro        # Homepage
│   │   │   │   │   ├── [slug].astro       # Dynamic CMS pages
│   │   │   │   │   ├── contact.astro      # Contact form page
│   │   │   │   │   ├── nu-oprichten.astro # Intake form page
│   │   │   │   │   └── blog/
│   │   │   │   │       ├── index.astro    # Blog listing
│   │   │   │   │       └── [slug].astro   # Blog post detail
│   │   │   └── styles/
│   │   │       └── global.css
│   │   ├── public/
│   │   │   └── favicon.svg
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
| seo_title | Text | Localized, for `<title>` tag |
| seo_description | Text (long) | Localized, for meta description |
| show_in_nav | Boolean | Whether to show in navigation menu |
| nav_order | Integer | Order in navigation menu |

#### Blog Post (Collection Type)
| Field | Type | Notes |
|-------|------|-------|
| title | Text | Required, localized |
| slug | UID (from title) | Required, unique |
| body | Rich Text (Blocks) | Localized |
| featured_image | Media (single) | Optional |
| publish_date | Date | Required |
| category | Relation (many-to-one) | → Blog Category |
| seo_title | Text | Localized |
| seo_description | Text (long) | Localized |

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

## Phase 6: Content Migration

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
| 4 | Create all Strapi content types + components | Step 3 |
| 5 | Set API permissions for public access | Step 4 |
| 6 | Scaffold Astro frontend with SSR + Tailwind | Step 1 |
| 7 | Build Strapi API client + i18n utils | Step 6 |
| 8 | Build layout (Header, Footer, BaseLayout) | Step 7 |
| 9 | Build Homepage | Step 8 |
| 10 | Build dynamic page template ([slug]) | Step 8 |
| 11 | Build blog listing + detail pages | Step 8 |
| 12 | Build contact form + intake form | Step 8 |
| 13 | Configure email notifications in Strapi | Step 4 |
| 14 | Add Railway deployment configs | Steps 4, 12 |
| 15 | Test full flow locally | Steps 12, 13 |
| 16 | Deploy to Railway | Step 14, 15 |
| 17 | Migrate content in Strapi admin | Step 16 |
