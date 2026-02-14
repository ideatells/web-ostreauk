# Frontend (Astro SSR)

## Development commands

- `pnpm --filter frontend dev` starts Astro dev server on port 4321.
- `pnpm --filter frontend build` creates production SSR output.
- `pnpm --filter frontend preview` runs local preview of the production build.

## Base layout usage

Use `BaseLayout` in page files and provide at least a title:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Page Title" description="Optional description" lang="nl">
  <h1>Pagina titel</h1>
</BaseLayout>
```

## Astro + shadcn/ui usage

shadcn/ui components are React components and can be rendered in `.astro` files.

- Use `client:load` for immediate interactivity (forms, key UX interactions).
- Use `client:visible` for below-the-fold components to reduce initial JS.
- Use `client:idle` for non-critical hydration.

Example:

```astro
---
import { Button } from "@/components/ui/button";
---

<Button client:load>Click me</Button>
```

Add new shadcn/ui components with:

```bash
npx shadcn@latest add <component>
```

## Tailwind conventions

- Use brand tokens: `text-brand-green`, `bg-brand-green`, `hover:bg-brand-green-dark`, `text-brand-gold`.
- Follow mobile-first responsive classes (`md:`, `lg:`, `xl:`).
- Keep utility ordering consistent with `prettier-plugin-tailwindcss`.
