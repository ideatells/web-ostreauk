/**
 * Internationalization utilities and translation objects for ostrea.uk.
 * Supports Dutch (default) and English locales with URL-based routing.
 */

import type { Locale } from './strapi';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUPPORTED_LOCALES = ['nl', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'nl';

// ---------------------------------------------------------------------------
// Translation Types
// ---------------------------------------------------------------------------

export interface Translations {
  nav: {
    home: string;
    services: string;
    blog: string;
    contact: string;
  };
  form: {
    name: string;
    email: string;
    phone: string;
    message: string;
    companyName: string;
    serviceType: string;
    submit: string;
    submitting: string;
    required: string;
    invalidEmail: string;
    minLength: string;
    submitError: string;
  };
  serviceType: {
    bedrijfsjuristen: string;
    trust_formation: string;
    belastingadvies: string;
  };
  blog: {
    readMore: string;
    publishedOn: string;
    category: string;
    allCategories: string;
    noPostsFound: string;
  };
  common: {
    loading: string;
    error: string;
    backToHome: string;
    cookieConsent: string;
    acceptCookies: string;
  };
  thankYou: {
    title: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Translation Objects
// ---------------------------------------------------------------------------

export const translations: Record<Locale, Translations> = {
  nl: {
    nav: {
      home: 'Home',
      services: 'Diensten',
      blog: 'Blog',
      contact: 'Contact',
    },
    form: {
      name: 'Naam',
      email: 'E-mailadres',
      phone: 'Telefoonnummer',
      message: 'Bericht',
      companyName: 'Bedrijfsnaam',
      serviceType: 'Type dienst',
      submit: 'Versturen',
      submitting: 'Verzenden...',
      required: 'Dit veld is verplicht',
      invalidEmail: 'Voer een geldig e-mailadres in',
      minLength: 'Minimaal {n} tekens',
      submitError: 'Er is een fout opgetreden. Probeer het opnieuw.',
    },
    serviceType: {
      bedrijfsjuristen: 'Bedrijfsjuristen',
      trust_formation: 'Trust oprichten',
      belastingadvies: 'Belastingadvies',
    },
    blog: {
      readMore: 'Lees meer',
      publishedOn: 'Gepubliceerd op',
      category: 'Categorie',
      allCategories: 'Alle categorieën',
      noPostsFound: 'Geen berichten gevonden',
    },
    common: {
      loading: 'Laden...',
      error: 'Er is een fout opgetreden',
      backToHome: 'Terug naar home',
      cookieConsent:
        'Wij gebruiken cookies om uw ervaring te verbeteren en ons verkeer te analyseren. Door op "Accepteren" te klikken, stemt u in met ons gebruik van cookies.',
      acceptCookies: 'Accepteren',
    },
    thankYou: {
      title: 'Bedankt',
      message:
        'Uw bericht is ontvangen. Wij nemen zo spoedig mogelijk contact met u op.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      services: 'Services',
      blog: 'Blog',
      contact: 'Contact',
    },
    form: {
      name: 'Name',
      email: 'Email address',
      phone: 'Phone number',
      message: 'Message',
      companyName: 'Company name',
      serviceType: 'Service type',
      submit: 'Submit',
      submitting: 'Submitting...',
      required: 'This field is required',
      invalidEmail: 'Please enter a valid email address',
      minLength: 'Minimum {n} characters',
      submitError: 'An error occurred. Please try again.',
    },
    serviceType: {
      bedrijfsjuristen: 'Corporate lawyers',
      trust_formation: 'Trust formation',
      belastingadvies: 'Tax advisory',
    },
    blog: {
      readMore: 'Read more',
      publishedOn: 'Published on',
      category: 'Category',
      allCategories: 'All categories',
      noPostsFound: 'No posts found',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      backToHome: 'Back to home',
      cookieConsent:
        'We use cookies to improve your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.',
      acceptCookies: 'Accept',
    },
    thankYou: {
      title: 'Thank you',
      message:
        'Your message has been received. We will get back to you as soon as possible.',
    },
  },
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Extracts locale from URL pathname (e.g. /nl/contact -> 'nl').
 * Returns DEFAULT_LOCALE if not found or invalid.
 */
export function getLocaleFromUrl(url: URL | string): Locale {
  let pathname: string;
  if (typeof url === 'string') {
    const hasAbsoluteUrl = /^[a-z][a-z\d+\-.]*:\/\//i.test(url);
    if (hasAbsoluteUrl) {
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = url;
      }
    } else {
      pathname = url;
    }
  } else {
    pathname = url.pathname;
  }

  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase() ?? '';
  return validateLocale(firstSegment) ? (firstSegment as Locale) : DEFAULT_LOCALE;
}

/**
 * Type guard that checks if string is a valid locale.
 */
export function validateLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Converts path from one locale to another (e.g. /nl/contact -> /en/contact).
 */
export function translatePath(
  path: string,
  fromLocale: Locale,
  toLocale: Locale
): string {
  if (fromLocale === toLocale) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] && validateLocale(segments[0])) {
    segments[0] = toLocale;
    return `/${segments.join('/')}`;
  }
  return `/${toLocale}${normalized}`;
}

/**
 * Retrieves translation string by dot-notation key (e.g. 'form.submit').
 * Supports nested object access. Returns key if translation not found.
 */
export function getTranslation(locale: Locale, key: string): string {
  const t = getTranslations(locale);
  const parts = key.split('.');
  let current: unknown = t;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : key;
}

/**
 * Returns full translation object for locale.
 */
export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

/**
 * Returns array of other available locales (for hreflang links).
 */
export function getAlternateLocales(currentLocale: Locale): Locale[] {
  return SUPPORTED_LOCALES.filter((l) => l !== currentLocale);
}
