import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { 
  OnboardingStore, 
  OnboardingProfile, 
  ValidationErrors,
  OnboardingAnalyticsEvents,
  ProgressSnapshot
} from '../types/onboarding'
import { 
  derivePersona, 
  initializeAIPersonalization,
  validateDNACompleteness,
  type PersonaMapping,
  type AIPersonalizationProfile
} from '../lib/onboarding/personaDerivation'

const TOTAL_STEPS = 11 // Based on the design document
const STORAGE_KEY = 'onboarding-progress'
const STORAGE_VERSION = '1.0.0'

/**
 * Zustand store for onboarding state management
 * Handles step navigation, data persistence, and validation
 */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      totalSteps: TOTAL_STEPS,
      isLoading: false,
      hasExistingProgress: false,
      
      // User data
      profile: {},
      
      // Progress tracking
      completedSteps: new Set<number>(),
      validationErrors: {},
      
      // Persistence
      lastSaved: undefined,
      syncStatus: 'idle',

      // Navigation actions
      setStep: (step: number) => {
        const { totalSteps } = get()
        if (step >= 1 && step <= totalSteps) {
          set({ currentStep: step })
        }
      },

      navigateNext: () => {
        const { currentStep, totalSteps, validateStep, completedSteps } = get()
        
        // Validate current step before proceeding
        if (validateStep(currentStep)) {
          const newCompletedSteps = new Set(completedSteps)
          newCompletedSteps.add(currentStep)
          
          const nextStep = Math.min(currentStep + 1, totalSteps)
          
          set({ 
            currentStep: nextStep,
            completedSteps: newCompletedSteps
          })
          
          // Auto-save progress
          get().saveProgress()
          
          // Track analytics
          get().trackEvent('step_completed', {
            step: currentStep,
            duration: 0, // Will be calculated by analytics service
            attempts: 1,
            validationErrors: []
          })
        }
      },

      navigateBack: () => {
        const { currentStep } = get()
        const prevStep = Math.max(currentStep - 1, 1)
        set({ currentStep: prevStep })
      },

      canNavigateToStep: (step: number) => {
        const { completedSteps, currentStep } = get()
        
        // Can always go to step 1
        if (step === 1) return true
        
        // Can go to current step
        if (step === currentStep) return true
        
        // Can go to any completed step
        if (completedSteps.has(step)) return true
        
        // Can go to next step if current step is completed
        if (step === currentStep + 1 && completedSteps.has(currentStep)) {
          return true
        }
        
        return false
      },

      // Data management actions
      updateProfile: (data: Partial<OnboardingProfile>) => {
        const { profile } = get()
        const updatedProfile = { ...profile, ...data }
        
        set({ 
          profile: updatedProfile,
          lastSaved: new Date()
        })
        
        // Auto-derive persona when DNA is completed
        if (data.dna && validateDNACompleteness(data.dna)) {
          setTimeout(() => {
            get().derivePersonaFromDNA()
          }, 100)
        }
        
        // Auto-initialize AI profile when both DNA and tone are set
        if (updatedProfile.dna && updatedProfile.aiTone && 
            validateDNACompleteness(updatedProfile.dna)) {
          setTimeout(() => {
            get().initializeAIProfile()
          }, 200)
        }
        
        // Auto-save after updates
        setTimeout(() => get().saveProgress(), 1000)
      },

      resetProfile: () => {
        set({ 
          profile: {},
          currentStep: 1,
          completedSteps: new Set(),
          validationErrors: {},
          hasExistingProgress: false
        })
      },

      // Validation actions
      validateStep: (step: number) => {
        const { profile } = get()
        const errors = validateStepData(step, profile)
        
        if (errors.length > 0) {
          get().setValidationErrors(step, errors)
          return false
        } else {
          get().clearValidationErrors(step)
          return true
        }
      },

      setValidationErrors: (step: number, errors: string[]) => {
        const { validationErrors } = get()
        set({
          validationErrors: {
            ...validationErrors,
            [step]: errors
          }
        })
      },

      clearValidationErrors: (step: number) => {
        const { validationErrors } = get()
        const newErrors = { ...validationErrors }
        delete newErrors[step]
        set({ validationErrors: newErrors })
      },

      // Persistence actions
      saveProgress: async () => {
        const state = get()
        
        set({ syncStatus: 'saving' })
        
        try {
          const snapshot: ProgressSnapshot = {
            profile: state.profile,
            currentStep: state.currentStep,
            completedSteps: Array.from(state.completedSteps),
            timestamp: new Date(),
            version: STORAGE_VERSION
          }
          
          await AsyncStorage.setItem(
            `${STORAGE_KEY}-backup`, 
            JSON.stringify(snapshot)
          )
          
          set({ 
            syncStatus: 'idle',
            lastSaved: new Date()
          })
          
        } catch (error) {
          console.error('Failed to save onboarding progress:', error)
          set({ syncStatus: 'error' })
        }
      },

      loadProgress: async () => {
        set({ isLoading: true })
        
        try {
          const savedData = await AsyncStorage.getItem(`${STORAGE_KEY}-backup`)
          
          if (savedData) {
            const snapshot: ProgressSnapshot = JSON.parse(savedData)
            
            // Validate version compatibility
            if (snapshot.version === STORAGE_VERSION) {
              set({
                profile: snapshot.profile,
                currentStep: snapshot.currentStep,
                completedSteps: new Set(snapshot.completedSteps),
                hasExistingProgress: true,
                isLoading: false
              })
              
              get().trackEvent('onboarding_resumed', {
                lastCompletedStep: Math.max(...snapshot.completedSteps, 0),
                daysSinceStart: Math.floor(
                  (Date.now() - snapshot.timestamp.getTime()) / (1000 * 60 * 60 * 24)
                ),
                resumeMethod: 'automatic'
              })
            } else {
              // Version mismatch - reset progress
              get().resetOnboarding()
            }
          } else {
            set({ 
              isLoading: false,
              hasExistingProgress: false 
            })
          }
        } catch (error) {
          console.error('Failed to load onboarding progress:', error)
          set({ 
            isLoading: false,
            hasExistingProgress: false 
          })
        }
      },

      resetOnboarding: () => {
        const { completedSteps } = get()
        
        // Track reset event
        get().trackEvent('onboarding_reset', {
          completedSteps: completedSteps.size,
          reason: 'user_initiated'
        })
        
        // Clear all state
        set({
          currentStep: 1,
          profile: {},
          completedSteps: new Set(),
          validationErrors: {},
          hasExistingProgress: false,
          lastSaved: undefined,
          syncStatus: 'idle'
        })
        
        // Clear storage
        AsyncStorage.removeItem(`${STORAGE_KEY}-backup`)
      },

      // Analytics action
      trackEvent: <K extends keyof OnboardingAnalyticsEvents>(
        event: K,
        data: OnboardingAnalyticsEvents[K]
      ) => {
        try {
          // Import analytics service dynamically to avoid circular dependencies
          import('@/services/OnboardingAnalyticsService').then(({ onboardingAnalytics }) => {
            // Map events to analytics service methods
            switch (event) {
              case 'step_completed':
                const stepData = data as OnboardingAnalyticsEvents['step_completed'];
                onboardingAnalytics.trackStepCompleted(
                  stepData.step, 
                  stepData.attempts, 
                  stepData.validationErrors
                );
                break;
              
              case 'step_abandoned':
                const abandonData = data as OnboardingAnalyticsEvents['step_abandoned'];
                onboardingAnalytics.trackStepAbandoned(abandonData.step, abandonData.reason);
                break;
              
              case 'onboarding_resumed':
                const resumeData = data as OnboardingAnalyticsEvents['onboarding_resumed'];
                onboardingAnalytics.trackOnboardingResumed(
                  resumeData.lastCompletedStep,
                  resumeData.daysSinceStart,
                  resumeData.resumeMethod
                );
                break;
              
              case 'onboarding_reset':
                const resetData = data as OnboardingAnalyticsEvents['onboarding_reset'];
                onboardingAnalytics.trackOnboardingReset(
                  resetData.completedSteps,
                  resetData.reason
                );
                break;
              
              case 'persona_derived':
                const personaData = data as OnboardingAnalyticsEvents['persona_derived'];
                onboardingAnalytics.trackPersonaDerived(
                  personaData.personaType,
                  personaData.dnaResponses,
                  personaData.recommendedTone
                );
                break;
              
              default:
                // For other events, log to console for debugging
                console.log('Onboarding Analytics Event:', event, data);
            }
          }).catch((error) => {
            console.error('Failed to load analytics service:', error);
            console.log('Onboarding Analytics Event (fallback):', event, data);
          });
        } catch (error) {
          console.error('Analytics tracking error:', error);
          console.log('Onboarding Analytics Event (fallback):', event, data);
        }
      },

      // Persona derivation actions
      derivePersonaFromDNA: () => {
        const { profile } = get()
        
        if (profile.dna && validateDNACompleteness(profile.dna)) {
          const personaMapping = derivePersona(profile.dna)
          
          // Track persona derivation
          get().trackEvent('persona_derived', {
            personaType: personaMapping.personaType,
            dnaResponses: profile.dna as Record<string, string>,
            recommendedTone: personaMapping.recommendedTone
          })
          
          return personaMapping
        }
        
        return null
      },

      initializeAIProfile: () => {
        const { profile } = get()
        
        if (profile.dna && validateDNACompleteness(profile.dna)) {
          const aiProfile = initializeAIPersonalization(profile.dna, profile.aiTone)
          
          // Store AI personalization data in profile
          get().updateProfile({
            aiPersonalization: aiProfile
          })
          
          return aiProfile
        }
        
        return null
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        currentStep: state.currentStep,
        completedSteps: Array.from(state.completedSteps),
        hasExistingProgress: state.hasExistingProgress
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert completedSteps array back to Set
          state.completedSteps = new Set(state.completedSteps as any)
        }
      }
    }
  )
)

