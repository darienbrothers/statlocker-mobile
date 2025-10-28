import { View, Text } from 'react-native'
import { useEffect, useRef } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { useOnboardingTheme, useOnboardingAnimation } from './OnboardingThemeProvider'
import { ProgressMilestone, useProgressMilestone } from './animations/ProgressMilestone'

interface ProgressBarProps {
  currentStep: number
  variant?: 'linear' | 'circular'
  accessibilityLabel?: string
  showMotivationalText?: boolean
}

/**
 * Visual progress indicator for onboarding steps
 * 
 * Features:
 * - Linear progress indicator with step completion status
 * - Smooth animations for progress transitions
 * - Accessibility announcements for progress changes
 * - Motivational progress messaging
 * - Step completion visual feedback
 */
export function ProgressBar({
  currentStep,
  variant = 'linear',
  accessibilityLabel,
  showMotivationalText = true
}: ProgressBarProps) {
  const { totalSteps, completedSteps } = useOnboardingStore()
  const { tokens, getProgressStyle } = useOnboardingTheme()
  const { shouldAnimate, getSpringConfig } = useOnboardingAnimation()
  const { checkProgress, shouldTrigger, currentMilestone } = useProgressMilestone()

  // Animation values
  const progressWidth = useSharedValue(0)
  const stepIndicatorScale = useSharedValue(1)

  // Calculate progress
  const progressPercentage = (currentStep / totalSteps) * 100
  const completedCount = completedSteps.size

  // Check for milestones
  useEffect(() => {
    checkProgress(progressPercentage)
  }, [progressPercentage, checkProgress])

  // Motivational messages based on progress
  const getMotivationalMessage = () => {
    const progress = progressPercentage
    if (progress < 25) return "Just getting started — you've got this!"
    if (progress < 50) return "Great progress — keep it up!"
    if (progress < 75) return "You're more than halfway there!"
    if (progress < 90) return "Almost done — finish strong!"
    return "You're ready to enter the Locker!"
  }

  // Animate progress changes
  useEffect(() => {
    if (!shouldAnimate) {
      progressWidth.value = progressPercentage
      return
    }

    const springConfig = getSpringConfig('normal')

    progressWidth.value = withSpring(progressPercentage, {
      damping: springConfig.friction || 15,
      stiffness: springConfig.tension || 150,
      mass: 1,
    })

    // Pulse animation for current step indicator
    stepIndicatorScale.value = withSpring(1.2, {
      damping: 10,
      stiffness: 200,
    }, () => {
      stepIndicatorScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    })
  }, [currentStep, progressPercentage, shouldAnimate, getSpringConfig])

  // Animated styles
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }))

  const stepIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stepIndicatorScale.value }],
  }))

  if (variant === 'linear') {
    return (
      <View
        style={{ width: '100%' }}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel || `Progress: ${completedCount} of ${totalSteps} steps completed`}
        accessibilityValue={{
          min: 0,
          max: totalSteps,
          now: completedCount
        }}
      >
        {/* Progress Track */}
        <View style={{ position: 'relative' }}>
          <ProgressMilestone
            trigger={shouldTrigger}
            progress={progressPercentage}
            onMilestone={(milestone) => {
              console.log(`Milestone reached: ${milestone}%`)
            }}
          />

          <View
            style={{
              height: tokens.spacing.progressBarHeight,
              backgroundColor: tokens.colors.progressBackground,
              borderRadius: tokens.spacing.progressBarHeight / 2,
              overflow: 'hidden',
            }}
          >
            {/* Progress Fill with Animation */}
            <Animated.View
              style={[
                {
                  height: '100%',
                  backgroundColor: tokens.colors.stepAccent,
                  borderRadius: tokens.spacing.progressBarHeight / 2,
                },
                progressBarStyle
              ]}
            />
          </View>

          {/* Completion Glow Effect */}
          {progressPercentage > 95 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: tokens.spacing.progressBarHeight,
                backgroundColor: tokens.colors.stepAccent,
                borderRadius: tokens.spacing.progressBarHeight / 2,
                opacity: 0.3,
              }}
            />
          )}
        </View>

        {/* Step Indicators */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingHorizontal: 4,
          }}
        >
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNum = index + 1
            const isCompleted = completedSteps.has(stepNum)
            const isCurrent = stepNum === currentStep

            return (
              <Animated.View
                key={stepNum}
                style={[
                  {
                    width: tokens.spacing.progressDotSize,
                    height: tokens.spacing.progressDotSize,
                    borderRadius: tokens.spacing.progressDotSize / 2,
                    borderWidth: 2,
                    backgroundColor: isCompleted
                      ? tokens.colors.success
                      : isCurrent
                        ? tokens.colors.stepAccent
                        : tokens.colors.gray[200],
                    borderColor: isCompleted
                      ? tokens.colors.success
                      : isCurrent
                        ? tokens.colors.stepAccent
                        : tokens.colors.gray[400],
                  },
                  isCurrent ? stepIndicatorStyle : undefined
                ]}
                accessibilityLabel={`Step ${stepNum}${isCompleted ? ' completed' : isCurrent ? ' current' : ' pending'}`}
              />
            )
          })}
        </View>

        {/* Progress Text */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text
            style={{
              color: tokens.colors.gray[500],
              fontSize: tokens.typography.formHint.fontSize,
              fontWeight: tokens.typography.formHint.fontWeight,
            }}
          >
            Step {currentStep} of {totalSteps}
          </Text>
          <Text
            style={{
              color: tokens.colors.gray[500],
              fontSize: tokens.typography.formHint.fontSize,
              fontWeight: tokens.typography.formHint.fontWeight,
            }}
          >
            {Math.round(progressPercentage)}% complete
          </Text>
        </View>

        {/* Motivational Message */}
        {showMotivationalText && (
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                color: tokens.colors.stepAccent,
                fontSize: tokens.typography.progressText.fontSize,
                fontWeight: tokens.typography.progressText.fontWeight,
                textAlign: 'center',
              }}
              accessibilityLiveRegion="polite"
            >
              {getMotivationalMessage()}
            </Text>
          </View>
        )}
      </View>
    )
  }

  // Circular variant for future use
  return null
}