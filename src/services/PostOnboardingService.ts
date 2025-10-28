/**
 * Post-Onboarding Service
 * 
 * Handles the transition from onboarding completion to main application,
 * including welcome screen, trial confirmation, analytics, and celebration
 */

import { router } from 'expo-router'
import { OnboardingProfile } from '../types/onboarding'
import { enhancedProfileService } from './EnhancedProfileService'
import { trialManagementService } from './TrialManagementService'
import { Alert } from 'react-native'
import * as Haptics from 'expo-haptics'

export interface OnboardingCompletionData {
  profile: OnboardingProfile
  userId: string
  email: string
  completionTimestamp: Date
  totalDuration: number
  stepCount: number
}

export interface PostOnboardingResult {
  success: boolean
  profileCreated: boolean
  trialActivated: boolean
  redirectPath: string
  error?: {
    message: string
    code?: string
    retryable: boolean
  }
}

export interface WelcomeScreenData {
  userName: string
  trialActive: boolean
  trialDaysRemaining: number
  trialEndDate?: Date
  personaType?: string
  selectedGoals: string[]
  celebrationMessage: string
}

export class PostOnboardingService {
  private static instance: PostOnboardingService

  private constructor() {}

  static getInstance(): PostOnboardingService {
    if (!PostOnboardingService.instance) {
      PostOnboardingService.instance = new PostOnboardingService()
    }
    return PostOnboardingService.instance
  }

  /**
   * Complete onboarding process and transition to main app
   */
  async completeOnboarding(
    completionData: OnboardingCompletionData
  ): Promise<PostOnboardingResult> {
    const { profile, userId, email, completionTimestamp, totalDuration, stepCount } = completionData

    try {
      console.log('Starting onboarding completion process for user:', userId)

      // Step 1: Create profile and activate trial
      const profileResult = await enhancedProfileService.createProfileWithTrial(
        profile,
        userId,
        email,
        {
          enableOfflineQueue: true,
          showUserNotifications: false, // We'll handle notifications ourselves
          trialDurationDays: 7
        }
      )

      if (!profileResult.success) {
        console.error('Profile creation failed:', profileResult.error)
        
        return {
          success: false,
          profileCreated: false,
          trialActivated: false,
          redirectPath: '/onboarding/account-creation',
          error: {
            message: 'Failed to create your account. Please try again.',
            code: profileResult.error?.source,
            retryable: true
          }
        }
      }

      // Step 2: Log analytics events
      await this.logCompletionAnalytics({
        userId,
        profile,
        totalDuration,
        stepCount,
        completionTimestamp,
        profileCreated: true,
        trialActivated: !profileResult.wasOffline
      })

      // Step 3: Trigger celebration
      await this.triggerCelebration(profile)

      // Step 4: Determine redirect path
      const redirectPath = this.getRedirectPath(profile, profileResult.wasOffline)

      console.log('Onboarding completion successful, redirecting to:', redirectPath)

      return {
        success: true,
        profileCreated: true,
        trialActivated: !profileResult.wasOffline,
        redirectPath
      }

    } catch (error) {
      console.error('Onboarding completion failed with unexpected error:', error)
      
      return {
        success: false,
        profileCreated: false,
        trialActivated: false,
        redirectPath: '/onboarding/account-creation',
        error: {
          message: 'An unexpected error occurred. Please try again.',
          retryable: true
        }
      }
    }
  }

  /**
   * Get welcome screen data for the user
   */
  async getWelcomeScreenData(userId: string): Promise<WelcomeScreenData> {
    try {
      // Get user profile
      const profileResult = await enhancedProfileService.getProfile(userId)
      
      if (!profileResult.success || !profileResult.data) {
        throw new Error('Failed to load user profile')
      }

      const profile = profileResult.data

      // Get trial status
      const trialStatus = await trialManagementService.getTrialStatus(userId)

      // Generate celebration message
      const celebrationMessage = this.generateCelebrationMessage(profile, trialStatus.isActive)

      return {
        userName: this.extractUserName(profile.email),
        trialActive: trialStatus.isActive,
        trialDaysRemaining: trialStatus.daysRemaining,
        trialEndDate: trialStatus.endDate,
        personaType: profile.aiPersonalization?.personaType,
        selectedGoals: profile.goals?.map(goal => goal.title) || [],
        celebrationMessage
      }

    } catch (error) {
      console.error('Failed to get welcome screen data:', error)
      
      // Return safe defaults
      return {
        userName: 'Athlete',
        trialActive: false,
        trialDaysRemaining: 0,
        selectedGoals: [],
        celebrationMessage: 'Welcome to StatLocker! Let\'s start tracking your progress.'
      }
    }
  }

