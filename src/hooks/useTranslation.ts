/**
 * useTranslation Hook - React integration for i18n
 * 
 * Features:
 * - Translation function with interpolation
 * - Pluralization support
 * - Locale management
 * - Number and date formatting
 * - RTL support detection
 */
import { useCallback, useEffect, useState } from 'react';
import { 
  i18n, 
  t as translate,
  setLocale as setI18nLocale,
  getLocale,
  formatNumber,
  formatDate,
  formatRelativeTime,
  isRTL,
  getTextDirection,
  type Locale,
  type TranslationValues,
} from '@/lib/i18n';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());
  const [isRTLLayout, setIsRTLLayout] = useState(isRTL());

  // Translation function
  const t = useCallback((
    key: string,
    values?: TranslationValues,
    count?: number
  ): string => {
    return translate(key, values, count);
  }, []);

  // Locale management
  const setLocale = useCallback((newLocale: Locale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
    setIsRTLLayout(i18n.isRTL());
  }, []);

  // Number formatting
  const formatNum = useCallback((
    number: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return formatNumber(number, options);
  }, []);

  // Date formatting
  const formatDateTime = useCallback((
    date: Date,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    return formatDate(date, options);
  }, []);

  // Relative time formatting
  const formatRelTime = useCallback((
    value: number,
    unit: Intl.RelativeTimeFormatUnit
  ): string => {
    return formatRelativeTime(value, unit);
  }, []);

  // Currency formatting
  const formatCurrency = useCallback((
    amount: number,
    currency = 'USD'
  ): string => {
    return formatNum(amount, {
      style: 'currency',
      currency,
    });
  }, [formatNum]);

  // Percentage formatting
  const formatPercentage = useCallback((
    value: number,
    decimals = 1
  ): string => {
    return formatNum(value, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [formatNum]);

  // Pluralization helper
  const plural = useCallback((
    key: string,
    count: number,
    values?: TranslationValues
  ): string => {
    return t(key, { count, ...values }, count);
  }, [t]);

  return {
    // Core functions
    t,
    plural,
    
    // Locale management
    locale,
    setLocale,
    isRTL: isRTLLayout,
    textDirection: getTextDirection(),
    
    // Formatting
    formatNumber: formatNum,
    formatDate: formatDateTime,
    formatRelativeTime: formatRelTime,
    formatCurrency,
    formatPercentage,
    
    // Utilities
    hasTranslations: (locale: Locale) => i18n.hasTranslations(locale),
    getAvailableLocales: () => i18n.getAvailableLocales(),
  };
}

export default useTranslation;