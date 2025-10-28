/**
 * StatLocker UI Components
 *
 * Core layout and UI components for the StatLocker mobile app.
 */

// Layout Components
export { Screen, type ScreenProps } from './Screen';
export { StickyCTA, type StickyCTAProps } from './StickyCTA';
export { ErrorBoundary } from './ErrorBoundary';
export { OfflineBanner, type OfflineBannerProps } from './OfflineBanner';
export { NetworkProvider } from './NetworkProvider';
export { AnalyticsProvider } from './AnalyticsProvider';
export { PerformanceProvider } from './PerformanceProvider';
export { OptimizedImage, type OptimizedImageProps } from './OptimizedImage';
export { OptimizedFlatList, type OptimizedFlatListProps } from './OptimizedFlatList';
export { AccessibilityProvider, useAccessibilityContext } from './AccessibilityProvider';
export { AccessibleText, type AccessibleTextProps } from './AccessibleText';
export { AccessibleButton, type AccessibleButtonProps } from './AccessibleButton';

// UI Kit Components
export { Button, type ButtonProps, type ButtonVariant } from './Button';
export { Card, type CardProps } from './Card';
export { StatCard, type StatCardProps, type DeltaType } from './StatCard';
export { Tag, type TagProps, type TagVariant } from './Tag';
export { Progress, type ProgressProps, type ProgressVariant } from './Progress';
export { Divider, type DividerProps } from './Divider';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Skeleton, type SkeletonProps, SkeletonCard, SkeletonStatCard } from './Skeleton';

// Icon Components
export { Icon, type IconName, type IconSize, type IconColor } from './Icon';
export { TabIcon, type TabIconName } from './TabIcon';

// Authentication Components
export * from './auth';

// Re-export as default exports for convenience
export { default as ScreenComponent } from './Screen';
export { default as StickyCTAComponent } from './StickyCTA';
export { default as ButtonComponent } from './Button';
export { default as CardComponent } from './Card';
export { default as StatCardComponent } from './StatCard';
export { default as TagComponent } from './Tag';
export { default as ProgressComponent } from './Progress';
export { default as DividerComponent } from './Divider';
export { default as EmptyStateComponent } from './EmptyState';
export { default as SkeletonComponent } from './Skeleton';
export { default as IconComponent } from './Icon';
export { default as TabIconComponent } from './TabIcon';
