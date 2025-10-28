import { 
  GRADUATION_YEARS, 
  ACADEMIC_LEVELS, 
  AI_TONES, 
  TEAM_TYPES, 
  GENDERS, 
  ROLES 
} from '../onboarding'
import type { 
  OnboardingProfile, 
  ValidationRule,
  AthleteDNA,
  SchoolInfo,
  ClubInfo,
  GoalOption,
  PositionOption,
  SportOption
} from '../onboarding'

describe('Onboarding Types', () => {
  describe('OnboardingProfile Interface', () => {
    it('should accept valid profile data', () => {
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
          name: 'Test High School',
          city: 'Test City',
          state: 'CA'
        },
        selectedGoals: ['goal1', 'goal2', 'goal3'],
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

      // Type check - if this compiles, the interface is working correctly
      expect(profile.role).toBe('athlete')
      expect(profile.sport).toBe('lacrosse')
      expect(profile.selectedGoals).toHaveLength(3)
    })

    it('should allow partial profile data', () => {
      const partialProfile: Partial<OnboardingProfile> = {
        role: 'athlete',
        sport: 'lacrosse'
      }

      expect(partialProfile.role).toBe('athlete')
      expect(partialProfile.gender).toBeUndefined()
    })
  })

  describe('SchoolInfo Interface', () => {
    it('should accept valid school data', () => {
      const school: SchoolInfo = {
        name: 'Test High School',
        city: 'Test City',
        state: 'CA',
        type: 'public'
      }

      expect(school.name).toBe('Test High School')
      expect(school.type).toBe('public')
    })

    it('should work without optional type field', () => {
      const school: SchoolInfo = {
        name: 'Test High School',
        city: 'Test City',
        state: 'CA'
      }

      expect(school.type).toBeUndefined()
    })
  })

  describe('ClubInfo Interface', () => {
    it('should accept valid club data', () => {
      const club: ClubInfo = {
        organization: 'Test Club',
        teamName: 'Test Team',
        league: 'Test League'
      }

      expect(club.organization).toBe('Test Club')
      expect(club.league).toBe('Test League')
    })
  })

  describe('AthleteDNA Interface', () => {
    it('should accept valid DNA data', () => {
      const dna: AthleteDNA = {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'intense',
        competitiveness: 'high',
        coachability: 'high',
        resilience: 'high',
        completedAt: new Date()
      }

      expect(dna.motivation).toBe('intrinsic')
      expect(dna.completedAt).toBeInstanceOf(Date)
    })

    it('should enforce valid enum values', () => {
      // This test ensures TypeScript compilation catches invalid values
      const validMotivation: AthleteDNA['motivation'] = 'intrinsic'
      const validConfidence: AthleteDNA['confidence'] = 'high'
      const validFocus: AthleteDNA['focusMode'] = 'intense'

      expect(validMotivation).toBe('intrinsic')
      expect(validConfidence).toBe('high')
      expect(validFocus).toBe('intense')
    })
  })

  describe('ValidationRule Interface', () => {
    it('should accept valid validation rules', () => {
      const rule: ValidationRule = {
        field: 'email',
        required: true,
        minLength: 5,
        maxLength: 100,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value: string) => {
          return value.includes('@') ? null : 'Must contain @'
        }
      }

      expect(rule.field).toBe('email')
      expect(rule.required).toBe(true)
      expect(rule.custom?.('test@example.com')).toBeNull()
      expect(rule.custom?.('invalid')).toBe('Must contain @')
    })

    it('should work with minimal rule definition', () => {
      const rule: ValidationRule = {
        field: 'name'
      }

      expect(rule.field).toBe('name')
      expect(rule.required).toBeUndefined()
    })
  })

  describe('GoalOption Interface', () => {
    it('should accept valid goal data', () => {
      const goal: GoalOption = {
        id: 'shooting-accuracy',
        category: 'shooting',
        title: 'Improve Shooting Accuracy',
        description: 'Increase shooting accuracy to 75%',
        targetValue: 75,
        unit: 'percentage',
        positionSpecific: ['attacker', 'midfielder']
      }

      expect(goal.id).toBe('shooting-accuracy')
      expect(goal.positionSpecific).toContain('attacker')
    })
  })

  describe('PositionOption Interface', () => {
    it('should accept valid position data', () => {
      const position: PositionOption = {
        id: 'midfielder',
        name: 'Midfielder',
        sport: 'lacrosse',
        gender: 'male',
        description: 'Plays both offense and defense',
        statCategories: ['shooting', 'passing', 'defense']
      }

      expect(position.name).toBe('Midfielder')
      expect(position.statCategories).toContain('shooting')
    })
  })

  describe('SportOption Interface', () => {
    it('should accept valid sport data', () => {
      const sport: SportOption = {
        id: 'lacrosse',
        name: 'Lacrosse',
        description: 'Fast-paced team sport',
        positions: [],
        supportedGenders: ['male', 'female']
      }

      expect(sport.name).toBe('Lacrosse')
      expect(sport.supportedGenders).toEqual(['male', 'female'])
    })
  })

  describe('Constants', () => {
    it('should have correct graduation years', () => {
      expect(GRADUATION_YEARS).toEqual([2025, 2026, 2027, 2028, 2029])
      expect(GRADUATION_YEARS).toHaveLength(5)
    })

    it('should have correct academic levels', () => {
      expect(ACADEMIC_LEVELS).toEqual(['freshman', 'jv', 'varsity'])
      expect(ACADEMIC_LEVELS).toHaveLength(3)
    })

    it('should have correct AI tones', () => {
      expect(AI_TONES).toEqual(['hype', 'mentor', 'analyst', 'captain'])
      expect(AI_TONES).toHaveLength(4)
    })

    it('should have correct team types', () => {
      expect(TEAM_TYPES).toEqual(['high_school', 'club'])
      expect(TEAM_TYPES).toHaveLength(2)
    })

    it('should have correct genders', () => {
      expect(GENDERS).toEqual(['male', 'female'])
      expect(GENDERS).toHaveLength(2)
    })

    it('should have correct roles', () => {
      expect(ROLES).toEqual(['athlete', 'coach'])
      expect(ROLES).toHaveLength(2)
    })
  })

  describe('Type Guards and Validation', () => {
    it('should validate graduation year type', () => {
      const validYear = 2025
      const invalidYear = 2030

      // Type assertion tests
      expect(GRADUATION_YEARS.includes(validYear as any)).toBe(true)
      expect(GRADUATION_YEARS.includes(invalidYear as any)).toBe(false)
    })

    it('should validate AI tone type', () => {
      const validTone = 'hype'
      const invalidTone = 'invalid'

      expect(AI_TONES.includes(validTone as any)).toBe(true)
      expect(AI_TONES.includes(invalidTone as any)).toBe(false)
    })

    it('should validate academic level type', () => {
      const validLevel = 'varsity'
      const invalidLevel = 'senior'

      expect(ACADEMIC_LEVELS.includes(validLevel as any)).toBe(true)
      expect(ACADEMIC_LEVELS.includes(invalidLevel as any)).toBe(false)
    })
  })

  describe('Complex Type Combinations', () => {
    it('should handle nested optional properties correctly', () => {
      const profile: OnboardingProfile = {
        role: 'athlete',
        school: {
          name: 'Test School',
          city: 'Test City',
          state: 'CA'
        }
      }

      // Should be able to access nested properties
      expect(profile.school?.name).toBe('Test School')
      expect(profile.club?.organization).toBeUndefined()
    })

    it('should handle arrays and sets correctly', () => {
      const profile: OnboardingProfile = {
        selectedGoals: ['goal1', 'goal2', 'goal3']
      }

      expect(Array.isArray(profile.selectedGoals)).toBe(true)
      expect(profile.selectedGoals?.length).toBe(3)
    })

    it('should handle date objects correctly', () => {
      const profile: OnboardingProfile = {
        dateOfBirth: new Date('2006-01-01'),
        onboardingStarted: new Date(),
        dna: {
          motivation: 'intrinsic',
          confidence: 'high',
          focusMode: 'intense',
          competitiveness: 'high',
          coachability: 'high',
          resilience: 'high',
          completedAt: new Date()
        }
      }

      expect(profile.dateOfBirth).toBeInstanceOf(Date)
      expect(profile.dna?.completedAt).toBeInstanceOf(Date)
    })
  })
})