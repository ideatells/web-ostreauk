/**
 * Typed Strapi REST API client for ostrea.uk frontend.
 * Provides generic fetch functions and content-type-specific helpers.
 */

import { PUBLIC_STRAPI_URL, STRAPI_URL } from '../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Locale = 'nl' | 'en';

export interface StrapiEntity<T> {
  id: number;
  attributes: T;
}

export interface StrapiSingleRelation<T> {
  data: StrapiEntity<T> | null;
}

export interface StrapiMedia {
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: Record<string, unknown> | null;
  url: string;
  provider: string;
}

export type StructuredDataType =
  | 'Organization'
  | 'LocalBusiness'
  | 'Service'
  | 'BlogPosting'
  | 'WebPage';

export interface StrapiSEO {
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image: StrapiSingleRelation<StrapiMedia> | null;
  no_index: boolean;
  focus_keyword: string | null;
  structured_data_type: StructuredDataType | null;
}

export interface Page {
  title: string;
  slug: string;
  content: string | null;
  hero_image: StrapiSingleRelation<StrapiMedia> | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  show_in_nav: boolean;
  nav_order: number | null;
  seo: StrapiSEO | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface BlogCategory {
  name: string;
  slug: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface BlogPost {
  title: string;
  slug: string;
  body: string | null;
  featured_image: StrapiSingleRelation<StrapiMedia> | null;
  excerpt: string | null;
  publish_date: string;
  category: StrapiSingleRelation<BlogCategory> | null;
  seo: StrapiSEO | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface GlobalSettings {
  site_name: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  logo: StrapiSingleRelation<StrapiMedia> | null;
  footer_text: string | null;
  cta_button_text: string | null;
  cta_button_url: string | null;
  gtm_container_id: string | null;
  ga4_measurement_id: string | null;
  google_ads_id: string | null;
  cookie_consent_text: string | null;
  default_og_image: StrapiSingleRelation<StrapiMedia> | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export type ServiceType =
  | 'bedrijfsjuristen'
  | 'trust_formation'
  | 'belastingadvies';

export interface IntakeSubmission {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  service_type?: ServiceType;
  message?: string;
}

export interface StrapiResponse<T> {
  data: StrapiEntity<T> | null;
  meta?: Record<string, unknown>;
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiCollectionResponse<T> {
  data: StrapiEntity<T>[];
  meta: {
    pagination: StrapiPagination;
  };
}

export interface ContentEntity<T> {
  id: number;
  attributes: T;
}

export interface PageData extends Omit<Page, 'hero_image' | 'seo'> {
  id: number;
  hero_image: ContentEntity<StrapiMedia> | null;
  seo: (Omit<StrapiSEO, 'og_image'> & { og_image: ContentEntity<StrapiMedia> | null }) | null;
}

export interface BlogCategoryData extends BlogCategory {
  id: number;
}

export interface BlogPostData
  extends Omit<BlogPost, 'featured_image' | 'category' | 'seo'> {
  id: number;
  featured_image: ContentEntity<StrapiMedia> | null;
  category: BlogCategoryData | null;
  seo: (Omit<StrapiSEO, 'og_image'> & { og_image: ContentEntity<StrapiMedia> | null }) | null;
}

export interface GlobalSettingsData
  extends Omit<GlobalSettings, 'logo' | 'default_og_image'> {
  id: number;
  logo: ContentEntity<StrapiMedia> | null;
  default_og_image: ContentEntity<StrapiMedia> | null;
}

export interface FlattenedCollectionResponse<T> {
  data: T[];
  meta: {
    pagination: StrapiPagination;
  };
}

// ---------------------------------------------------------------------------
// URL Builder
// ---------------------------------------------------------------------------

function serializeFilters(
  url: URL,
  prefix: string,
  filters: Record<string, unknown>
): void {
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    const paramKey = `${prefix}[${key}]`;
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value !== null &&
      Object.keys(value).every((k) => k.startsWith('$'))
    ) {
      for (const [op, v] of Object.entries(value as Record<string, unknown>)) {
        url.searchParams.set(`${paramKey}[${op}]`, String(v));
      }
    } else if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value !== null
    ) {
      serializeFilters(url, paramKey, value as Record<string, unknown>);
    } else {
      url.searchParams.set(`${paramKey}[$eq]`, String(value));
    }
  }
}

export interface StrapiQueryParams {
  locale?: Locale;
  populate?: string | string[];
  filters?: Record<string, unknown>;
  sort?: string | string[];
  pagination?: { page?: number; pageSize?: number };
}

function buildStrapiUrl(
  endpoint: string,
  params: StrapiQueryParams = {}
): string {
  const baseUrl = STRAPI_URL;
  const url = new URL(`/api/${endpoint}`, baseUrl);

  if (params.locale) {
    url.searchParams.set('locale', params.locale);
  }

  if (params.populate) {
    const populate =
      typeof params.populate === 'string'
        ? params.populate
        : params.populate.join(',');
    url.searchParams.set('populate', populate);
  }

  if (params.filters && Object.keys(params.filters).length > 0) {
    serializeFilters(url, 'filters', params.filters);
  }

  if (params.sort) {
    const sort =
      typeof params.sort === 'string' ? params.sort : params.sort.join(',');
    url.searchParams.set('sort', sort);
  }

  if (params.pagination) {
    if (params.pagination.page !== undefined) {
      url.searchParams.set('pagination[page]', String(params.pagination.page));
    }
    if (params.pagination.pageSize !== undefined) {
      url.searchParams.set(
        'pagination[pageSize]',
        String(params.pagination.pageSize)
      );
    }
  }

  return url.toString();
}

// ---------------------------------------------------------------------------
// Generic Fetch Functions
// ---------------------------------------------------------------------------

async function fetchAPI<T>(
  url: string,
  options: RequestInit = {},
  config: { includeAuth?: boolean } = {}
): Promise<T> {
  const includeAuth = config.includeAuth ?? true;
  const apiToken =
    (typeof import.meta !== 'undefined' && import.meta.env?.STRAPI_API_TOKEN) ||
    process.env.STRAPI_API_TOKEN ||
    '';
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (includeAuth && apiToken) {
    headers.set('Authorization', `Bearer ${apiToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Strapi API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) {
        errorMessage = `${errorMessage} - ${errorBody.error.message}`;
      } else if (errorBody?.message) {
        errorMessage = `${errorMessage} - ${errorBody.message}`;
      }
    } catch {
      const text = await response.text();
      if (text) errorMessage = `${errorMessage} - ${text}`;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function fetchSingle<T>(
  endpoint: string,
  params: StrapiQueryParams = {}
): Promise<StrapiResponse<T>> {
  const url = buildStrapiUrl(endpoint, params);
  return fetchAPI<StrapiResponse<T>>(url);
}

export async function fetchCollection<T>(
  endpoint: string,
  params: StrapiQueryParams = {}
): Promise<StrapiCollectionResponse<T>> {
  const url = buildStrapiUrl(endpoint, params);
  return fetchAPI<StrapiCollectionResponse<T>>(url);
}

// ---------------------------------------------------------------------------
// Content-Type-Specific Functions
// ---------------------------------------------------------------------------

const DEFAULT_POPULATE_PAGE = ['hero_image', 'seo', 'seo.og_image'];
const DEFAULT_POPULATE_BLOG_POST = ['featured_image', 'category', 'seo', 'seo.og_image'];

function unwrapEntity<T>(entity: StrapiEntity<T>): ContentEntity<T> {
  return {
    id: entity.id,
    attributes: entity.attributes,
  };
}

function unwrapMedia(media: StrapiSingleRelation<StrapiMedia> | null): ContentEntity<StrapiMedia> | null {
  return media?.data ? unwrapEntity(media.data) : null;
}

function unwrapSeo(
  seo: StrapiSEO | null
): (Omit<StrapiSEO, 'og_image'> & { og_image: ContentEntity<StrapiMedia> | null }) | null {
  if (!seo) {
    return null;
  }

  return {
    ...seo,
    og_image: unwrapMedia(seo.og_image),
  };
}

function mapPage(entity: StrapiEntity<Page>): PageData {
  const { hero_image, seo, ...rest } = entity.attributes;
  return {
    id: entity.id,
    ...rest,
    hero_image: unwrapMedia(hero_image),
    seo: unwrapSeo(seo),
  };
}

function mapBlogCategory(entity: StrapiEntity<BlogCategory>): BlogCategoryData {
  return {
    id: entity.id,
    ...entity.attributes,
  };
}

function mapBlogPost(entity: StrapiEntity<BlogPost>): BlogPostData {
  const { featured_image, category, seo, ...rest } = entity.attributes;
  return {
    id: entity.id,
    ...rest,
    featured_image: unwrapMedia(featured_image),
    category: category?.data ? mapBlogCategory(category.data) : null,
    seo: unwrapSeo(seo),
  };
}

function mapGlobalSettings(entity: StrapiEntity<GlobalSettings>): GlobalSettingsData {
  const { logo, default_og_image, ...rest } = entity.attributes;
  return {
    id: entity.id,
    ...rest,
    logo: unwrapMedia(logo),
    default_og_image: unwrapMedia(default_og_image),
  };
}

export async function fetchPages(
  locale: Locale,
  populate?: string[]
): Promise<FlattenedCollectionResponse<PageData>> {
  const response = await fetchCollection<Page>('pages', {
    locale,
    populate: populate ?? DEFAULT_POPULATE_PAGE,
    filters: { publishedAt: { $notNull: true } },
    sort: ['nav_order:asc'],
  });

  return {
    data: response.data.map(mapPage),
    meta: response.meta,
  };
}

export async function fetchPageBySlug(
  slug: string,
  locale: Locale
): Promise<PageData | null> {
  const response = await fetchCollection<Page>('pages', {
    locale,
    populate: DEFAULT_POPULATE_PAGE,
    filters: { slug, publishedAt: { $notNull: true } },
  });

  const page = response.data[0];
  return page ? mapPage(page) : null;
}

export async function fetchBlogPosts(
  locale: Locale,
  page = 1,
  pageSize = 12,
  categorySlug?: string
): Promise<FlattenedCollectionResponse<BlogPostData>> {
  const filters: Record<string, unknown> = {
    publishedAt: { $notNull: true },
  };
  if (categorySlug) {
    filters['category'] = { slug: categorySlug };
  }
  const response = await fetchCollection<BlogPost>('blog-posts', {
    locale,
    populate: DEFAULT_POPULATE_BLOG_POST,
    filters,
    sort: ['publish_date:desc'],
    pagination: { page, pageSize },
  });

  return {
    data: response.data.map(mapBlogPost),
    meta: response.meta,
  };
}

export async function fetchBlogPostBySlug(
  slug: string,
  locale: Locale
): Promise<BlogPostData | null> {
  const response = await fetchCollection<BlogPost>('blog-posts', {
    locale,
    populate: DEFAULT_POPULATE_BLOG_POST,
    filters: { slug, publishedAt: { $notNull: true } },
  });

  const post = response.data[0];
  return post ? mapBlogPost(post) : null;
}

export async function fetchBlogCategories(
  locale: Locale
): Promise<FlattenedCollectionResponse<BlogCategoryData>> {
  const response = await fetchCollection<BlogCategory>('blog-categories', {
    locale,
    filters: { publishedAt: { $notNull: true } },
  });

  return {
    data: response.data.map(mapBlogCategory),
    meta: response.meta,
  };
}

export async function fetchGlobalSettings(
  locale: Locale
): Promise<GlobalSettingsData | null> {
  const response = await fetchSingle<GlobalSettings>('global-setting', {
    locale,
    populate: ['logo', 'default_og_image'],
  });

  return response.data ? mapGlobalSettings(response.data) : null;
}

export async function createContactSubmission(
  data: ContactSubmission
): Promise<StrapiResponse<unknown>> {
  const isClient = typeof window !== 'undefined';
  const baseUrl = isClient ? PUBLIC_STRAPI_URL : STRAPI_URL;
  const url = `${baseUrl}/api/contact-submissions`;

  return fetchAPI<StrapiResponse<unknown>>(url, {
    method: 'POST',
    body: JSON.stringify({ data }),
  }, {
    includeAuth: !isClient,
  });
}

export async function createIntakeSubmission(
  data: IntakeSubmission
): Promise<StrapiResponse<unknown>> {
  const isClient = typeof window !== 'undefined';
  const baseUrl = isClient ? PUBLIC_STRAPI_URL : STRAPI_URL;
  const url = `${baseUrl}/api/intake-submissions`;

  return fetchAPI<StrapiResponse<unknown>>(url, {
    method: 'POST',
    body: JSON.stringify({ data }),
  }, {
    includeAuth: !isClient,
  });
}
