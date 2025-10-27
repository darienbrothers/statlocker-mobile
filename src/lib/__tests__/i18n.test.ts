/**
 * i18n System Tests
 */
import { i18n, t, setLocale, getLocale, initializeI18n } from '../i18n';

describe('i18n System', () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  describe('Basic Translation', () => {
    it('should translate basic keys', () => {
      expect(t('app.name')).toBe('StatLocker');
      expect(t('common.save')).toBe('Save');
      expect(t('common.cancel')).toBe('Cancel');
    });

    it('should handle missing keys gracefully', () => {
      expect(t('missing.key')).toBe('missing.key');
    });

    it('should interpolate values', () => {
      expect(t('dashboard.welcome', { name: 'John' })).toBe('Welcome back, John!');
    });
  });

  describe('Pluralization', () => {
    it('should handle plural forms', () => {
      expect(t('stats.goals', { count: 1 }, 1)).toBe('1 goal');
      expect(t('stats.goals', { count: 2 }, 2)).toBe('2 goals');
      expect(t('stats.assists', { count: 0 }, 0)).toBe('0 assists');
    });
  });

  describe('Locale Management', () => {
    it('should get and set locale', () => {
      expect(getLocale()).toBe('en-US');
      
      setLocale('es-ES');
      expect(getLocale()).toBe('es-ES');
      
      // Reset to default
      setLocale('en-US');
      expect(getLocale()).toBe('en-US');
    });
  });

  describe('Error States', () => {
    it('should provide error translations', () => {
      expect(t('error.generic')).toBe('Something went wrong. Please try again.');
      expect(t('error.network')).toBe('Please check your internet connection and try again.');
      expect(t('common.tryAgain')).toBe('Try Again');
    });
  });

  describe('Accessibility', () => {
    it('should provide accessibility translations', () => {
      expect(t('a11y.loading')).toBe('Loading content');
      expect(t('a11y.button')).toBe('Button');
      expect(t('a11y.close')).toBe('Close');
    });
  });

  describe('Offline States', () => {
    it('should provide offline translations', () => {
      expect(t('offline.banner')).toBe('No internet connection');
      expect(t('offline.message')).toBe('You\'re currently offline. Some features may not be available.');
    });
  });
});