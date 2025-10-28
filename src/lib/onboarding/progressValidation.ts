import { OnboardingProfile, OnboardingProgress, ValidationRule, StepValidation } from '@/types/onboarding'

// Step validation rules
export const stepValidationRules: Record<number, ValidationRule[]> = {
  1: [
    { field: 'role', required: true }
  ],
  2: [
    { field: 'sport', required: true },
    { field: 'gender', required: true },
    { field: 'dateOfBirth', required: true, custom: validateAge },
    { field: 'graduationYear', required: true, custom: validateGraduationYear }
  ],
  3: [
    { field: 'position', required: true },
    { field: 'academicLevel', required: true }
  ],
  4: [
    { field: 'teamType', required: true },
    { field: 'school.name', required: true, minLength: 2 },
    { field: 'school.city', required: true, minLength: 2 },
    { field: 'school.state', required: true, minLength: 2 }
  ],
  5: [
    { field: 'selectedGoals', required: true, custom: validateGoals }
  ],
  6: [
    { field: 'dna.motivation', required: true },
    { field: 'dna.confidence', required: true },
    { field: 'dna.focusMode', required: true },
    { field: 'dna.competitiveness', required: true },
    { field: 'dna.coachability', required: true },
    { field: 'dna.resilience', required: true }
  ],
  7: [
    { field: 'aiTone', required: true }
  ],
  8: [
    { field: 'ageVerified', required: true }
  ],
  9: [
    { field: 'tosAccepted', required: true },
    { field: 'privacyAccepted', required: true }
  ]
}

// Custom validation functions
function validateAge(dateOfBirth: Date): string | null {
  if (!dateOfBirth || !(dateOfBirth instanceof Date)) {
    return 'Valid date of birth is required'
  }

  const today = new Date()
  const age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    // Haven't had birthday this year
  }

  if (age < 10) {
    return 'Must be at least 10 years old'
  }

  if (age > 25) {
    return 'Age seems unusually high for a student athlete'
  }

  return null
}

function validateGraduationYear(year: number): string | null {
  const currentYear = new Date().getFullYear()
  
  if (year < currentYear) {
    return 'Graduation year cannot be in the past'
  }
  
  if (year > currentYear + 8) {
    return 'Graduation year seems too far in the future'
  }
  
  return null
}

function validateGoals(goals: string[]): string | null {
  if (!Array.isArray(goals)) {
    return 'Goals must be an array'
  }
  
  if (goals.length !== 3) {
    return 'Must select exactly 3 goals'
  }
  
  // Check for duplicates
  const uniqueGoals = new Set(goals)
  if (uniqueGoals.size !== goals.length) {
    return 'Cannot select duplicate goals'
  }
  
  return null
}

// Get nested property value
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

// Validate individual field
export function validateField(profile: OnboardingProfile, rule: ValidationRule): string | null {
  const value = getNestedValue(profile, rule.field)

  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${rule.field} is required`
  }

  // Skip other validations if field is empty and not required
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null
  }

  // Check minimum length
  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return `${rule.field} must be at least ${rule.minLength} characters`
  }

  // Check maximum length
  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return `${rule.field} must be no more than ${rule.maxLength} characters`
  }

  // Check pattern
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return `${rule.field} format is invalid`
  }

  // Check custom validation
  if (rule.custom) {
    return rule.custom(value)
  }

  return null
}

// Validate entire step
export function validateStep(profile: OnboardingProfile, step: number): StepValidation {
  const rules = stepValidationRules[step] || []
  const errors: string[] = []
  const warnings: string[] = []

  for (const rule of rules) {
    const error = validateField(profile, rule)
    if (error) {
      errors.push(error)
    }
  }

  // Add step-specific warnings
  if (step === 2 && profile.dateOfBirth) {
    const age = new Date().getFullYear() - profile.dateOfBirth.getFullYear()
    if (age < 13) {
      warnings.push('Parental consent will be required for users under 13')
    }
  }

  if (step === 4 && profile.teamType === 'club' && !profile.club) {
    warnings.push('Club team information is recommended for club athletes')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate entire profile
export function validateProfile(profile: OnboardingProfile): Record<number, StepValidation> {
  const results: Record<number, StepValidation> = {}
  
  for (let step = 1; step <= 9; step++) {
    results[step] = validateStep(profile, step)
  }
  
  return results
}

// Check if profile is complete for onboarding
export function isProfileComplete(profile: OnboardingProfile): boolean {
  const validationResults = validateProfile(profile)
  
  // Check required steps (1-7, 9) - step 8 is conditional
  const requiredSteps = [1, 2, 3, 4, 5, 6, 7, 9]
  
  for (const step of requiredSteps) {
    if (!validationResults[step]?.isValid) {
      return false
    }
  }
  
  // Check age verification if needed
  if (profile.dateOfBirth) {
    const age = new Date().getFullYear() - profile.dateOfBirth.getFullYear()
    if (age < 16 && !validationResults[8]?.isValid) {
      return false
    }
  }
  
  return true
}

// Validate progress data integrity
export function validateProgressIntegrity(progress: OnboardingProgress): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!progress.profile) {
    errors.push('Profile data is missing')
  }

  if (typeof progress.currentStep !== 'number') {
    errors.push('Current step must be a number')
  }

  if (!Array.isArray(progress.completedSteps)) {
    errors.push('Completed steps must be an array')
  }

  if (!progress.lastUpdated || !(progress.lastUpdated instanceof Date)) {
    errors.push('Last updated timestamp is invalid')
  }

  if (!progress.deviceId || typeof progress.deviceId !== 'string') {
    errors.push('Device ID is missing or invalid')
  }

  if (!progress.version || typeof progress.version !== 'string') {
    errors.push('Version is missing or invalid')
  }

  // Check step bounds
  if (progress.currentStep < 0 || progress.currentStep > 12) {
    errors.push('Current step is out of valid range (0-12)')
  }

  // Check completed steps validity
  if (progress.completedSteps) {
    for (const step of progress.completedSteps) {
      if (typeof step !== 'number' || step < 1 || step > 12) {
        errors.push(`Invalid completed step: ${step}`)
      }
    }

    // Check if current step is consistent with completed steps
    const maxCompleted = Math.max(...progress.completedSteps, 0)
    if (progress.currentStep > 0 && progress.currentStep <= maxCompleted) {
      warnings.push('Current step appears to be behind completed steps')
    }
  }

  // Check timestamp recency
  if (progress.lastUpdated) {
    const daysSinceUpdate = (Date.now() - progress.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate > 30) {
      warnings.push('Progress data is more than 30 days old')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Get next required step
export function getNextRequiredStep(profile: OnboardingProfile, completedSteps: number[]): number {
  for (let step = 1; step <= 12; step++) {
    if (!completedSteps.includes(step)) {
      const validation = validateStep(profile, step)
      
      // Skip age verification if not needed
      if (step === 8) {
        const age = profile.dateOfBirth ? 
          new Date().getFullYear() - profile.dateOfBirth.getFullYear() : 18
        if (age >= 16) {
          continue // Skip age verification for 16+
        }
      }
      
      return step
    }
  }
  
  return 12 // Final step
}

// Calculate completion percentage
export function calculateCompletionPercentage(profile: OnboardingProfile, completedSteps: number[]): number {
  const totalSteps = 9 // Core steps (excluding conditional age verification)
  const validSteps = completedSteps.filter(step => {
    const validation = validateStep(profile, step)
    return validation.isValid
  })
  
  return Math.round((validSteps.length / totalSteps) * 100)
}