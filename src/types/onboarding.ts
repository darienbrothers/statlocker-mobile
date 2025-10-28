/**
 * Core onboarding types and interfaces
 */

// Main onboarding profile interface
export interface OnboardingProfile {
  // Step 1: Role Selection
  role?: 'athlete' | 'coach'
  
  // Step 2: Sport & Demographics
  sport?: string
  gender?: 'male' | 'female'
  dateOfBirth?: Date
  graduationYear?: number
  
  // Step 3: Position & Level
  position?: string
  academicLevel?: 'freshman' | 'jv' | 'varsity'
  
  // Step 4: Team Details
  teamType?: 'high_school' | 'club'
  school?: SchoolInfo
  club?: ClubInfo
  
  // Step 5: Goals
  selectedGoals?: string[]
  
  // Step 6: AthleteDNA
  dna?: AthleteDNA
  
  // Step 7: AI Tone Preference
  aiTone?: AITone
  
  // AI Personalization (derived from DNA + tone)
  aiPersonalization?: {
    personaType: string
    aiTone: AITone
    insightPreferences: {
      style: string
      frequency: string
      complexity: string
      focusAreas: string[]
    }
    characteristics: string[]
    strengths: string[]
    growthAreas: string[]
    derivationTimestamp: Date
  }
  
  // Step 8: Age Verification (conditional)
  ageVerified?: boolean
  guardianEmail?: string
  consentTimestamp?: Date
  
  // Step 9: Legal Consent
  tosAccepted?: boolean
  privacyAccepted?: boolean
  benchmarkingConsent?: boolean
  
  // Metadata
  onboardingStarted?: Date
  onboardingCompleted?: Date
  trialActivated?: boolean
}

// Step-specific data interfaces
export interface RoleData {
  role: 'athlete' | 'coach'
}

export interface SportData {
  sport: string
  gender: 'male' | 'female'
  dateOfBirth: Date
  graduationYear: number
}

export interface PositionData {
  position: string
  academicLevel: 'freshman' | 'jv' | 'varsity'
}

export interface TeamData {
  teamType: 'high_school' | 'club'
  school: SchoolInfo
  club?: ClubInfo
}

export interface GoalData {
  selectedGoals: string[] // exactly 3
}

export interface DNAData {
  dna: AthleteDNA
}

export interface ToneData {
  aiTone: AITone
}

export interface AgeVerificationData {
  ageVerified: boolean
  guardianEmail?: string
  consentTimestamp?: Date
}

export interface LegalConsentData {
  tosAccepted: boolean
  privacyAccepted: boolean
  benchmarkingConsent: boolean
}

// Supporting interfaces
export interface SchoolInfo {
  name: string
  city: string
  state: string
  type?: 'public' | 'private' | 'charter'
}

export interface ClubInfo {
  organization: string
  teamName: string
  league?: string
}

export interface AthleteDNA {
  motivation: 'intrinsic' | 'extrinsic' | 'balanced'
  confidence: 'high' | 'moderate' | 'building'
  focusMode: 'intense' | 'steady' | 'burst'
  competitiveness: 'high' | 'moderate' | 'collaborative'
  coachability: 'high' | 'moderate' | 'independent'
  resilience: 'high' | 'moderate' | 'developing'
  completedAt?: Date
}

export type AITone = 'hype' | 'mentor' | 'analyst' | 'captain'

// Validation interfaces
export interface ValidationRule {
  field: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationErrors {
  [stepNumber: number]: string[]
}

// Analytics event types
export interface OnboardingAnalyticsEvents {
  onboarding_started: {
    timestamp: Date
    source: string
    deviceType: string
    version: string
  }
  
  step_completed: {
    step: number
    duration: number
    attempts: number
    validationErrors: string[]
  }
  
  step_abandoned: {
    step: number
    duration: number
    reason?: string
  }
  
  goal_selected: {
    goalId: string
    category: string
    position: number
  }
  
  tone_previewed: {
    tone: AITone
    duration: number
  }
  
  dna_question_answered: {
    questionId: string
    answer: string
    timeSpent: number
  }
  
