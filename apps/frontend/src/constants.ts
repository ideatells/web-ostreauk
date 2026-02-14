/**
 * Centralized configuration constants for ostrea.uk frontend.
 * Eliminates magic numbers and ensures consistency across the application.
 */

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from './lib/i18n';

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export const BLOG_POSTS_PER_PAGE = 12;
export const BLOG_POSTS_PER_PAGE_MOBILE = 6;

// ---------------------------------------------------------------------------
// Image Dimensions
// ---------------------------------------------------------------------------

export const IMAGE_WIDTHS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  hero: 1920,
} as const;

// ---------------------------------------------------------------------------
// Cloudinary Transformations
// ---------------------------------------------------------------------------

export const CLOUDINARY_TRANSFORMATIONS = {
  auto: 'f_auto,q_auto',
  responsive: 'f_auto,q_auto,w_auto',
  thumbnail: 'f_auto,q_auto,w_300,h_300,c_fill',
  hero: 'f_auto,q_auto,w_1920,h_800,c_fill',
} as const;

// ---------------------------------------------------------------------------
// Breakpoints (matching Tailwind config)
// ---------------------------------------------------------------------------

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ---------------------------------------------------------------------------
// Site
// ---------------------------------------------------------------------------

export const SITE_URL = 'https://ostrea.uk';

// ---------------------------------------------------------------------------
// Strapi (from environment)
// ---------------------------------------------------------------------------

export const STRAPI_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.STRAPI_URL) ||
  (typeof process !== 'undefined' && process.env?.STRAPI_URL) ||
  'http://localhost:1337';

export const PUBLIC_STRAPI_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_STRAPI_URL) ||
  (typeof process !== 'undefined' && process.env?.PUBLIC_STRAPI_URL) ||
  'http://localhost:1337';
