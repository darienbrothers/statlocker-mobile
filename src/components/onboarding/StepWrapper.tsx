import { ReactNode, useEffect, useRef } from 'react'
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native'
import { ProgressBar } from './ProgressBar'
import { NavigationBar } from './NavigationBar'
import { ErrorBoundary } from '../ErrorBoundary'
import { useOnboardingTheme, useOnboardingResponsive } from './OnboardingThemeProvider'

interface StepWrapperProps {
  stepNumber: number
  title: string
  subtitle?: string
  children: ReactNode
  onNext?: () => void
  onBack?: () => void
  nextDisabled?: boolean
  showProgress?: boolean
  isLoading?: boolean
  error?: string | null
}

/**
 * Consistent wrapper for all onboarding steps
 * Provides layout, progress indication, navigation, and accessibility
 * 
 * Features:
 * - Responsive step container with proper spacing
 * - Progress indication and step numbering
 * - Accessibility labels and focus management
 * - Loading states and error boundaries
 * - Consistent theming and layout
 */
export function StepWrapper({
  stepNumber,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextDisabled = false,
  showProgress = true,
  isLoading = false,
  error = null
}: StepWrapperProps) {
  const { tokens, getStepColors } = useOnboardingTheme()
  const { responsiveSpacing, isSmallScreen } = useOnboardingResponsive()
  const contentRef = useRef<View>(null)
  
  // Get step-specific colors
  const stepColors = getStepColors(stepNumber, false)
  
  // Focus management for accessibility
  useEffect(() => {
    // Announce step change to screen readers
    if (contentRef.current) {
      contentRef.current.setNativeProps({
        accessibilityLiveRegion: 'polite',
        accessibilityLabel: `Step ${stepNumber}: ${title}${subtitle ? `. ${subtitle}` : ''}`
      })
    }
  }, [stepNumber, title, subtitle])

  // Responsive spacing
  const horizontalPadding = responsiveSpacing(tokens.spacing.stepPadding)
  const verticalSpacing = responsiveSpacing(tokens.spacing.stepMargin)

  return (
    <ErrorBoundary>
      <SafeAreaView 
        style={{ 
          flex: 1, 
          backgroundColor: stepColors.background 
        }}
        accessibilityRole="main"
        accessibilityLabel={`Onboarding step ${stepNumber}`}
      >
        <View 
          style={{ 
            flex: 1, 
            paddingHorizontal: horizontalPadding 
          }}
        >
          {/* Progress Bar */}
          {showProgress && (
            <View 
              style={{ 
                marginTop: responsiveSpacing(16),
                marginBottom: responsiveSpacing(24) 
              }}
            >
              <ProgressBar 
                currentStep={stepNumber}
                accessibilityLabel={`Progress: Step ${stepNumber} of onboarding`}
              />
            </View>
          )}

          {/* Step Header */}
          <View style={{ marginBottom: responsiveSpacing(32) }}>
            {/* Step Number Indicator */}
            <View 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: responsiveSpacing(12) 
              }}
            >
              <View 
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: stepColors.primary,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text 
                  style={{
                    color: tokens.colors.white,
                    fontSize: tokens.typography.formLabel.fontSize,
                    fontWeight: tokens.typography.formLabel.fontWeight,
                  }}
                >
                  {stepNumber}
                </Text>
              </View>
              <Text 
                style={{
                  color: tokens.colors.gray[500],
                  fontSize: tokens.typography.progressText.fontSize,
                  fontWeight: tokens.typography.progressText.fontWeight,
                }}
                accessibilityLabel={`Step ${stepNumber}`}
              >
                Step {stepNumber}
              </Text>
            </View>

            {/* Title */}
            <Text 
              style={{
                color: stepColors.text,
                fontSize: tokens.typography.stepTitle.fontSize,
                fontWeight: tokens.typography.stepTitle.fontWeight,
                lineHeight: tokens.typography.stepTitle.lineHeight,
                letterSpacing: tokens.typography.stepTitle.letterSpacing,
                marginBottom: responsiveSpacing(8),
              }}
              accessibilityRole="header"
              accessibilityLevel={1}
            >
              {title}
            </Text>

            {/* Subtitle */}
            {subtitle && (
              <Text 
                style={{
                  color: tokens.colors.gray[500],
                  fontSize: tokens.typography.stepSubtitle.fontSize,
                  fontWeight: tokens.typography.stepSubtitle.fontWeight,
                  lineHeight: tokens.typography.stepSubtitle.lineHeight,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Error State */}
          {error && (
            <View 
              style={{
                marginBottom: responsiveSpacing(24),
                padding: responsiveSpacing(16),
                backgroundColor: `${tokens.colors.danger}20`,
                borderColor: tokens.colors.danger,
                borderWidth: 1,
                borderRadius: tokens.spacing.cardRadius,
              }}
            >
              <Text 
                style={{
                  color: tokens.colors.danger,
                  fontSize: tokens.typography.formHint.fontSize,
                  fontWeight: tokens.typography.formHint.fontWeight,
                }}
                accessibilityRole="alert"
              >
                {error}
              </Text>
            </View>
          )}

          {/* Loading State */}
          {isLoading ? (
            <View 
              style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <ActivityIndicator 
                size="large" 
                color={stepColors.primary} 
              />
              <Text 
                style={{
                  color: tokens.colors.gray[500],
                  fontSize: tokens.typography.body.fontSize,
                  marginTop: responsiveSpacing(16),
                }}
                accessibilityLabel="Loading step content"
              >
                Loading...
              </Text>
            </View>
          ) : (
            /* Step Content */
            <View 
              ref={contentRef}
              style={{ flex: 1 }}
              accessibilityRole="region"
              accessibilityLabel={`${title} content`}
            >
              {children}
            </View>
          )}

          {/* Navigation */}
          {!isLoading && (
            <View style={{ paddingVertical: verticalSpacing }}>
              <NavigationBar
                onNext={onNext}
                onBack={onBack}
                nextDisabled={nextDisabled}
                showBack={stepNumber > 1}
                stepNumber={stepNumber}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  )
}