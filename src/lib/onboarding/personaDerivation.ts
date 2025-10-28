import type { AthleteDNA, AITone } from '../../types/onboarding'

/**
 * Persona types derived from AthleteDNA responses
 */
export type PersonaType = 'Competitor' | 'Strategist' | 'Motivator' | 'Steady'

/**
 * Persona mapping interface
 */
export interface PersonaMapping {
  personaType: PersonaType
  derivedFrom: AthleteDNA
  recommendedTone: AITone
  insightStyle: InsightStyle
  characteristics: string[]
  strengths: string[]
  growthAreas: string[]
}

/**
 * Insight style preferences
 */
export type InsightStyle = 
  | 'challenge-focused'    // Direct challenges and competitive comparisons
  | 'data-driven'         // Statistical analysis and trends
  | 'encouragement-based' // Positive reinforcement and motivation
  | 'steady-progress'     // Consistent improvement tracking

/**
 * Derive athlete persona from AthleteDNA responses
 */
export function derivePersona(dna: AthleteDNA): PersonaMapping {
  // Competitor: High competitiveness + high confidence
  if (dna.competitiveness === 'high' && dna.confidence === 'high') {
    return {
      personaType: 'Competitor',
      derivedFrom: dna,
      recommendedTone: 'hype',
      insightStyle: 'challenge-focused',
      characteristics: [
        'Thrives on competition and challenges',
        'Confident in abilities and decision-making',
        'Motivated by winning and being the best',
        'Responds well to high-energy communication'
      ],
      strengths: [
        'Natural leadership in competitive situations',
        'High self-belief drives performance',
        'Pushes teammates to higher levels',
        'Performs well under pressure'
      ],
      growthAreas: [
        'May need help handling losses constructively',
        'Could benefit from patience with skill development',
        'Might overlook team dynamics in pursuit of individual success'
      ]
    }
  }

  // Strategist: High coachability + analytical focus + intrinsic motivation
  if (dna.coachability === 'high' && 
      (dna.focusMode === 'steady' || dna.motivation === 'intrinsic')) {
    return {
      personaType: 'Strategist',
      derivedFrom: dna,
      recommendedTone: 'analyst',
      insightStyle: 'data-driven',
      characteristics: [
        'Loves learning and understanding the game deeply',
        'Responds well to detailed feedback and coaching',
        'Motivated by personal improvement and mastery',
        'Prefers systematic approach to skill development'
      ],
      strengths: [
        'Excellent at applying coaching and feedback',
        'Strong game IQ and tactical understanding',
        'Consistent performer who improves steadily',
        'Great at helping teammates understand strategy'
      ],
      growthAreas: [
        'May overthink situations during games',
        'Could benefit from trusting instincts more',
        'Might need encouragement to take risks'
      ]
    }
  }

  // Motivator: Collaborative + high resilience + balanced motivation
  if (dna.competitiveness === 'collaborative' && 
      (dna.resilience === 'high' || dna.motivation === 'balanced')) {
    return {
      personaType: 'Motivator',
      derivedFrom: dna,
      recommendedTone: 'mentor',
      insightStyle: 'encouragement-based',
      characteristics: [
        'Puts team success above individual achievements',
        'Bounces back quickly from setbacks',
        'Motivated by both personal and team growth',
        'Natural encourager and supporter of teammates'
      ],
      strengths: [
        'Excellent team chemistry and leadership',
        'Resilient mindset helps team through tough times',
        'Balances individual and team goals effectively',
        'Creates positive team culture'
      ],
      growthAreas: [
        'May need encouragement to focus on personal stats',
        'Could benefit from being more assertive',
        'Might sacrifice individual development for team'
      ]
    }
  }

  // Steady: Moderate traits across the board + steady focus
  if (dna.focusMode === 'steady' && 
      (dna.confidence === 'moderate' || dna.competitiveness === 'moderate')) {
    return {
      personaType: 'Steady',
      derivedFrom: dna,
      recommendedTone: 'mentor',
      insightStyle: 'steady-progress',
      characteristics: [
        'Consistent and reliable performer',
        'Maintains steady focus throughout games',
        'Balanced approach to competition and improvement',
        'Responds well to supportive, steady guidance'
      ],
      strengths: [
        'Reliable and consistent performance',
        'Good at maintaining composure under pressure',
        'Steady improvement over time',
        'Adaptable to different game situations'
      ],
      growthAreas: [
        'May need encouragement to push comfort zone',
        'Could benefit from more aggressive play at times',
        'Might need help with peak performance moments'
      ]
    }
  }

  // Default fallback based on primary traits
  if (dna.competitiveness === 'high') {
    return createFallbackPersona(dna, 'Competitor', 'hype', 'challenge-focused')
  }
  
  if (dna.coachability === 'high') {
    return createFallbackPersona(dna, 'Strategist', 'analyst', 'data-driven')
  }
  
  if (dna.resilience === 'high') {
    return createFallbackPersona(dna, 'Motivator', 'mentor', 'encouragement-based')
  }

  // Ultimate fallback
  return createFallbackPersona(dna, 'Steady', 'mentor', 'steady-progress')
}