/**
 * Validation logic for each step
 */
function validateStepData(step: number, profile: OnboardingProfile): string[] {
  const errors: string[] = []

  switch (step) {
    case 1: // Role Selection
      if (!profile.role) {
        errors.push('Please select your role')
      }
      break

    case 2: // Sport & Demographics
      if (!profile.sport) errors.push('Please select your sport')
      if (!profile.gender) errors.push('Please select your gender')
      if (!profile.dateOfBirth) errors.push('Please enter your date of birth')
      if (!profile.graduationYear) errors.push('Please select your graduation year')
      break

    case 3: // Position & Level
      if (!profile.position) errors.push('Please select your position')
      if (!profile.academicLevel) errors.push('Please select your academic level')
      break

    case 4: // Team Details
      if (!profile.teamType) errors.push('Please select your team type')
      if (!profile.school?.name) errors.push('Please enter your school name')
      if (!profile.school?.city) errors.push('Please enter your school city')
      if (!profile.school?.state) errors.push('Please enter your school state')
      
      if (profile.teamType === 'club' && profile.club) {
        if (!profile.club.organization) errors.push('Please enter club organization')
        if (!profile.club.teamName) errors.push('Please enter club team name')
      }
      break

    case 5: // Goal Selection
      if (!profile.selectedGoals || profile.selectedGoals.length !== 3) {
        errors.push('Please select exactly 3 goals')
      }
      break

    case 6: // AthleteDNA
      const dnaFields = ['motivation', 'confidence', 'focusMode', 'competitiveness', 'coachability', 'resilience']
      dnaFields.forEach(field => {
        if (!profile.dna?.[field as keyof typeof profile.dna]) {
          errors.push(`Please answer the ${field} question`)
        }
      })
      break

    case 7: // AI Tone
      if (!profile.aiTone) {
        errors.push('Please select your preferred AI tone')
      }
      break

    case 8: // Age Verification
      if (profile.ageVerified === undefined) {
        errors.push('Age verification is required')
      }
      
      // Check if guardian consent is needed
      if (profile.dateOfBirth) {
        const age = calculateAge(profile.dateOfBirth)
        if (age >= 13 && age <= 15 && !profile.guardianEmail) {
          errors.push('Guardian email is required for users under 16')
        }
      }
      break

    case 9: // Legal Consent
      if (!profile.tosAccepted) {
        errors.push('You must accept the Terms of Service')
      }
      if (!profile.privacyAccepted) {
        errors.push('You must accept the Privacy Policy')
      }
      break

    case 10: // Review Profile
      // All previous validations should pass
      for (let i = 1; i < 10; i++) {
        const stepErrors = validateStepData(i, profile)
        if (stepErrors.length > 0) {
          errors.push(`Please complete step ${i}`)
          break
        }
      }
      break

    case 11: // Account Creation
      // This will be handled by the account creation component
      break
  }

  return errors
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Selector hooks for common use cases
export const useOnboardingProgress = () => {
  return useOnboardingStore((state) => ({
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    completedSteps: state.completedSteps,
    progressPercentage: (state.currentStep / state.totalSteps) * 100
  }))
}

export const useOnboardingProfile = () => {
  return useOnboardingStore((state) => state.profile)
}

export const useOnboardingValidation = (step: number) => {
  return useOnboardingStore((state) => ({
    errors: state.validationErrors[step] || [],
    isValid: state.validateStep(step)
  }))
}