  dna_completed: {
    responses: Record<string, string>
    totalTimeSpent: number
  }
  
  tone_selected: {
    tone: AITone
    wasRecommended: boolean
    previousTone?: AITone
  }
  
  persona_derived: {
    personaType: string
    dnaResponses: Record<string, string>
    recommendedTone: AITone
  }
  
  onboarding_completed: {
    totalDuration: number
    stepCount: number
    personaType?: string
  }
  
  trial_activated: {
    timestamp: Date
    method: string
    userId: string
  }
  
  validation_error: {
    step: number
    field: string
    error: string
    attemptNumber: number
  }
  
  network_error: {
    step: number
    operation: string
    error: string
    retryCount: number
  }
  
  onboarding_resumed: {
    lastCompletedStep: number
    daysSinceStart: number
    resumeMethod: 'automatic' | 'manual'
  }
  
  onboarding_reset: {
    completedSteps: number
    reason: 'user_initiated' | 'data_conflict' | 'error_recovery'
  }
}

// Store state interface
export interface OnboardingState {
  // Current state
  currentStep: number
  totalSteps: number
  isLoading: boolean
  hasExistingProgress: boolean
  
  // User data
  profile: OnboardingProfile
  
  // Progress tracking
  completedSteps: Set<number>
  validationErrors: ValidationErrors
  
  // Persistence
  lastSaved?: Date
  syncStatus: 'idle' | 'saving' | 'syncing' | 'error'
}

// Store actions interface
export interface OnboardingActions {
  // Navigation
  setStep: (step: number) => void
  navigateNext: () => void
  navigateBack: () => void
  canNavigateToStep: (step: number) => boolean
  
  // Data management
  updateProfile: (data: Partial<OnboardingProfile>) => void
  resetProfile: () => void
  
  // Validation
  validateStep: (step: number) => boolean
  setValidationErrors: (step: number, errors: string[]) => void
  clearValidationErrors: (step: number) => void
  
  // Persistence
  saveProgress: () => Promise<void>
  loadProgress: () => Promise<void>
  resetOnboarding: () => void
  
  // Analytics
  trackEvent: <K extends keyof OnboardingAnalyticsEvents>(
    event: K,
    data: OnboardingAnalyticsEvents[K]
  ) => void
  
  // Persona derivation
  derivePersonaFromDNA: () => any | null
  initializeAIProfile: () => any | null
}

// Combined store interface
export interface OnboardingStore extends OnboardingState, OnboardingActions {}

// Error handling types
export interface OnboardingError {
  type: 'validation' | 'network' | 'storage' | 'authentication' | 'unknown'
  message: string
  step?: number
  field?: string
  retryable: boolean
  timestamp: Date
}

// Progress persistence types
export interface ProgressSnapshot {
  profile: OnboardingProfile
  currentStep: number
  completedSteps: number[]
  timestamp: Date
  version: string
}

// Goal-related types (for step 5)
export interface GoalOption {
  id: string
  category: string
  title: string
  description: string
  targetValue?: number
  unit?: string
  positionSpecific?: string[]
}

export interface GoalCategory {
  id: string
  name: string
  description: string
  goals: GoalOption[]
}

// Position-related types (for step 3)
export interface PositionOption {
  id: string
  name: string
  sport: string
  gender?: 'male' | 'female'
  description: string
  statCategories: string[]
}

// Sport-related types (for step 2)
export interface SportOption {
  id: string
  name: string
  description: string
  positions: PositionOption[]
  supportedGenders: ('male' | 'female')[]
}

// Constants for validation
export const GRADUATION_YEARS = [2025, 2026, 2027, 2028, 2029] as const
export const ACADEMIC_LEVELS = ['freshman', 'jv', 'varsity'] as const
export const AI_TONES = ['hype', 'mentor', 'analyst', 'captain'] as const
export const TEAM_TYPES = ['high_school', 'club'] as const
export const GENDERS = ['male', 'female'] as const
export const ROLES = ['athlete', 'coach'] as const

export type GraduationYear = typeof GRADUATION_YEARS[number]
export type AcademicLevel = typeof ACADEMIC_LEVELS[number]