import { renderHook, act } from '@testing-library/react-native'
import { useStepValidation } from '../useStepValidation'
import { useOnboardingStore } from '@/src/stores/onboardingStore'
import type { OnboardingProfile } from '@/src/types/onboarding'

describe('useStepValidation', () => {
  beforeEach(() => {
    // Reset store state before each test
    useOnboardingStore.getState().resetOnboarding()
  })

  describe('Step 1 Validation (Role Selection)', () => {
    it('should be invalid when no role is selected', () => {
      const { result } = renderHook(() => useStepValidation(1))
      
      expect(result.current.isStepValid).toBe(false)
      expect(result.current.stepErrors).toHaveLength(0) // No errors until validation is run
    })

    it('should be valid when role is selected', () => {
      // Set up profile with role
      act(() => {
        useOnboardingStore.getState().updateProfile({ role: 'athlete' })
      })

      const { result } = renderHook(() => useStepValidation(1))
      
      expect(result.current.isStepValid).toBe(true)
    })

    it('should validate profile data correctly', () => {
      const { result } = renderHook(() => useStepValidation(1))
      
      // Test invalid profile
      const invalidProfile: Partial<OnboardingProfile> = {}
      const errors = result.current.validateStep(invalidProfile)
      expect(errors).toContain('role is required')
      
      // Test valid profile
      const validProfile: Partial<OnboardingProfile> = { role: 'athlete' }
      const noErrors = result.current.validateStep(validProfile)
      expect(noErrors).toHaveLength(0)
    })
  })

  describe('Step 2 Validation (Sport & Demographics)', () => {
    it('should be invalid when required fields are missing', () => {
      const { result } = renderHook(() => useStepValidation(2))
      
      expect(result.current.isStepValid).toBe(false)
    })

    it('should be valid when all required fields are present', () => {
      act(() => {
        useOnboardingStore.getState().updateProfile({
          sport: 'lacrosse',
          gender: 'male',
          dateOfBirth: new Date('2006-01-01'),
          graduationYear: 2025
        })
      })

      const { result } = renderHook(() => useStepValidation(2))
      
      expect(result.current.isStepValid).toBe(true)
    })

    it('should validate each required field', () => {
      const { result } = renderHook(() => useStepValidation(2))
      
      const testCases = [
        { profile: {}, expectedErrors: 4 }, // All fields missing
        { profile: { sport: 'lacrosse' }, expectedErrors: 3 },
        { profile: { sport: 'lacrosse', gender: 'male' }, expectedErrors: 2 },
        { 
          profile: { 
            sport: 'lacrosse', 
            gender: 'male', 
            dateOfBirth: new Date('2006-01-01') 
          }, 
          expectedErrors: 1 
        },
        { 
          profile: { 
            sport: 'lacrosse', 
            gender: 'male', 
            dateOfBirth: new Date('2006-01-01'),
            graduationYear: 2025
          }, 
          expectedErrors: 0 
        }
      ]

      testCases.forEach(({ profile, expectedErrors }) => {
        const errors = result.current.validateStep(profile)
        expect(errors).toHaveLength(expectedErrors)
      })
    })
  })

  describe('Step 3 Validation (Position & Level)', () => {
    it('should validate position and academic level', () => {
      const { result } = renderHook(() => useStepValidation(3))
      
      // Invalid - missing both fields
      let errors = result.current.validateStep({})
      expect(errors).toContain('position is required')
      expect(errors).toContain('academicLevel is required')
      
      // Valid - both fields present
      errors = result.current.validateStep({
        position: 'midfielder',
        academicLevel: 'varsity'
      })
      expect(errors).toHaveLength(0)
    })
  })

  describe('Step 4 Validation (Team Details)', () => {
    it('should validate school information', () => {
      const { result } = renderHook(() => useStepValidation(4))
      
      // Invalid - missing school info
      let errors = result.current.validateStep({
        teamType: 'high_school'
      })
      expect(errors.length).toBeGreaterThan(0)
      
      // Valid - complete school info
      errors = result.current.validateStep({
        teamType: 'high_school',
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA'
        }
      })
      expect(errors).toHaveLength(0)
    })

    it('should validate club information when team type is club', () => {
      const { result } = renderHook(() => useStepValidation(4))
      
      // Should not require club info for high school
      let errors = result.current.validateStep({
        teamType: 'high_school',
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA'
        }
      })
      expect(errors).toHaveLength(0)
      
      // Should require club info when club is provided but incomplete
      errors = result.current.validateStep({
        teamType: 'club',
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA'
        },
        club: {
          organization: 'Test Club'
          // Missing teamName
        }
      })
      expect(errors.some(error => error.includes('club team name'))).toBe(true)
    })
  })

  describe('Step 5 Validation (Goal Selection)', () => {
    it('should require exactly 3 goals', () => {
      const { result } = renderHook(() => useStepValidation(5))
      
      // Invalid - no goals
      let errors = result.current.validateStep({})
      expect(errors.some(error => error.includes('exactly 3 goals'))).toBe(true)
      
      // Invalid - too few goals
      errors = result.current.validateStep({
        selectedGoals: ['goal1', 'goal2']
      })
      expect(errors.some(error => error.includes('exactly 3 goals'))).toBe(true)
      
      // Invalid - too many goals
      errors = result.current.validateStep({
        selectedGoals: ['goal1', 'goal2', 'goal3', 'goal4']
      })
      expect(errors.some(error => error.includes('exactly 3 goals'))).toBe(true)
      
      // Valid - exactly 3 goals
      errors = result.current.validateStep({
        selectedGoals: ['goal1', 'goal2', 'goal3']
      })
      expect(errors).toHaveLength(0)
    })
  })

  describe('Step 6 Validation (AthleteDNA)', () => {
    it('should validate all DNA questions are answered', () => {
      const { result } = renderHook(() => useStepValidation(6))
      
      // Invalid - no DNA data
      let errors = result.current.validateStep({})
      expect(errors.length).toBe(6) // All 6 DNA fields required
      
      // Partially valid
      errors = result.current.validateStep({
        dna: {
          motivation: 'intrinsic',
          confidence: 'high',
          focusMode: 'intense'
          // Missing other fields
        }
      })
      expect(errors.length).toBe(3) // 3 missing fields
      
      // Valid - all DNA fields present
      errors = result.current.validateStep({
        dna: {
          motivation: 'intrinsic',
          confidence: 'high',
          focusMode: 'intense',
          competitiveness: 'high',
          coachability: 'high',
          resilience: 'high'
        }
      })
      expect(errors).toHaveLength(0)
    })
  })

  describe('Step 7 Validation (AI Tone)', () => {
    it('should validate AI tone selection', () => {
      const { result } = renderHook(() => useStepValidation(7))
      
      // Invalid - no tone selected
      let errors = result.current.validateStep({})
      expect(errors).toContain('aiTone is required')
      
      // Valid - tone selected
      errors = result.current.validateStep({
        aiTone: 'hype'
      })
      expect(errors).toHaveLength(0)
    })
  })

  describe('Step 8 Validation (Age Verification)', () => {
    it('should validate age verification', () => {
      const { result } = renderHook(() => useStepValidation(8))
      
      // Invalid - no age verification
      let errors = result.current.validateStep({})
      expect(errors.some(error => error.includes('Age verification'))).toBe(true)
      
      // Valid - age verified
      errors = result.current.validateStep({
        ageVerified: true
      })
      expect(errors).toHaveLength(0)
    })

    it('should require guardian email for minors', () => {
      const { result } = renderHook(() => useStepValidation(8))
      
      // 14-year-old should need guardian email
      const errors = result.current.validateStep({
        ageVerified: true,
        dateOfBirth: new Date(Date.now() - 14 * 365 * 24 * 60 * 60 * 1000) // 14 years ago
      })
      expect(errors.some(error => error.includes('Guardian email'))).toBe(true)
      
      // With guardian email should be valid
      const validErrors = result.current.validateStep({
        ageVerified: true,
        dateOfBirth: new Date(Date.now() - 14 * 365 * 24 * 60 * 60 * 1000),
        guardianEmail: 'parent@example.com'
      })
      expect(validErrors).toHaveLength(0)
    })
  })

  describe('Step 9 Validation (Legal Consent)', () => {
    it('should validate legal consent requirements', () => {
      const { result } = renderHook(() => useStepValidation(9))
      
      // Invalid - no consent
      let errors = result.current.validateStep({})
      expect(errors).toContain('You must accept the Terms of Service')
      expect(errors).toContain('You must accept the Privacy Policy')
      
      // Valid - both consents given
      errors = result.current.validateStep({
        tosAccepted: true,
        privacyAccepted: true
      })
      expect(errors).toHaveLength(0)
      
      // Benchmarking consent is optional
      errors = result.current.validateStep({
        tosAccepted: true,
        privacyAccepted: true,
        benchmarkingConsent: false
      })
      expect(errors).toHaveLength(0)
    })
  })

  describe('Nested Value Access', () => {
    it('should handle nested object validation correctly', () => {
      const { result } = renderHook(() => useStepValidation(4))
      
      const profileWithNestedData = {
        teamType: 'high_school' as const,
        school: {
          name: 'Test School',
          city: 'Test City',
          state: 'CA'
        }
      }
      
      const errors = result.current.validateStep(profileWithNestedData)
      expect(errors).toHaveLength(0)
    })

    it('should handle missing nested objects gracefully', () => {
      const { result } = renderHook(() => useStepValidation(4))
      
      const profileWithoutSchool = {
        teamType: 'high_school' as const
        // Missing school object
      }
      
      const errors = result.current.validateStep(profileWithoutSchool)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(error => error.includes('school'))).toBe(true)
    })
  })

  describe('Real-time Validation Updates', () => {
    it('should update validation when profile changes', () => {
      const { result } = renderHook(() => useStepValidation(1))
      
      // Initially invalid
      expect(result.current.isStepValid).toBe(false)
      
      // Update profile
      act(() => {
        useOnboardingStore.getState().updateProfile({ role: 'athlete' })
      })
      
      // Should now be valid
      expect(result.current.isStepValid).toBe(true)
    })

    it('should reflect validation errors from store', () => {
      const { result } = renderHook(() => useStepValidation(1))
      
      // Set validation errors in store
      act(() => {
        useOnboardingStore.getState().setValidationErrors(1, ['Test error'])
      })
      
      expect(result.current.stepErrors).toContain('Test error')
      
      // Clear errors
      act(() => {
        useOnboardingStore.getState().clearValidationErrors(1)
      })
      
      expect(result.current.stepErrors).toHaveLength(0)
    })
  })
})