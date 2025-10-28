/**
 * Comprehensive profile validation and error handling for onboarding
 * Provides validation rules, error recovery mechanisms, and retry logic
 */

import type { OnboardingProfile, ValidationRule, OnboardingError } from '../../types/onboarding'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
  retryable: boolean
  suggestedFix?: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
  suggestion: string
}

export interface RetryConfig {
  maxAttempts: number
  backoffMs: number
  exponentialBackoff: boolean
}

/**
 * Comprehensive profile validation
 */
export class ProfileValidator {
  private static instance: ProfileValidator
  
  private constructor() {}
  
  static getInstance(): ProfileValidator {
    if (!ProfileValidator.instance) {
      ProfileValidator.instance = new ProfileValidator()
    }
    return ProfileValidator.instance
  }

  /**
   * Validate complete onboarding profile
   */
  validateProfile(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Step 1: Role validation
    const roleValidation = this.validateRole(profile)
    errors.push(...roleValidation.errors)
    warnings.push(...roleValidation.warnings)

    // Step 2: Demographics validation
    const demographicsValidation = this.validateDemographics(profile)
    errors.push(...demographicsValidation.errors)
    warnings.push(...demographicsValidation.warnings)

    // Step 3: Athletic details validation
    const athleticValidation = this.validateAthleticDetails(profile)
    errors.push(...athleticValidation.errors)
    warnings.push(...athleticValidation.warnings)

    // Step 4: Team information validation
    const teamValidation = this.validateTeamInformation(profile)
    errors.push(...teamValidation.errors)
    warnings.push(...teamValidation.warnings)

    // Step 5: Goals validation
    const goalsValidation = this.validateGoals(profile)
    errors.push(...goalsValidation.errors)
    warnings.push(...goalsValidation.warnings)

    // Step 6: AthleteDNA validation
    const dnaValidation = this.validateAthleteDNA(profile)
    errors.push(...dnaValidation.errors)
    warnings.push(...dnaValidation.warnings)

    // Step 7: AI Tone validation
    const toneValidation = this.validateAITone(profile)
    errors.push(...toneValidation.errors)
    warnings.push(...toneValidation.warnings)

    // Step 8: Age verification validation
    const ageValidation = this.validateAgeVerification(profile)
    errors.push(...ageValidation.errors)
    warnings.push(...ageValidation.warnings)

    // Step 9: Legal consent validation
    const legalValidation = this.validateLegalConsent(profile)
    errors.push(...legalValidation.errors)
    warnings.push(...legalValidation.warnings)

    // Cross-field validation
    const crossValidation = this.validateCrossFieldRules(profile)
    errors.push(...crossValidation.errors)
    warnings.push(...crossValidation.warnings)

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate role selection
   */
  private validateRole(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!profile.role) {
      errors.push({
        field: 'role',
        message: 'Role selection is required',
        code: 'ROLE_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select either Athlete or Coach'
      })
    } else if (!['athlete', 'coach'].includes(profile.role)) {
      errors.push({
        field: 'role',
        message: 'Invalid role selected',
        code: 'ROLE_INVALID',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select either Athlete or Coach'
      })
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate demographics information
   */
  private validateDemographics(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Sport validation
    if (!profile.sport) {
      errors.push({
        field: 'sport',
        message: 'Sport selection is required',
        code: 'SPORT_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select your primary sport'
      })
    }

    // Gender validation
    if (!profile.gender) {
      errors.push({
        field: 'gender',
        message: 'Gender selection is required',
        code: 'GENDER_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select your gender'
      })
    } else if (!['male', 'female'].includes(profile.gender)) {
      errors.push({
        field: 'gender',
        message: 'Invalid gender selection',
        code: 'GENDER_INVALID',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select either Male or Female'
      })
    }

    // Date of birth validation
    if (!profile.dateOfBirth) {
      errors.push({
        field: 'dateOfBirth',
        message: 'Date of birth is required',
        code: 'DOB_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please enter your date of birth'
      })
    } else {
      const age = this.calculateAge(profile.dateOfBirth)
      
      if (age < 13) {
        errors.push({
          field: 'dateOfBirth',
          message: 'Must be at least 13 years old to use StatLocker',
          code: 'AGE_TOO_YOUNG',
          severity: 'error',
          retryable: false,
          suggestedFix: 'Please have a parent or guardian create an account'
        })
      } else if (age > 25) {
        warnings.push({
          field: 'dateOfBirth',
          message: 'Age seems high for typical high school athlete',
          code: 'AGE_HIGH',
          suggestion: 'Double-check your birth year if this seems incorrect'
        })
      }
    }

    // Graduation year validation
    if (!profile.graduationYear) {
      errors.push({
        field: 'graduationYear',
        message: 'Graduation year is required',
        code: 'GRAD_YEAR_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select your expected graduation year'
      })
    } else {
      const currentYear = new Date().getFullYear()
      const validYears = [2025, 2026, 2027, 2028, 2029]
      
      if (!validYears.includes(profile.graduationYear)) {
        errors.push({
          field: 'graduationYear',
          message: 'Invalid graduation year',
          code: 'GRAD_YEAR_INVALID',
          severity: 'error',
          retryable: true,
          suggestedFix: 'Please select a year between 2025-2029'
        })
      }

      // Cross-validate with age
      if (profile.dateOfBirth) {
        const age = this.calculateAge(profile.dateOfBirth)
        const expectedGradYear = currentYear + (18 - age)
        
        if (Math.abs(profile.graduationYear - expectedGradYear) > 2) {
          warnings.push({
            field: 'graduationYear',
            message: 'Graduation year doesn\'t match typical age progression',
            code: 'GRAD_YEAR_AGE_MISMATCH',
            suggestion: 'Double-check your graduation year and birth date'
          })
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate athletic details
   */
  private validateAthleticDetails(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Position validation
    if (!profile.position) {
      errors.push({
        field: 'position',
        message: 'Position selection is required',
        code: 'POSITION_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select your primary playing position'
      })
    }

    // Academic level validation
    if (!profile.academicLevel) {
      errors.push({
        field: 'academicLevel',
        message: 'Academic level is required',
        code: 'ACADEMIC_LEVEL_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select your current academic level'
      })
    } else if (!['freshman', 'jv', 'varsity'].includes(profile.academicLevel)) {
      errors.push({
        field: 'academicLevel',
        message: 'Invalid academic level',
        code: 'ACADEMIC_LEVEL_INVALID',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select Freshman, JV, or Varsity'
      })
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate team information
   */
  private validateTeamInformation(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Team type validation
    if (!profile.teamType) {
      errors.push({
        field: 'teamType',
        message: 'Team type selection is required',
        code: 'TEAM_TYPE_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select High School or Club'
      })
    }

    // School validation
    if (!profile.school) {
      errors.push({
        field: 'school',
        message: 'School information is required',
        code: 'SCHOOL_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please enter your school information'
      })
    } else {
      if (!profile.school.name?.trim()) {
        errors.push({
          field: 'school.name',
          message: 'School name is required',
          code: 'SCHOOL_NAME_REQUIRED',
          severity: 'error',
          retryable: true,
          suggestedFix: 'Please enter your school name'
        })
      }

      if (!profile.school.city?.trim()) {
        errors.push({
          field: 'school.city',
          message: 'School city is required',
          code: 'SCHOOL_CITY_REQUIRED',
          severity: 'error',
          retryable: true,
          suggestedFix: 'Please enter your school city'
        })
      }

      if (!profile.school.state?.trim()) {
        errors.push({
          field: 'school.state',
          message: 'School state is required',
          code: 'SCHOOL_STATE_REQUIRED',
          severity: 'error',
          retryable: true,
          suggestedFix: 'Please enter your school state'
        })
      }
    }

    // Club validation (if applicable)
    if (profile.teamType === 'club' && profile.club) {
      if (!profile.club.organization?.trim()) {
        errors.push({
          field: 'club.organization',
          message: 'Club organization is required',
          code: 'CLUB_ORG_REQUIRED',
          severity: 'error',
          retryable: true,
          suggestedFix: 'Please enter your club organization name'
        })
      }

      if (!profile.club.teamName?.trim()) {
        errors.push({
          field: 'club.teamName',
          message: 'Club team name is required',
          code: 'CLUB_TEAM_REQUIRED',
          severity: 'error',
          retryable: true,
          suggestedFix: 'Please enter your club team name'
        })
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate goals selection
   */
  private validateGoals(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!profile.selectedGoals) {
      errors.push({
        field: 'selectedGoals',
        message: 'Goal selection is required',
        code: 'GOALS_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select exactly 3 performance goals'
      })
    } else {
      if (profile.selectedGoals.length !== 3) {
        errors.push({
          field: 'selectedGoals',
          message: `Must select exactly 3 goals (currently ${profile.selectedGoals.length})`,
          code: 'GOALS_COUNT_INVALID',
          severity: 'error',
          retryable: true,
          suggestedFix: profile.selectedGoals.length < 3 
            ? `Please select ${3 - profile.selectedGoals.length} more goal(s)`
            : `Please remove ${profile.selectedGoals.length - 3} goal(s)`
        })
      }

      // Check for duplicate goals
      const uniqueGoals = new Set(profile.selectedGoals)
      if (uniqueGoals.size !== profile.selectedGoals.length) {
        errors.push({
          field: 'selectedGoals',
          message: 'Duplicate goals selected',
          code: 'GOALS_DUPLICATE',
          severity: 'error',
          retryable: true,
          suggestedFix: 'Please select 3 different goals'
        })
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate AthleteDNA assessment
   */
  private validateAthleteDNA(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!profile.dna) {
      errors.push({
        field: 'dna',
        message: 'AthleteDNA assessment is required',
        code: 'DNA_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please complete the personality assessment'
      })
    } else {
      const requiredFields = ['motivation', 'confidence', 'focusMode', 'competitiveness', 'coachability', 'resilience']
      
      for (const field of requiredFields) {
        if (!profile.dna[field as keyof typeof profile.dna]) {
          errors.push({
            field: `dna.${field}`,
            message: `${field} assessment is required`,
            code: 'DNA_FIELD_REQUIRED',
            severity: 'error',
            retryable: true,
            suggestedFix: `Please answer the ${field} question`
          })
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate AI tone preference
   */
  private validateAITone(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!profile.aiTone) {
      errors.push({
        field: 'aiTone',
        message: 'AI tone preference is required',
        code: 'AI_TONE_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select your preferred AI communication style'
      })
    } else if (!['hype', 'mentor', 'analyst', 'captain'].includes(profile.aiTone)) {
      errors.push({
        field: 'aiTone',
        message: 'Invalid AI tone selection',
        code: 'AI_TONE_INVALID',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please select a valid AI tone option'
      })
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate age verification and compliance
   */
  private validateAgeVerification(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (profile.dateOfBirth) {
      const age = this.calculateAge(profile.dateOfBirth)
      
      // Check if age verification is required
      if (age < 16) {
        if (profile.ageVerified === undefined) {
          errors.push({
            field: 'ageVerified',
            message: 'Age verification is required for users under 16',
            code: 'AGE_VERIFICATION_REQUIRED',
            severity: 'error',
            retryable: true,
            suggestedFix: 'Please complete the age verification process'
          })
        }

        // Guardian consent for 13-15 year olds
        if (age >= 13 && age <= 15) {
          if (!profile.guardianEmail?.trim()) {
            errors.push({
              field: 'guardianEmail',
              message: 'Guardian email is required for users aged 13-15',
              code: 'GUARDIAN_EMAIL_REQUIRED',
              severity: 'error',
              retryable: true,
              suggestedFix: 'Please provide your parent or guardian\'s email address'
            })
          } else if (!this.isValidEmail(profile.guardianEmail)) {
            errors.push({
              field: 'guardianEmail',
              message: 'Invalid guardian email format',
              code: 'GUARDIAN_EMAIL_INVALID',
              severity: 'error',
              retryable: true,
              suggestedFix: 'Please enter a valid email address'
            })
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate legal consent
   */
  private validateLegalConsent(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!profile.tosAccepted) {
      errors.push({
        field: 'tosAccepted',
        message: 'Terms of Service acceptance is required',
        code: 'TOS_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please read and accept the Terms of Service'
      })
    }

    if (!profile.privacyAccepted) {
      errors.push({
        field: 'privacyAccepted',
        message: 'Privacy Policy acceptance is required',
        code: 'PRIVACY_REQUIRED',
        severity: 'error',
        retryable: true,
        suggestedFix: 'Please read and accept the Privacy Policy'
      })
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate cross-field business rules
   */
  private validateCrossFieldRules(profile: OnboardingProfile): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Position-sport compatibility
    if (profile.sport && profile.position) {
      // This would be expanded with actual position-sport mappings
      // For now, just a placeholder validation
    }

    // Academic level and graduation year consistency
    if (profile.academicLevel && profile.graduationYear && profile.dateOfBirth) {
      const age = this.calculateAge(profile.dateOfBirth)
      const currentYear = new Date().getFullYear()
      
      // Rough validation - can be refined
      if (profile.academicLevel === 'freshman' && profile.graduationYear - currentYear > 4) {
        warnings.push({
          field: 'academicLevel',
          message: 'Academic level and graduation year seem inconsistent',
          code: 'ACADEMIC_GRAD_MISMATCH',
          suggestion: 'Double-check your academic level and graduation year'
        })
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

/**
 * Error recovery and retry logic
 */
export class OnboardingErrorHandler {
  private static instance: OnboardingErrorHandler
  
  private constructor() {}
  
  static getInstance(): OnboardingErrorHandler {
    if (!OnboardingErrorHandler.instance) {
      OnboardingErrorHandler.instance = new OnboardingErrorHandler()
    }
    return OnboardingErrorHandler.instance
  }

  /**
   * Handle validation errors with recovery suggestions
   */
  handleValidationErrors(errors: ValidationError[]): {
    criticalErrors: ValidationError[]
    recoverableErrors: ValidationError[]
    suggestions: string[]
  } {
    const criticalErrors = errors.filter(e => !e.retryable)
    const recoverableErrors = errors.filter(e => e.retryable)
    
    const suggestions = recoverableErrors
      .map(e => e.suggestedFix)
      .filter(Boolean) as string[]

    return {
      criticalErrors,
      recoverableErrors,
      suggestions
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {
      maxAttempts: 3,
      backoffMs: 1000,
      exponentialBackoff: true
    }
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === config.maxAttempts) {
          break
        }

        // Calculate delay
        const delay = config.exponentialBackoff 
          ? config.backoffMs * Math.pow(2, attempt - 1)
          : config.backoffMs

        await this.delay(delay)
      }
    }

    throw lastError!
  }

  /**
   * Create user-friendly error messages
   */
  createUserFriendlyMessage(error: OnboardingError): string {
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'We couldn\'t connect right now. Check your internet and try again.',
      'VALIDATION_ERROR': 'Please check your information and try again.',
      'AUTH_ERROR': 'There was an issue with your account. Please try again.',
      'STORAGE_ERROR': 'We couldn\'t save your progress. Please try again.',
      'UNKNOWN_ERROR': 'Something went wrong. Please try again or contact support.'
    }

    return errorMessages[error.type.toUpperCase()] || error.message
  }

  /**
   * Determine if error is recoverable
   */
  isRecoverable(error: OnboardingError): boolean {
    const recoverableTypes = ['network', 'storage', 'validation']
    return error.retryable && recoverableTypes.includes(error.type)
  }

  /**
   * Get recovery actions for error
   */
  getRecoveryActions(error: OnboardingError): string[] {
    const actions: Record<string, string[]> = {
      'network': [
        'Check your internet connection',
        'Try again in a few moments',
        'Switch to a different network if available'
      ],
      'validation': [
        'Review the highlighted fields',
        'Make sure all required information is provided',
        'Check for any formatting requirements'
      ],
      'storage': [
        'Try again in a moment',
        'Make sure you have enough storage space',
        'Restart the app if the problem persists'
      ],
      'authentication': [
        'Check your email and password',
        'Make sure your email is verified',
        'Try resetting your password if needed'
      ]
    }

    return actions[error.type] || ['Try again', 'Contact support if the problem persists']
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instances
export const profileValidator = ProfileValidator.getInstance()
export const errorHandler = OnboardingErrorHandler.getInstance()