/**
 * Create fallback persona mapping
 */
function createFallbackPersona(
  dna: AthleteDNA, 
  personaType: PersonaType, 
  tone: AITone, 
  style: InsightStyle
): PersonaMapping {
  return {
    personaType,
    derivedFrom: dna,
    recommendedTone: tone,
    insightStyle: style,
    characteristics: [
      'Developing athletic identity',
      'Open to growth and improvement',
      'Building confidence and skills'
    ],
    strengths: [
      'Willingness to learn and improve',
      'Adaptable to different coaching styles',
      'Potential for growth in multiple areas'
    ],
    growthAreas: [
      'Continue developing athletic identity',
      'Build on natural strengths',
      'Explore different aspects of the game'
    ]
  }
}

/**
 * Get AI tone recommendation based on AthleteDNA
 */
export function getRecommendedTone(dna: AthleteDNA): AITone {
  const persona = derivePersona(dna)
  return persona.recommendedTone
}

/**
 * Get insight preferences for AI system
 */
export interface InsightPreferences {
  style: InsightStyle
  frequency: 'high' | 'moderate' | 'low'
  complexity: 'simple' | 'moderate' | 'advanced'
  focusAreas: string[]
}

export function getInsightPreferences(dna: AthleteDNA): InsightPreferences {
  const persona = derivePersona(dna)
  
  // Determine frequency based on coachability and motivation
  let frequency: 'high' | 'moderate' | 'low' = 'moderate'
  if (dna.coachability === 'high' && dna.motivation === 'intrinsic') {
    frequency = 'high'
  } else if (dna.coachability === 'independent') {
    frequency = 'low'
  }

  // Determine complexity based on focus mode and confidence
  let complexity: 'simple' | 'moderate' | 'advanced' = 'moderate'
  if (dna.focusMode === 'intense' && dna.confidence === 'high') {
    complexity = 'advanced'
  } else if (dna.confidence === 'building') {
    complexity = 'simple'
  }

  // Determine focus areas based on persona type
  const focusAreas = getFocusAreas(persona.personaType, dna)

  return {
    style: persona.insightStyle,
    frequency,
    complexity,
    focusAreas
  }
}

/**
 * Get focus areas for insights based on persona and DNA
 */
function getFocusAreas(personaType: PersonaType, dna: AthleteDNA): string[] {
  const baseFocusAreas: Record<PersonaType, string[]> = {
    Competitor: [
      'performance_comparisons',
      'competitive_metrics',
      'goal_achievement',
      'peak_performance'
    ],
    Strategist: [
      'tactical_analysis',
      'skill_development',
      'game_patterns',
      'improvement_trends'
    ],
    Motivator: [
      'team_impact',
      'leadership_moments',
      'positive_trends',
      'encouragement'
    ],
    Steady: [
      'consistent_improvement',
      'steady_progress',
      'balanced_development',
      'reliability_metrics'
    ]
  }

  let focusAreas = [...baseFocusAreas[personaType]]

  // Add DNA-specific focus areas
  if (dna.resilience === 'developing') {
    focusAreas.push('resilience_building')
  }
  
  if (dna.confidence === 'building') {
    focusAreas.push('confidence_boosting')
  }
  
  if (dna.motivation === 'extrinsic') {
    focusAreas.push('recognition_achievements')
  }

  return focusAreas
}

/**
 * Initialize AI personalization profile
 */
export interface AIPersonalizationProfile {
  personaType: PersonaType
  aiTone: AITone
  insightPreferences: InsightPreferences
  characteristics: string[]
  strengths: string[]
  growthAreas: string[]
  derivationTimestamp: Date
}

export function initializeAIPersonalization(dna: AthleteDNA, selectedTone?: AITone): AIPersonalizationProfile {
  const persona = derivePersona(dna)
  const insightPreferences = getInsightPreferences(dna)
  
  return {
    personaType: persona.personaType,
    aiTone: selectedTone || persona.recommendedTone,
    insightPreferences,
    characteristics: persona.characteristics,
    strengths: persona.strengths,
    growthAreas: persona.growthAreas,
    derivationTimestamp: new Date()
  }
}

/**
 * Validate AthleteDNA completeness
 */
export function validateDNACompleteness(dna: Partial<AthleteDNA>): boolean {
  const requiredFields: (keyof AthleteDNA)[] = [
    'motivation',
    'confidence', 
    'focusMode',
    'competitiveness',
    'coachability',
    'resilience'
  ]
  
  return requiredFields.every(field => dna[field] !== undefined)
}

/**
 * Get persona description for UI display
 */
export function getPersonaDescription(personaType: PersonaType): string {
  const descriptions: Record<PersonaType, string> = {
    Competitor: 'You thrive on competition and challenges. You\'re confident, driven, and love to win.',
    Strategist: 'You love learning and understanding the game deeply. You respond well to coaching and data.',
    Motivator: 'You put the team first and bounce back from setbacks. You\'re a natural encourager.',
    Steady: 'You\'re consistent and reliable. You maintain steady focus and improve gradually over time.'
  }
  
  return descriptions[personaType]
}