  /**
   * Navigate to main application with welcome parameters
   */
  async navigateToMainApp(
    welcomeData: WelcomeScreenData,
    showWelcomeScreen = true
  ): Promise<void> {
    try {
      if (showWelcomeScreen) {
        // Navigate to welcome screen first
        router.replace({
          pathname: '/welcome',
          params: {
            trial_active: welcomeData.trialActive.toString(),
            trial_days: welcomeData.trialDaysRemaining.toString(),
            persona_type: welcomeData.personaType || '',
            celebration_message: welcomeData.celebrationMessage
          }
        })
      } else {
        // Navigate directly to dashboard
        router.replace({
          pathname: '/(tabs)/dashboard',
          params: {
            onboarding_completed: 'true',
            trial_active: welcomeData.trialActive.toString()
          }
        })
      }
    } catch (error) {
      console.error('Failed to navigate to main app:', error)
      // Fallback navigation
      router.replace('/(tabs)/dashboard')
    }
  }

  /**
   * Show trial confirmation banner/modal
   */
  async showTrialConfirmation(trialDaysRemaining: number): Promise<void> {
    const message = trialDaysRemaining > 0
      ? `Your 7-day trial is live! ${trialDaysRemaining} days remaining to explore all features.`
      : 'Welcome to StatLocker! Start logging games to unlock AI insights.'

    Alert.alert(
      'Trial Activated! 🎉',
      message,
      [
        {
          text: 'Let\'s Go!',
          style: 'default',
          onPress: () => {
            // Trigger haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          }
        }
      ]
    )
  }

  /**
   * Log analytics events for onboarding completion
   */
  private async logCompletionAnalytics(data: {
    userId: string
    profile: OnboardingProfile
    totalDuration: number
    stepCount: number
    completionTimestamp: Date
    profileCreated: boolean
    trialActivated: boolean
  }): Promise<void> {
    try {
      // In a real implementation, you would send these to your analytics service
      const analyticsEvents = [
        {
          event: 'onboarding_completed',
          properties: {
            user_id: data.userId,
            total_duration_seconds: data.totalDuration,
            step_count: data.stepCount,
            completion_timestamp: data.completionTimestamp.toISOString(),
            role: data.profile.role,
            sport: data.profile.sport,
            position: data.profile.position,
            graduation_year: data.profile.graduationYear,
            selected_goals_count: data.profile.selectedGoals?.length || 0,
            ai_tone: data.profile.aiTone,
            persona_type: data.profile.aiPersonalization?.personaType,
            profile_created: data.profileCreated,
            trial_activated: data.trialActivated
          }
        },
        {
          event: 'trial_started',
          properties: {
            user_id: data.userId,
            activation_timestamp: data.completionTimestamp.toISOString(),
            activation_source: 'onboarding_completion',
            trial_duration_days: 7,
            success: data.trialActivated
          }
        },
        {
          event: 'user_profile_created',
          properties: {
            user_id: data.userId,
            creation_timestamp: data.completionTimestamp.toISOString(),
            profile_version: '1.0',
            onboarding_source: 'mobile_app'
          }
        }
      ]

      // Log each event
      for (const analyticsEvent of analyticsEvents) {
        console.log('Analytics Event:', analyticsEvent.event, analyticsEvent.properties)
        // TODO: Send to actual analytics service (PostHog, Amplitude, etc.)
      }

    } catch (error) {
      console.error('Failed to log completion analytics:', error)
      // Don't fail the whole process for analytics errors
    }
  }

  /**
   * Trigger celebration effects (haptics, animations, etc.)
   */
  private async triggerCelebration(profile: OnboardingProfile): Promise<void> {
    try {
      // Haptic feedback for completion
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      
      // Additional celebration based on persona type
      if (profile.aiPersonalization?.personaType === 'Competitor') {
        // Extra strong haptic for competitive personalities
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        }, 200)
      }

      console.log('Celebration triggered for onboarding completion')
    } catch (error) {
      console.warn('Failed to trigger celebration effects:', error)
      // Non-critical, don't fail the process
    }
  }

  /**
   * Determine the appropriate redirect path after onboarding
   */
  private getRedirectPath(profile: OnboardingProfile, wasOffline: boolean): string {
    // If offline, show a different welcome screen
    if (wasOffline) {
      return '/welcome?offline=true'
    }

    // For athletes, go to main dashboard
    if (profile.role === 'athlete') {
      return '/welcome?role=athlete'
    }

    // For coaches, might have different onboarding flow in the future
    if (profile.role === 'coach') {
      return '/welcome?role=coach'
    }

    // Default fallback
    return '/welcome'
  }

  /**
   * Extract user name from email for personalization
   */
  private extractUserName(email: string): string {
    try {
      const localPart = email.split('@')[0]
      // Capitalize first letter and remove numbers/special chars for display
      const cleanName = localPart.replace(/[^a-zA-Z]/g, '')
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
    } catch (error) {
      return 'Athlete'
    }
  }

  /**
   * Generate personalized celebration message
   */
  private generateCelebrationMessage(profile: any, trialActive: boolean): string {
    const personaType = profile.aiPersonalization?.personaType
    const aiTone = profile.aiTone
    const goalCount = profile.goals?.length || 0

    // Base message
    let message = 'Welcome to StatLocker!'

    // Personalize based on AI tone preference
    switch (aiTone) {
      case 'hype':
        message = trialActive 
          ? `🔥 LET'S GO! Your trial is LIVE and your ${goalCount} goals are waiting!`
          : `🔥 WELCOME TO THE LOCKER! Time to dominate those ${goalCount} goals!`
        break
      
      case 'mentor':
        message = trialActive
          ? `Welcome to your journey! Your 7-day trial gives you full access to track your ${goalCount} goals and get personalized insights.`
          : `Welcome! You've set ${goalCount} meaningful goals. Let's work together to achieve them.`
        break
      
      case 'analyst':
        message = trialActive
          ? `Setup complete. Trial activated. ${goalCount} performance goals configured for tracking and analysis.`
          : `Profile configured successfully. ${goalCount} goals established for performance tracking.`
        break
      
      case 'captain':
        message = trialActive
          ? `Outstanding work completing setup! Your trial is active and those ${goalCount} goals aren't going to achieve themselves. Let's get to work!`
          : `Solid work on setup! You've got ${goalCount} goals locked in. Time to put in the work and make it happen!`
        break
      
      default:
        message = trialActive
          ? `Your StatLocker is ready! 7-day trial active with ${goalCount} goals to track.`
          : `Welcome to StatLocker! Ready to track your ${goalCount} goals.`
    }

    return message
  }

  /**
   * Handle onboarding completion errors with user-friendly messages
   */
  async handleCompletionError(
    error: PostOnboardingResult['error'],
    retryCallback?: () => Promise<void>
  ): Promise<void> {
    if (!error) return

    const title = 'Setup Almost Complete'
    const message = error.retryable
      ? `${error.message}\n\nWould you like to try again?`
      : error.message

    if (error.retryable && retryCallback) {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Try Again',
            style: 'default',
            onPress: retryCallback
          },
          {
            text: 'Continue Anyway',
            style: 'cancel',
            onPress: () => {
              // Navigate to main app even with errors
              router.replace('/(tabs)/dashboard?setup_incomplete=true')
            }
          }
        ]
      )
    } else {
      Alert.alert(title, message, [{ text: 'OK' }])
    }
  }

  /**
   * Check if onboarding completion is in progress
   */
  private completionInProgress = false

  async isCompletionInProgress(): Promise<boolean> {
    return this.completionInProgress
  }

  /**
   * Set completion progress state
   */
  setCompletionInProgress(inProgress: boolean): void {
    this.completionInProgress = inProgress
  }
}

// Export singleton instance
export const postOnboardingService = PostOnboardingService.getInstance()