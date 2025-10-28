export interface OnboardingProfile {
  // Step 1: Role
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
  school?: {
    name: string
    city: string
    state: string
  }
  club?: {
    organization: string
    teamName: string
  }
  
  // Step 5: Goals
  selectedGoals?: string[] // exactly 3
  
  // Step 6: AthleteDNA
  dna?: {
    motivation: string
    confidence: string
    focusMode: string
    competitiveness: string
    coachability: string
    resilience: string
  }
  
  // Step 7: AI Tone
  aiTone?: 'hype' | 'mentor' | 'analyst' | 'captain'
  
  // Step 8: Age Verification (if needed)
  ageVerified?: boolean
  guardianEmail?: string
  consentTimestamp?: Date
  
  // Step 9: Legal
  tosAccepted?: boolean
  privacyAccepted?: boolean
  benchmarkingConsent?: boolean
  
  // Metadata
  onboardingStarted?: Date
  onboardingCompleted?: Date
  trialActivated?: boolean
}

export interface OnboardingProgress {
  profile: OnboardingProfile
  currentStep: number
  completedSteps: number[]
  lastUpdated: Date
  deviceId: string
  version: string
}

export interface OnboardingStore {
  // Current state
  currentStep: number
  totalSteps: number
  isLoading: boolean
  
  // User data
  profile: OnboardingProfile
  
  // Progress tracking
  completedSteps: Set<number>
  validationErrors: Record<string, string[]>
  
  // Recovery state
  hasRestoredProgress: boolean
  conflictResolution?: ConflictResolution
  
  // Actions
  setStep: (step: number) => void
  updateProfile: (data: Partial<OnboardingProfile>) => void
  validateStep: (step: number) => boolean
  saveProgress: () => Promise<void>
  resetOnboarding: () => void
  restoreProgress: (progress: OnboardingProgress) => void
  resolveConflict: (resolution: 'local' | 'remote' | 'merge') => void
}

export interface ConflictResolution {
  localProgress: OnboardingProgress
  remoteProgress: OnboardingProgress
  conflictFields: string[]
  showDialog: boolean
}

export interface ValidationRule {
  field: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface StepValidation {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface OnboardingAnalytics {
  // Flow events
  onboarding_started: { timestamp: Date, source: string }
  step_completed: { step: number, duration: number }
  step_abandoned: { step: number, duration: number }
  
  // Progress events
  progress_saved: { step: number, method: 'auto' | 'manual' }
  progress_restored: { step: number, source: 'local' | 'firestore' }
  conflict_detected: { localStep: number, remoteStep: number }
  conflict_resolved: { resolution: string, method: string }
  
  // Recovery events
  onboarding_resumed: { fromStep: number, totalDuration: number }
  onboarding_reset: { atStep: number, reason: string }
}

export type OnboardingStep = 
  | 'role'
  | 'sport-gender'
  | 'position-level'
  | 'team-details'
  | 'goals'
  | 'athlete-dna'
  | 'tone-preference'
  | 'age-verification'
  | 'legal-consent'
  | 'review'
  | 'account-creation'

export interface StepConfig {
  id: OnboardingStep
  title: string
  subtitle?: string
  component: string
  validation: ValidationRule[]
  required: boolean
  skipConditions?: (profile: OnboardingProfile) => boolean
}