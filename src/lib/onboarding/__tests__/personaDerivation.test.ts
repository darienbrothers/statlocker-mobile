// Mock React Native environment
global.__DEV__ = true

import {
  derivePersona,
  getRecommendedTone,
  getInsightPreferences,
  initializeAIPersonalization,
  validateDNACompleteness,
  getPersonaDescription,
  type PersonaType
} from '../personaDerivation'
import type { AthleteDNA } from '../../../types/onboarding'

describe('PersonaDerivation', () => {
  const completeDNA: AthleteDNA = {
    motivation: 'intrinsic',
    confidence: 'high',
    focusMode: 'steady',
    competitiveness: 'high',
    coachability: 'high',
    resilience: 'high',
    completedAt: new Date()
  }

  describe('derivePersona', () => {
    it('should derive Competitor persona correctly', () => {
      const competitorDNA: AthleteDNA = {
        ...completeDNA,
        competitiveness: 'high',
        confidence: 'high'
      }

      const persona = derivePersona(competitorDNA)

      expect(persona.personaType).toBe('Competitor')
      expect(persona.recommendedTone).toBe('hype')
      expect(persona.insightStyle).toBe('challenge-focused')
      expect(persona.characteristics).toContain('Thrives on competition and challenges')
      expect(persona.strengths).toContain('Natural leadership in competitive situations')
      expect(persona.growthAreas).toContain('May need help handling losses constructively')
    })

    it('should derive Strategist persona correctly', () => {
      const strategistDNA: AthleteDNA = {
        ...completeDNA,
        coachability: 'high',
        focusMode: 'steady',
        motivation: 'intrinsic'
      }

      const persona = derivePersona(strategistDNA)

      expect(persona.personaType).toBe('Strategist')
      expect(persona.recommendedTone).toBe('analyst')
      expect(persona.insightStyle).toBe('data-driven')
      expect(persona.characteristics).toContain('Loves learning and understanding the game deeply')
      expect(persona.strengths).toContain('Excellent at applying coaching and feedback')
    })

    it('should derive Motivator persona correctly', () => {
      const motivatorDNA: AthleteDNA = {
        ...completeDNA,
        competitiveness: 'collaborative',
        resilience: 'high',
        motivation: 'balanced'
      }

      const persona = derivePersona(motivatorDNA)

      expect(persona.personaType).toBe('Motivator')
      expect(persona.recommendedTone).toBe('mentor')
      expect(persona.insightStyle).toBe('encouragement-based')
      expect(persona.characteristics).toContain('Puts team success above individual achievements')
      expect(persona.strengths).toContain('Excellent team chemistry and leadership')
    })

    it('should derive Steady persona correctly', () => {
      const steadyDNA: AthleteDNA = {
        ...completeDNA,
        focusMode: 'steady',
        confidence: 'moderate',
        competitiveness: 'moderate'
      }

      const persona = derivePersona(steadyDNA)

      expect(persona.personaType).toBe('Steady')
      expect(persona.recommendedTone).toBe('mentor')
      expect(persona.insightStyle).toBe('steady-progress')
      expect(persona.characteristics).toContain('Consistent and reliable performer')
      expect(persona.strengths).toContain('Reliable and consistent performance')
    })

    it('should provide fallback persona for edge cases', () => {
      const edgeCaseDNA: AthleteDNA = {
        motivation: 'extrinsic',
        confidence: 'building',
        focusMode: 'burst',
        competitiveness: 'moderate',
        coachability: 'independent',
        resilience: 'developing',
        completedAt: new Date()
      }

      const persona = derivePersona(edgeCaseDNA)

      expect(['Competitor', 'Strategist', 'Motivator', 'Steady']).toContain(persona.personaType)
      expect(['hype', 'mentor', 'analyst', 'captain']).toContain(persona.recommendedTone)
      expect(persona.characteristics).toBeDefined()
      expect(persona.strengths).toBeDefined()
      expect(persona.growthAreas).toBeDefined()
    })
  })

  describe('getRecommendedTone', () => {
    it('should recommend hype for competitive confident athletes', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        competitiveness: 'high',
        confidence: 'high'
      }

      const tone = getRecommendedTone(dna)
      expect(tone).toBe('hype')
    })

    it('should recommend analyst for coachable intrinsic athletes', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        coachability: 'high',
        motivation: 'intrinsic'
      }

      const tone = getRecommendedTone(dna)
      expect(tone).toBe('analyst')
    })

    it('should recommend mentor for collaborative resilient athletes', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        competitiveness: 'collaborative',
        resilience: 'high'
      }

      const tone = getRecommendedTone(dna)
      expect(tone).toBe('mentor')
    })
  })

  describe('getInsightPreferences', () => {
    it('should set high frequency for highly coachable intrinsic athletes', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        coachability: 'high',
        motivation: 'intrinsic'
      }

      const preferences = getInsightPreferences(dna)
      expect(preferences.frequency).toBe('high')
    })

    it('should set low frequency for independent athletes', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        coachability: 'independent'
      }

      const preferences = getInsightPreferences(dna)
      expect(preferences.frequency).toBe('low')
    })

    it('should set advanced complexity for intense confident athletes', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        focusMode: 'intense',
        confidence: 'high'
      }

      const preferences = getInsightPreferences(dna)
      expect(preferences.complexity).toBe('advanced')
    })

    it('should set simple complexity for building confidence athletes', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        confidence: 'building'
      }

      const preferences = getInsightPreferences(dna)
      expect(preferences.complexity).toBe('simple')
    })

    it('should include appropriate focus areas', () => {
      const competitorDNA: AthleteDNA = {
        ...completeDNA,
        competitiveness: 'high',
        confidence: 'high'
      }

      const preferences = getInsightPreferences(competitorDNA)
      expect(preferences.focusAreas).toContain('performance_comparisons')
      expect(preferences.focusAreas).toContain('competitive_metrics')
    })

    it('should add resilience building for developing resilience', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        resilience: 'developing'
      }

      const preferences = getInsightPreferences(dna)
      expect(preferences.focusAreas).toContain('resilience_building')
    })

    it('should add confidence boosting for building confidence', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        confidence: 'building'
      }

      const preferences = getInsightPreferences(dna)
      expect(preferences.focusAreas).toContain('confidence_boosting')
    })
  })

  describe('initializeAIPersonalization', () => {
    it('should create complete AI personalization profile', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        competitiveness: 'high',
        confidence: 'high'
      }

      const profile = initializeAIPersonalization(dna, 'hype')

      expect(profile.personaType).toBe('Competitor')
      expect(profile.aiTone).toBe('hype')
      expect(profile.insightPreferences).toBeDefined()
      expect(profile.insightPreferences.style).toBe('challenge-focused')
      expect(profile.characteristics).toBeDefined()
      expect(profile.strengths).toBeDefined()
      expect(profile.growthAreas).toBeDefined()
      expect(profile.derivationTimestamp).toBeInstanceOf(Date)
    })

    it('should use recommended tone when none provided', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        coachability: 'high',
        motivation: 'intrinsic'
      }

      const profile = initializeAIPersonalization(dna)

      expect(profile.aiTone).toBe('analyst') // Should be recommended tone
    })

    it('should override recommended tone when provided', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        coachability: 'high',
        motivation: 'intrinsic'
      }

      const profile = initializeAIPersonalization(dna, 'captain')

      expect(profile.aiTone).toBe('captain') // Should use provided tone
    })
  })

  describe('validateDNACompleteness', () => {
    it('should return true for complete DNA', () => {
      const isComplete = validateDNACompleteness(completeDNA)
      expect(isComplete).toBe(true)
    })

    it('should return false for incomplete DNA', () => {
      const incompleteDNA = {
        motivation: 'intrinsic',
        confidence: 'high'
        // Missing other required fields
      }

      const isComplete = validateDNACompleteness(incompleteDNA)
      expect(isComplete).toBe(false)
    })

    it('should return false for empty DNA', () => {
      const isComplete = validateDNACompleteness({})
      expect(isComplete).toBe(false)
    })

    it('should return false when any required field is undefined', () => {
      const partialDNA = {
        ...completeDNA,
        resilience: undefined
      }

      const isComplete = validateDNACompleteness(partialDNA)
      expect(isComplete).toBe(false)
    })
  })

  describe('getPersonaDescription', () => {
    it('should return correct description for each persona type', () => {
      const personas: PersonaType[] = ['Competitor', 'Strategist', 'Motivator', 'Steady']
      
      personas.forEach(persona => {
        const description = getPersonaDescription(persona)
        expect(description).toBeDefined()
        expect(description.length).toBeGreaterThan(0)
        expect(typeof description).toBe('string')
      })
    })

    it('should return specific descriptions for known personas', () => {
      expect(getPersonaDescription('Competitor')).toContain('competition')
      expect(getPersonaDescription('Strategist')).toContain('learning')
      expect(getPersonaDescription('Motivator')).toContain('team')
      expect(getPersonaDescription('Steady')).toContain('consistent')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle DNA with all minimum values', () => {
      const minDNA: AthleteDNA = {
        motivation: 'intrinsic',
        confidence: 'building',
        focusMode: 'burst',
        competitiveness: 'collaborative',
        coachability: 'independent',
        resilience: 'developing',
        completedAt: new Date()
      }

      const persona = derivePersona(minDNA)
      expect(persona).toBeDefined()
      expect(persona.personaType).toBeDefined()
      expect(persona.recommendedTone).toBeDefined()
    })

    it('should handle DNA with all maximum values', () => {
      const maxDNA: AthleteDNA = {
        motivation: 'extrinsic',
        confidence: 'high',
        focusMode: 'intense',
        competitiveness: 'high',
        coachability: 'high',
        resilience: 'high',
        completedAt: new Date()
      }

      const persona = derivePersona(maxDNA)
      expect(persona).toBeDefined()
      expect(persona.personaType).toBeDefined()
      expect(persona.recommendedTone).toBeDefined()
    })

    it('should provide consistent results for same DNA input', () => {
      const dna: AthleteDNA = {
        ...completeDNA,
        competitiveness: 'high',
        confidence: 'high'
      }

      const persona1 = derivePersona(dna)
      const persona2 = derivePersona(dna)

      expect(persona1.personaType).toBe(persona2.personaType)
      expect(persona1.recommendedTone).toBe(persona2.recommendedTone)
      expect(persona1.insightStyle).toBe(persona2.insightStyle)
    })
  })
})