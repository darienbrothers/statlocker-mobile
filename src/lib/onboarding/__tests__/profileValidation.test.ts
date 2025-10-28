import { 
  ProfileValidator, 
  OnboardingErrorHandler,
  profileValidator,
  errorHandler
} from '../profileValidation'
import type { OnboardingProfile, OnboardingError } from '../../../types/onboarding'

describe('ProfileValidator', () => {
  let validator: ProfileValidator

  beforeEach(() => {
    validator = ProfileValidator.getInstance()
  })

  describe('Complete Profile Validation', () => {
    const validProfile: OnboardingProfile = {
      role: 'athlete',
      sport: 'lacrosse',
      gender: 'male',
      dateOfBirth: new Date('2006-05-15'),
      graduationYear: 2025,
      position: 'midfielder',
      academicLevel: 'varsity',
      teamType: 'high_school',
      school: {
        name: 'Test High School',
        city: 'Test City',
        state: 'CA'
      },
      selectedGoals: ['Goal 1', 'Goal 2', 'Goal 3'],
      dna: {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'intense',
        competitiveness: 'high',
        coachability: 'high',
        resilience: 'high'
      },
      aiTone: 'hype',
      ageVerified: true,
      tosAccepted: true,
      privacyAccepted: true,
      benchmarkingConsent: false
    }

    it('should validate a complete valid profile', () => {
      const result = validator.validateProfile(validProfile)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for incomplete profile', () => {
      const incompleteProfile: OnboardingProfile = {
        role: 'athlete'
        // Missing other required fields
      }

      const result = validator.validateProfile(incompleteProfile)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Role Validation', () => {
    it('should require role selection', () => {
      const profile: OnboardingProfile = {}
      const result = validator.validateProfile(profile)
      
      const roleError = result.errors.find(e => e.field === 'role')
      expect(roleError).toBeDefined()
      expect(roleError?.code).toBe('ROLE_REQUIRED')
      expect(roleError?.retryable).toBe(true)
    })

    it('should reject invalid role values', () => {
      const profile: OnboardingProfile = {
        role: 'invalid' as any
      }
      const result = validator.validateProfile(profile)
      
      const roleError = result.errors.find(e => e.field === 'role')
      expect(roleError).toBeDefined()
      expect(roleError?.code).toBe('ROLE_INVALID')
    })

    it('should accept valid role values', () => {
      const athleteProfile: OnboardingProfile = { role: 'athlete' }
      const coachProfile: OnboardingProfile = { role: 'coach' }
      
      const athleteResult = validator.validateProfile(athleteProfile)
      const coachResult = validator.validateProfile(coachProfile)
      
      const athleteRoleError = athleteResult.errors.find(e => e.field === 'role')
      const coachRoleError = coachResult.errors.find(e => e.field === 'role')
      
      expect(athleteRoleError).toBeUndefined()
      expect(coachRoleError).toBeUndefined()
    })
  })

  describe('Demographics Validation', () => {
    it('should require sport selection', () => {
      const profile: OnboardingProfile = { role: 'athlete' }
      const result = validator.validateProfile(profile)
      
      const sportError = result.errors.find(e => e.field === 'sport')
      expect(sportError).toBeDefined()
      expect(sportError?.code).toBe('SPORT_REQUIRED')
    })

    it('should require gender selection', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse'
      }
      const result = validator.validateProfile(profile)
      
      const genderError = result.errors.find(e => e.field === 'gender')
      expect(genderError).toBeDefined()
      expect(genderError?.code).toBe('GENDER_REQUIRED')
    })

    it('should require date of birth', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male'
      }
      const result = validator.validateProfile(profile)
      
      const dobError = result.errors.find(e => e.field === 'dateOfBirth')
      expect(dobError).toBeDefined()
      expect(dobError?.code).toBe('DOB_REQUIRED')
    })

    it('should reject users under 13', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2015-01-01') // 8-9 years old
      }
      const result = validator.validateProfile(profile)
      
      const ageError = result.errors.find(e => e.field === 'dateOfBirth')
      expect(ageError).toBeDefined()
      expect(ageError?.code).toBe('AGE_TOO_YOUNG')
      expect(ageError?.retryable).toBe(false)
    })

    it('should warn about high age', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('1995-01-01') // ~28 years old
      }
      const result = validator.validateProfile(profile)
      
      const ageWarning = result.warnings.find(w => w.field === 'dateOfBirth')
      expect(ageWarning).toBeDefined()
      expect(ageWarning?.code).toBe('AGE_HIGH')
    })

    it('should require graduation year', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01')
      }
      const result = validator.validateProfile(profile)
      
      const gradError = result.errors.find(e => e.field === 'graduationYear')
      expect(gradError).toBeDefined()
      expect(gradError?.code).toBe('GRAD_YEAR_REQUIRED')
    })

    it('should validate graduation year range', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2030 // Invalid year
      }
      const result = validator.validateProfile(profile)
      
      const gradError = result.errors.find(e => e.field === 'graduationYear')
      expect(gradError).toBeDefined()
      expect(gradError?.code).toBe('GRAD_YEAR_INVALID')
    })
  })

  describe('Athletic Details Validation', () => {
    it('should require position selection', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025
      }
      const result = validator.validateProfile(profile)
      
      const positionError = result.errors.find(e => e.field === 'position')
      expect(positionError).toBeDefined()
      expect(positionError?.code).toBe('POSITION_REQUIRED')
    })

    it('should require academic level selection', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025,
        position: 'midfielder'
      }
      const result = validator.validateProfile(profile)
      
      const levelError = result.errors.find(e => e.field === 'academicLevel')
      expect(levelError).toBeDefined()
      expect(levelError?.code).toBe('ACADEMIC_LEVEL_REQUIRED')
    })

    it('should validate academic level values', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025,
        position: 'midfielder',
        academicLevel: 'invalid' as any
      }
      const result = validator.validateProfile(profile)
      
      const levelError = result.errors.find(e => e.field === 'academicLevel')
      expect(levelError).toBeDefined()
      expect(levelError?.code).toBe('ACADEMIC_LEVEL_INVALID')
    })
  })

  describe('Team Information Validation', () => {
    it('should require team type selection', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025,
        position: 'midfielder',
        academicLevel: 'varsity'
      }
      const result = validator.validateProfile(profile)
      
      const teamTypeError = result.errors.find(e => e.field === 'teamType')
      expect(teamTypeError).toBeDefined()
      expect(teamTypeError?.code).toBe('TEAM_TYPE_REQUIRED')
    })

    it('should require school information', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025,
        position: 'midfielder',
        academicLevel: 'varsity',
        teamType: 'high_school'
      }
      const result = validator.validateProfile(profile)
      
      const schoolError = result.errors.find(e => e.field === 'school')
      expect(schoolError).toBeDefined()
      expect(schoolError?.code).toBe('SCHOOL_REQUIRED')
    })

    it('should require school name, city, and state', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025,
        position: 'midfielder',
        academicLevel: 'varsity',
        teamType: 'high_school',
        school: {
          name: '',
          city: '',
          state: ''
        }
      }
      const result = validator.validateProfile(profile)
      
      const nameError = result.errors.find(e => e.field === 'school.name')
      const cityError = result.errors.find(e => e.field === 'school.city')
      const stateError = result.errors.find(e => e.field === 'school.state')
      
      expect(nameError).toBeDefined()
      expect(cityError).toBeDefined()
      expect(stateError).toBeDefined()
    })

    it('should require club information when team type is club', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025,
        position: 'midfielder',
        academicLevel: 'varsity',
        teamType: 'club',
        school: {
          name: 'Test School',
          city: 'Test City',
          state: 'CA'
        },
        club: {
          organization: '',
          teamName: ''
        }
      }
      const result = validator.validateProfile(profile)
      
      const orgError = result.errors.find(e => e.field === 'club.organization')
      const teamError = result.errors.find(e => e.field === 'club.teamName')
      
      expect(orgError).toBeDefined()
      expect(teamError).toBeDefined()
    })
  })

  describe('Goals Validation', () => {
    it('should require goal selection', () => {
      const profile: OnboardingProfile = { 
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-01-01'),
        graduationYear: 2025,
        position: 'midfielder',
        academicLevel: 'varsity',
        teamType: 'high_school',
        school: {
          name: 'Test School',
          city: 'Test City',
          state: 'CA'
        }
      }
      const result = validator.validateProfile(profile)
      
      const goalsError = result.errors.find(e => e.field === 'selectedGoals')
      expect(goalsError).toBeDefined()
      expect(goalsError?.code).toBe('GOALS_REQUIRED')
    })

    it('should require exactly 3 goals', () => {
      const profileTooFew: OnboardingProfile = { 
        selectedGoals: ['Goal 1', 'Goal 2']
      }
      const profileTooMany: OnboardingProfile = { 
        selectedGoals: ['Goal 1', 'Goal 2', 'Goal 3', 'Goal 4']
      }
      
      const resultTooFew = validator.validateProfile(profileTooFew)
      const resultTooMany = validator.validateProfile(profileTooMany)
      
      const errorTooFew = resultTooFew.errors.find(e => e.field === 'selectedGoals')
      const errorTooMany = resultTooMany.errors.find(e => e.field === 'selectedGoals')
      
      expect(errorTooFew?.code).toBe('GOALS_COUNT_INVALID')
      expect(errorTooMany?.code).toBe('GOALS_COUNT_INVALID')
    })

    it('should reject duplicate goals', () => {
      const profile: OnboardingProfile = { 
        selectedGoals: ['Goal 1', 'Goal 1', 'Goal 2']
      }
      const result = validator.validateProfile(profile)
      
      const duplicateError = result.errors.find(e => e.field === 'selectedGoals')
      expect(duplicateError).toBeDefined()
      expect(duplicateError?.code).toBe('GOALS_DUPLICATE')
    })
  })

  describe('AthleteDNA Validation', () => {
    it('should require DNA assessment', () => {
      const profile: OnboardingProfile = {}
      const result = validator.validateProfile(profile)
      
      const dnaError = result.errors.find(e => e.field === 'dna')
      expect(dnaError).toBeDefined()
      expect(dnaError?.code).toBe('DNA_REQUIRED')
    })

    it('should require all DNA fields', () => {
      const profile: OnboardingProfile = { 
        dna: {
          motivation: 'intrinsic',
          confidence: 'high'
          // Missing other fields
        } as any
      }
      const result = validator.validateProfile(profile)
      
      const missingFields = ['focusMode', 'competitiveness', 'coachability', 'resilience']
      missingFields.forEach(field => {
        const fieldError = result.errors.find(e => e.field === `dna.${field}`)
        expect(fieldError).toBeDefined()
        expect(fieldError?.code).toBe('DNA_FIELD_REQUIRED')
      })
    })
  })

  describe('AI Tone Validation', () => {
    it('should require AI tone selection', () => {
      const profile: OnboardingProfile = {}
      const result = validator.validateProfile(profile)
      
      const toneError = result.errors.find(e => e.field === 'aiTone')
      expect(toneError).toBeDefined()
      expect(toneError?.code).toBe('AI_TONE_REQUIRED')
    })

    it('should validate AI tone values', () => {
      const profile: OnboardingProfile = { 
        aiTone: 'invalid' as any
      }
      const result = validator.validateProfile(profile)
      
      const toneError = result.errors.find(e => e.field === 'aiTone')
      expect(toneError).toBeDefined()
      expect(toneError?.code).toBe('AI_TONE_INVALID')
    })
  })

  describe('Age Verification Validation', () => {
    it('should require age verification for users under 16', () => {
      const profile: OnboardingProfile = { 
        dateOfBirth: new Date('2010-01-01') // 13-14 years old
      }
      const result = validator.validateProfile(profile)
      
      const ageVerificationError = result.errors.find(e => e.field === 'ageVerified')
      expect(ageVerificationError).toBeDefined()
      expect(ageVerificationError?.code).toBe('AGE_VERIFICATION_REQUIRED')
    })

    it('should require guardian email for users 13-15', () => {
      const profile: OnboardingProfile = { 
        dateOfBirth: new Date('2010-01-01'), // 13-14 years old
        ageVerified: true
      }
      const result = validator.validateProfile(profile)
      
      const guardianError = result.errors.find(e => e.field === 'guardianEmail')
      expect(guardianError).toBeDefined()
      expect(guardianError?.code).toBe('GUARDIAN_EMAIL_REQUIRED')
    })

    it('should validate guardian email format', () => {
      const profile: OnboardingProfile = { 
        dateOfBirth: new Date('2010-01-01'), // 13-14 years old
        ageVerified: true,
        guardianEmail: 'invalid-email'
      }
      const result = validator.validateProfile(profile)
      
      const emailError = result.errors.find(e => e.field === 'guardianEmail')
      expect(emailError).toBeDefined()
      expect(emailError?.code).toBe('GUARDIAN_EMAIL_INVALID')
    })
  })

  describe('Legal Consent Validation', () => {
    it('should require Terms of Service acceptance', () => {
      const profile: OnboardingProfile = {}
      const result = validator.validateProfile(profile)
      
      const tosError = result.errors.find(e => e.field === 'tosAccepted')
      expect(tosError).toBeDefined()
      expect(tosError?.code).toBe('TOS_REQUIRED')
    })

    it('should require Privacy Policy acceptance', () => {
      const profile: OnboardingProfile = { 
        tosAccepted: true
      }
      const result = validator.validateProfile(profile)
      
      const privacyError = result.errors.find(e => e.field === 'privacyAccepted')
      expect(privacyError).toBeDefined()
      expect(privacyError?.code).toBe('PRIVACY_REQUIRED')
    })
  })
})

