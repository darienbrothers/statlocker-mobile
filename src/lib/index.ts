/**
 * Lib Index - Central export for all utility libraries
 */

export {
  logger,
  logError,
  logWarning,
  logInfo,
  logDebug,
  Logger,
  ConsoleLogProvider,
  SentryLogProvider,
  LogLevel,
  type LogProvider,
  type LogEntry,
  type LogContext,
} from './logging';

export {
  analytics,
  trackEvent,
  trackScreen,
  trackTabChange,
  trackCTAPress,
  Analytics,
  ConsoleAnalyticsProvider,
  PostHogAnalyticsProvider,
  FirebaseAnalyticsProvider,
  type AnalyticsProvider,
  type AnalyticsEvent,
  type AnalyticsUser,
} from './analytics';

export {
  PerformanceMonitor,
  performanceMonitor,
  createLazyComponent,
  useStableMemo,
  useStableCallback,
  useDebounce,
  useThrottle,
  getOptimizedImageUri,
  logBundleSize,
  useMemoryMonitor,
  useVirtualizedList,
  measurePerformance,
  measureAsyncPerformance,
  type OptimizedImageProps,
} from './performance';

export {
  AdvancedPerformanceMonitor,
  performanceMonitor as advancedPerformanceMonitor,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  getPerformanceReport,
  recordLayoutShift,
  type PerformanceMetrics,
  type PerformanceBudget,
} from './performanceMonitoring';

export {
  PerformanceTester,
  performanceTester,
  testAnimationPerformance,
  testMemoryLeaks,
  testRenderPerformance,
  type PerformanceTestResult,
  type PerformanceTestConfig,
} from './performanceTesting';

export {
  getContrastRatio,
  meetsContrastRequirement,
  validateTouchTarget,
  ScreenReaderUtils,
  FocusManager,
  DynamicTextSizing,
  AccessibilityTester,
  createAccessibilityProps,
  getAccessibilitySettings,
  CONTRAST_RATIOS,
  TOUCH_TARGET,
  TEXT_SIZES,
  type TextSizeCategory,
} from './accessibility';

export {
  i18n,
  t,
  setLocale,
  getLocale,
  loadTranslations,
  formatNumber,
  formatDate,
  formatRelativeTime,
  isRTL,
  getTextDirection,
  initializeI18n,
  I18nManager,
  type Locale,
  type TranslationValues,
  type PluralOptions,
  type TranslationEntry,
  type Translations,
} from './i18n';

export {
  HapticFeedback,
  haptic,
  HapticType,
} from './haptics';

// Future utilities can be added here
// export { utilityFunction } from './utilities';