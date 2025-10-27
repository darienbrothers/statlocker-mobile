/**
 * Internationalization (i18n) System - Lightweight localization support
 * 
 * Features:
 * - Lightweight i18n helper for centralized copy management
 * - en-US locale support for MVP
 * - Extensible system for future locale additions
 * - Text formatting and pluralization support
 * - Context-aware translations
 */

export type Locale = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'pt-BR';

export interface TranslationValues {
  [key: string]: string | number | boolean;
}

export interface PluralOptions {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export interface TranslationEntry {
  message: string;
  description?: string;
  context?: string;
  plural?: PluralOptions;
}

export type TranslationKey = string;
export type Translations = Record<TranslationKey, TranslationEntry | string>;

// Default locale
const DEFAULT_LOCALE: Locale = 'en-US';

// Current locale state
let currentLocale: Locale = DEFAULT_LOCALE;

// Translation storage
const translationStore: Record<Locale, Translations> = {
  'en-US': {},
  'es-ES': {},
  'fr-FR': {},
  'de-DE': {},
  'pt-BR': {},
};

/**
 * I18n Manager Class
 */
export class I18nManager {
  private static instance: I18nManager;
  private locale: Locale = DEFAULT_LOCALE;
  private fallbackLocale: Locale = 'en-US';
  private translations: Record<Locale, Translations> = translationStore;

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * Set the current locale
   */
  setLocale(locale: Locale): void {
    this.locale = locale;
    currentLocale = locale;
  }

  /**
   * Get the current locale
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * Set fallback locale
   */
  setFallbackLocale(locale: Locale): void {
    this.fallbackLocale = locale;
  }

  /**
   * Load translations for a locale
   */
  loadTranslations(locale: Locale, translations: Translations): void {
    this.translations[locale] = {
      ...this.translations[locale],
      ...translations,
    };
  }

  /**
   * Get translation for a key
   */
  translate(
    key: TranslationKey,
    values?: TranslationValues,
    count?: number
  ): string {
    const translation = this.getTranslation(key, this.locale) || 
                       this.getTranslation(key, this.fallbackLocale);

    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key; // Return key as fallback
    }

    let message: string;

    if (typeof translation === 'string') {
      message = translation;
    } else {
      // Handle pluralization
      if (count !== undefined && translation.plural) {
        message = this.getPluralForm(translation.plural, count, this.locale);
      } else {
        message = translation.message;
      }
    }

    // Interpolate values
    return this.interpolate(message, values);
  }

  /**
   * Get raw translation entry
   */
  private getTranslation(key: TranslationKey, locale: Locale): TranslationEntry | string | undefined {
    return this.translations[locale]?.[key];
  }

  /**
   * Get appropriate plural form
   */
  private getPluralForm(plural: PluralOptions, count: number, locale: Locale): string {
    const rules = this.getPluralRules(locale);
    const category = rules.select(count);

    return plural[category as keyof PluralOptions] || plural.other;
  }

  /**
   * Get plural rules for locale
   */
  private getPluralRules(locale: Locale): Intl.PluralRules {
    try {
      return new Intl.PluralRules(locale);
    } catch (error) {
      console.warn(`Plural rules not available for locale: ${locale}`);
      return new Intl.PluralRules('en-US');
    }
  }

  /**
   * Interpolate values into message
   */
  private interpolate(message: string, values?: TranslationValues): string {
    if (!values) return message;

    return message.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = values[key];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Format number according to locale
   */
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.locale, options).format(number);
    } catch (error) {
      console.warn(`Number formatting failed for locale: ${this.locale}`);
      return String(number);
    }
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.locale, options).format(date);
    } catch (error) {
      console.warn(`Date formatting failed for locale: ${this.locale}`);
      return date.toLocaleDateString();
    }
  }

  /**
   * Format relative time
   */
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    try {
      return new Intl.RelativeTimeFormat(this.locale).format(value, unit);
    } catch (error) {
      console.warn(`Relative time formatting failed for locale: ${this.locale}`);
      return `${value} ${unit}`;
    }
  }

  /**
   * Check if locale is RTL
   */
  isRTL(): boolean {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    return rtlLocales.some(rtl => this.locale.startsWith(rtl));
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): Locale[] {
    return Object.keys(this.translations) as Locale[];
  }

  /**
   * Check if translations exist for locale
   */
  hasTranslations(locale: Locale): boolean {
    return Object.keys(this.translations[locale] || {}).length > 0;
  }
}

// Global i18n instance
export const i18n = I18nManager.getInstance();

// Convenience functions
export const t = (
  key: TranslationKey,
  values?: TranslationValues,
  count?: number
): string => {
  return i18n.translate(key, values, count);
};

export const setLocale = (locale: Locale): void => {
  i18n.setLocale(locale);
};

export const getLocale = (): Locale => {
  return i18n.getLocale();
};

export const loadTranslations = (locale: Locale, translations: Translations): void => {
  i18n.loadTranslations(locale, translations);
};

export const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
  return i18n.formatNumber(number, options);
};

export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return i18n.formatDate(date, options);
};

export const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit): string => {
  return i18n.formatRelativeTime(value, unit);
};

// Text direction utilities
export const isRTL = (): boolean => {
  return i18n.isRTL();
};

export const getTextDirection = (): 'ltr' | 'rtl' => {
  return i18n.isRTL() ? 'rtl' : 'ltr';
};

// Initialize i18n with default translations
export const initializeI18n = async (): Promise<void> => {
  try {
    // Load en-US translations
    const { enUSTranslations } = await import('./translations/en-US');
    i18n.loadTranslations('en-US', enUSTranslations);
    
    // Set default locale
    i18n.setLocale('en-US');
    
    console.log('i18n initialized successfully');
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }
};