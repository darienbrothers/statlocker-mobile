/**
 * Firestore document types and interfaces
 * 
 * Defines the structure of documents stored in Firebase Firestore
 * for user profiles, trial management, and onboarding data
 */

import { Timestamp } from 'firebase/firestore'
import { OnboardingProfile, AthleteDNA, AITone, SchoolInfo, ClubInfo } from './onboarding'

// Main user profile document stored in Firestore
export interface FirestoreUserProfile {
  // Identity & Authentication
  id: string
  email: string
  role: 'athlete' | 'coach'
  
  // Demographics
  sport: string
  gender: 'male' | 'female'
  dateOfBirth: Timestamp
  graduationYear: number
  
  // Athletic Information
  position: string
  academicLevel: 'freshman' | 'jv' | 'varsity'
  teamType: 'high_school' | 'club'
  
  // Organizations
  school: FirestoreSchoolInfo
  club?: FirestoreClubInfo
  
  // Goals & Personalization
  goals: FirestoreGoal[]
  athleteDNA: FirestoreAthleteDNA
  aiTone: AITone
  
  // AI Personalization (derived from DNA + tone)
  aiPersonalization?: FirestoreAIPersonalization
  
  // Compliance & Legal
  ageVerified: boolean
  guardianEmail?: string
  consentTimestamp?: Timestamp
  tosAcceptedVersion: string
  privacyAcceptedVersion: string
  benchmarkingConsent: boolean
  
  // Trial & Subscription
  trialStartDate?: Timestamp
  trialStatus: 'active' | 'expired' | 'converted' | 'cancelled'
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'unpaid'
  revenueCatUserId?: string
  
  // Onboarding Progress
  onboardingProgress: FirestoreOnboardingProgress
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  onboardingCompletedAt?: Timestamp
  lastActiveAt: Timestamp
  profileVersion: string
  
  // Analytics & Tracking
  analyticsId?: string
  deviceInfo?: FirestoreDeviceInfo
  
  // Data Management
  dataRetentionConsent: boolean
  dataExportRequested?: Timestamp
  accountDeletionRequested?: Timestamp
}

// Supporting Firestore interfaces
export interface FirestoreSchoolInfo {
  name: string
  city: string
  state: string
  type: 'public' | 'private' | 'charter'
  // Additional fields for future use
  district?: string
  mascot?: string
  colors?: string[]
}

export interface FirestoreClubInfo {
  organization: string
  teamName: string
  league?: string
  // Additional fields for future use
  season?: string
  division?: string
}

export interface FirestoreGoal {
  id: string
  category: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  deadline?: Timestamp
  status: 'active' | 'completed' | 'paused' | 'archived'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FirestoreAthleteDNA {
  motivation: 'intrinsic' | 'extrinsic' | 'balanced'
  confidence: 'high' | 'moderate' | 'building'
  focusMode: 'intense' | 'steady' | 'burst'
  competitiveness: 'high' | 'moderate' | 'collaborative'
  coachability: 'high' | 'moderate' | 'independent'
  resilience: 'high' | 'moderate' | 'developing'
  completedAt: Timestamp
  responses: Record<string, string> // Raw quiz responses
}

export interface FirestoreAIPersonalization {
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
  derivationTimestamp: Timestamp
  lastUpdated: Timestamp
}

export interface FirestoreOnboardingProgress {
  stepNumber: number
  completedSteps: number[]
  startedAt: Timestamp
  completedAt?: Timestamp
  resumeCount: number
  lastResumedAt?: Timestamp
  version: string
}

export interface FirestoreDeviceInfo {
  platform: 'ios' | 'android' | 'web'
  deviceId: string
  appVersion: string
  osVersion: string
  lastSeen: Timestamp
}

// Trial management document (separate collection)
export interface FirestoreTrialInfo {
  userId: string
  status: 'active' | 'expired' | 'converted' | 'cancelled'
  startDate: Timestamp
  endDate: Timestamp
  activatedAt: Timestamp
  revenueCatTransactionId?: string
  conversionDate?: Timestamp
  cancellationDate?: Timestamp
  cancellationReason?: string
  
  // Trial usage tracking
  gamesLogged: number
  aiInsightsGenerated: number
  goalsCreated: number
  lastActivityAt: Timestamp
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Analytics events document (separate collection)
export interface FirestoreAnalyticsEvent {
  userId: string
  eventType: string
  eventData: Record<string, any>
  timestamp: Timestamp
  sessionId: string
  deviceInfo: FirestoreDeviceInfo
  
  // Event metadata
  createdAt: Timestamp
  processed: boolean
  batchId?: string
}

// Conversion utilities between OnboardingProfile and FirestoreUserProfile
export interface ProfileConversionUtils {
  toFirestore: (profile: OnboardingProfile, userId: string, email: string) => Omit<FirestoreUserProfile, 'id'>
  fromFirestore: (firestoreProfile: FirestoreUserProfile) => OnboardingProfile
  validateFirestoreProfile: (profile: Partial<FirestoreUserProfile>) => string[]
}

// Firestore collection names (constants)
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  TRIALS: 'trials',
  ANALYTICS: 'analytics',
  ONBOARDING_SESSIONS: 'onboarding_sessions',
  GUARDIAN_CONSENTS: 'guardian_consents'
} as const

// Firestore document validation schemas
export interface FirestoreValidationSchema {
  required: string[]
  optional: string[]
  nested: Record<string, FirestoreValidationSchema>
  validators: Record<string, (value: any) => boolean>
}

// Error types for Firestore operations
export interface FirestoreError {
  code: string
  message: string
  operation: 'create' | 'read' | 'update' | 'delete'
  collection: string
  documentId?: string
  retryable: boolean
  timestamp: Timestamp
}

// Batch operation types
export interface FirestoreBatchOperation {
  type: 'create' | 'update' | 'delete'
  collection: string
  documentId: string
  data?: any
}

export interface FirestoreBatchResult {
  success: boolean
  operations: FirestoreBatchOperation[]
  errors: FirestoreError[]
  timestamp: Timestamp
}

// Index configuration for Firestore queries
export interface FirestoreIndexConfig {
  collection: string
  fields: Array<{
    fieldPath: string
    order?: 'asc' | 'desc'
  }>
  queryScope: 'collection' | 'collection-group'
}

// Recommended Firestore indexes for efficient queries
export const RECOMMENDED_INDEXES: FirestoreIndexConfig[] = [
  {
    collection: FIRESTORE_COLLECTIONS.USERS,
    fields: [
      { fieldPath: 'role' },
      { fieldPath: 'createdAt', order: 'desc' }
    ],
    queryScope: 'collection'
  },
  {
    collection: FIRESTORE_COLLECTIONS.USERS,
    fields: [
      { fieldPath: 'trialStatus' },
      { fieldPath: 'trialStartDate', order: 'desc' }
    ],
    queryScope: 'collection'
  },
  {
    collection: FIRESTORE_COLLECTIONS.TRIALS,
    fields: [
      { fieldPath: 'status' },
      { fieldPath: 'endDate', order: 'asc' }
    ],
    queryScope: 'collection'
  },
  {
    collection: FIRESTORE_COLLECTIONS.ANALYTICS,
    fields: [
      { fieldPath: 'userId' },
      { fieldPath: 'timestamp', order: 'desc' }
    ],
    queryScope: 'collection'
  }
]