describe('OnboardingErrorHandler', () => {
  let handler: OnboardingErrorHandler

  beforeEach(() => {
    handler = OnboardingErrorHandler.getInstance()
  })

  describe('Error Classification', () => {
    it('should classify validation errors correctly', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email', code: 'EMAIL_INVALID', severity: 'error' as const, retryable: true },
        { field: 'password', message: 'Weak password', code: 'PASSWORD_WEAK', severity: 'error' as const, retryable: false }
      ]

      const result = handler.handleValidationErrors(validationErrors)
      
      expect(result.criticalErrors).toHaveLength(1)
      expect(result.recoverableErrors).toHaveLength(1)
      expect(result.suggestions).toContain(validationErrors[0].suggestedFix)
    })
  })

  describe('Retry Logic', () => {
    it('should retry operations with exponential backoff', async () => {
      let attempts = 0
      const operation = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      })

      const result = await handler.retryOperation(operation, {
        maxAttempts: 3,
        backoffMs: 100,
        exponentialBackoff: true
      })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(handler.retryOperation(operation, {
        maxAttempts: 2,
        backoffMs: 50,
        exponentialBackoff: false
      })).rejects.toThrow('Persistent failure')

      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('User-Friendly Messages', () => {
    it('should create user-friendly messages for different error types', () => {
      const networkError: OnboardingError = {
        type: 'network',
        message: 'Connection failed',
        retryable: true,
        timestamp: new Date()
      }

      const validationError: OnboardingError = {
        type: 'validation',
        message: 'Invalid data',
        retryable: true,
        timestamp: new Date()
      }

      const networkMessage = handler.createUserFriendlyMessage(networkError)
      const validationMessage = handler.createUserFriendlyMessage(validationError)

      expect(networkMessage).toContain('connect')
      expect(validationMessage).toContain('check')
    })
  })

  describe('Recovery Actions', () => {
    it('should provide appropriate recovery actions for different error types', () => {
      const networkError: OnboardingError = {
        type: 'network',
        message: 'Connection failed',
        retryable: true,
        timestamp: new Date()
      }

      const actions = handler.getRecoveryActions(networkError)
      
      expect(actions).toContain('Check your internet connection')
      expect(actions).toContain('Try again in a few moments')
    })
  })

  describe('Error Recoverability', () => {
    it('should correctly identify recoverable errors', () => {
      const recoverableError: OnboardingError = {
        type: 'network',
        message: 'Connection failed',
        retryable: true,
        timestamp: new Date()
      }

      const nonRecoverableError: OnboardingError = {
        type: 'authentication',
        message: 'Invalid credentials',
        retryable: false,
        timestamp: new Date()
      }

      expect(handler.isRecoverable(recoverableError)).toBe(true)
      expect(handler.isRecoverable(nonRecoverableError)).toBe(false)
    })
  })
})

describe('Singleton Instances', () => {
  it('should return the same instance for ProfileValidator', () => {
    const instance1 = ProfileValidator.getInstance()
    const instance2 = ProfileValidator.getInstance()
    
    expect(instance1).toBe(instance2)
  })

  it('should return the same instance for OnboardingErrorHandler', () => {
    const instance1 = OnboardingErrorHandler.getInstance()
    const instance2 = OnboardingErrorHandler.getInstance()
    
    expect(instance1).toBe(instance2)
  })

  it('should export singleton instances', () => {
    expect(profileValidator).toBe(ProfileValidator.getInstance())
    expect(errorHandler).toBe(OnboardingErrorHandler.getInstance())
  })
})