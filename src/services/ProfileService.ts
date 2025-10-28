/**
 * Profile Service
 * 
 * Handles Firestore operations for user profiles including creation,
 * updates, validation, and error handling with retry mechanisms
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  FirestoreError as FirebaseFirestoreError
} from 'firebase/firestore'
import { getFirebaseFirestore } from '../lib/firebase'
import { OnboardingProfile } from '../types/onboarding'
import {
  FirestoreUserProfile,
  FirestoreTrialInfo,
  FirestoreError,
  FirestoreBatchOperation,
  FirestoreBatchResult,
  FIRESTORE_COLLECTIONS
} from '../types/firestore'

export class ProfileService {
  private firestore = getFirebaseFirestore()
  private maxRetries = 3
  private retryDelay = 1000 // 1 second base delay

  /**
   * Convert OnboardingProfile to FirestoreUserProfile
   */
  private toFirestoreProfile(
    profile: OnboardingProfile,
    userId: string,
    email: string
  ): Omit<FirestoreUserProfile, 'id'> {
    const now = serverTimestamp() as Timestamp

    return {
      email,
      role: profile.role!,
      
      // Demographics
      sport: profile.sport!,
      gender: profile.gender!,
      dateOfBirth: Timestamp.fromDate(profile.dateOfBirth!),
      graduationYear: profile.graduationYear!,
      
      // Athletic Information
      position: profile.position!,
      academicLevel: profile.academicLevel!,
      teamType: profile.teamType!,
      
      // Organizations
      school: {
        name: profile.school!.name,
        city: profile.school!.city,
        state: profile.school!.state,
        type: profile.school!.type || 'public'
      },
      club: profile.club ? {
        organization: profile.club.organization,
        teamName: profile.club.teamName,
        league: profile.club.league
      } : undefined,
      
      // Goals & Personalization
      goals: (profile.selectedGoals || []).map((goalId, index) => ({
        id: goalId,
        category: 'performance', // Default category
        title: goalId, // Will be enriched later
        description: '',
        targetValue: 0,
        currentValue: 0,
        unit: 'count',
        status: 'active' as const,
        createdAt: now,
        updatedAt: now
      })),
      
      athleteDNA: {
        motivation: profile.dna!.motivation,
        confidence: profile.dna!.confidence,
        focusMode: profile.dna!.focusMode,
        competitiveness: profile.dna!.competitiveness,
        coachability: profile.dna!.coachability,
        resilience: profile.dna!.resilience,
        completedAt: profile.dna!.completedAt ? Timestamp.fromDate(profile.dna!.completedAt) : now,
        responses: {} // Will be populated from actual quiz responses
      },
      
      aiTone: profile.aiTone!,
      
      // AI Personalization (if derived)
      aiPersonalization: profile.aiPersonalization ? {
        personaType: profile.aiPersonalization.personaType,
        aiTone: profile.aiPersonalization.aiTone,
        insightPreferences: profile.aiPersonalization.insightPreferences,
        characteristics: profile.aiPersonalization.characteristics,
        strengths: profile.aiPersonalization.strengths,
        growthAreas: profile.aiPersonalization.growthAreas,
        derivationTimestamp: Timestamp.fromDate(profile.aiPersonalization.derivationTimestamp),
        lastUpdated: now
      } : undefined,
      
      // Compliance & Legal
      ageVerified: profile.ageVerified || false,
      guardianEmail: profile.guardianEmail,
      consentTimestamp: profile.consentTimestamp ? Timestamp.fromDate(profile.consentTimestamp) : undefined,
      tosAcceptedVersion: '1.0', // Current version
      privacyAcceptedVersion: '1.0', // Current version
      benchmarkingConsent: profile.benchmarkingConsent || false,
      
      // Trial & Subscription (initialized)
      trialStatus: 'active' as const,
      subscriptionStatus: undefined,
      revenueCatUserId: userId,
      
      // Onboarding Progress
      onboardingProgress: {
        stepNumber: 10, // Completed all steps
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        startedAt: profile.onboardingStarted ? Timestamp.fromDate(profile.onboardingStarted) : now,
        completedAt: now,
        resumeCount: 0,
        version: '1.0'
      },
      
      // Metadata
      createdAt: now,
      updatedAt: now,
      onboardingCompletedAt: now,
      lastActiveAt: now,
      profileVersion: '1.0',
      
      // Data Management
      dataRetentionConsent: true
    }
  }

  /**
   * Validate profile data before Firestore operations
   */
  private validateProfile(profile: Partial<FirestoreUserProfile>): string[] {
    const errors: string[] = []
    
    // Required fields validation
    const requiredFields = [
      'email', 'role', 'sport', 'gender', 'dateOfBirth', 'graduationYear',
      'position', 'academicLevel', 'teamType', 'school', 'goals', 'athleteDNA',
      'aiTone', 'ageVerified', 'tosAcceptedVersion', 'privacyAcceptedVersion'
    ]
    
    for (const field of requiredFields) {
      if (!profile[field as keyof FirestoreUserProfile]) {
        errors.push(`Missing required field: ${field}`)
      }
    }
    
    // Email validation
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.push('Invalid email format')
    }
    
    // Role validation
    if (profile.role && !['athlete', 'coach'].includes(profile.role)) {
      errors.push('Invalid role: must be athlete or coach')
    }
    
    // Graduation year validation
    if (profile.graduationYear && (profile.graduationYear < 2025 || profile.graduationYear > 2029)) {
      errors.push('Invalid graduation year: must be between 2025-2029')
    }
    
    // Goals validation
    if (profile.goals && profile.goals.length !== 3) {
      errors.push('Must have exactly 3 goals selected')
    }
    
    return errors
  }

  /**
   * Retry mechanism for Firestore operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.warn(`${operationName} failed, retrying... (${retries} attempts left)`, error)
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1))
        return this.withRetry(operation, operationName, retries - 1)
      }
      throw this.createFirestoreError(error, operationName)
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error?.code) {
      const retryableCodes = [
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'aborted',
        'internal',
        'unknown'
      ]
      return retryableCodes.includes(error.code)
    }
    return false
  }

  /**
   * Create standardized Firestore error
   */
  private createFirestoreError(error: any, operation: string): FirestoreError {
    return {
      code: error?.code || 'unknown',
      message: error?.message || 'Unknown Firestore error',
      operation: operation as any,
      collection: FIRESTORE_COLLECTIONS.USERS,
      retryable: this.isRetryableError(error),
      timestamp: Timestamp.now()
    }
  }

  /**
   * Delay utility for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create user profile in Firestore
   */
  async createProfile(
    profile: OnboardingProfile,
    userId: string,
    email: string
  ): Promise<FirestoreUserProfile> {
    return this.withRetry(async () => {
      // Validate profile data
      const firestoreProfile = this.toFirestoreProfile(profile, userId, email)
      const validationErrors = this.validateProfile(firestoreProfile)
      
      if (validationErrors.length > 0) {
        throw new Error(`Profile validation failed: ${validationErrors.join(', ')}`)
      }

      // Create profile document
      const userDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.USERS, userId)
      const profileWithId = { ...firestoreProfile, id: userId }
      
      await setDoc(userDocRef, profileWithId)
      
      console.log('Profile created successfully:', userId)
      return profileWithId as FirestoreUserProfile
    }, 'createProfile')
  }

  /**
   * Get user profile from Firestore
   */
  async getProfile(userId: string): Promise<FirestoreUserProfile | null> {
    return this.withRetry(async () => {
      const userDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.USERS, userId)
      const docSnap = await getDoc(userDocRef)
      
      if (docSnap.exists()) {
        return docSnap.data() as FirestoreUserProfile
      }
      
      return null
    }, 'getProfile')
  }

  /**
   * Update user profile in Firestore
   */
  async updateProfile(
    userId: string,
    updates: Partial<FirestoreUserProfile>
  ): Promise<void> {
    return this.withRetry(async () => {
      const userDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.USERS, userId)
      
      // Add update timestamp
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      }
      
      await updateDoc(userDocRef, updatesWithTimestamp)
      console.log('Profile updated successfully:', userId)
    }, 'updateProfile')
  }

  /**
   * Delete user profile from Firestore
   */
  async deleteProfile(userId: string): Promise<void> {
    return this.withRetry(async () => {
      const userDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.USERS, userId)
      await deleteDoc(userDocRef)
      console.log('Profile deleted successfully:', userId)
    }, 'deleteProfile')
  }

  /**
   * Create trial information document
   */
  async createTrialInfo(userId: string, trialDurationDays = 7): Promise<FirestoreTrialInfo> {
    return this.withRetry(async () => {
      const now = Timestamp.now()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + trialDurationDays)
      
      const trialInfo: FirestoreTrialInfo = {
        userId,
        status: 'active',
        startDate: now,
        endDate: Timestamp.fromDate(endDate),
        activatedAt: now,
        gamesLogged: 0,
        aiInsightsGenerated: 0,
        goalsCreated: 0,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now
      }
      
      const trialDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.TRIALS, userId)
      await setDoc(trialDocRef, trialInfo)
      
      console.log('Trial info created successfully:', userId)
      return trialInfo
    }, 'createTrialInfo')
  }

  /**
   * Update trial status
   */
  async updateTrialStatus(
    userId: string,
    status: FirestoreTrialInfo['status'],
    additionalData?: Partial<FirestoreTrialInfo>
  ): Promise<void> {
    return this.withRetry(async () => {
      const trialDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.TRIALS, userId)
      
      const updates = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      }
      
      await updateDoc(trialDocRef, updates)
      console.log('Trial status updated successfully:', userId, status)
    }, 'updateTrialStatus')
  }

  /**
   * Get trial information
   */
  async getTrialInfo(userId: string): Promise<FirestoreTrialInfo | null> {
    return this.withRetry(async () => {
      const trialDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.TRIALS, userId)
      const docSnap = await getDoc(trialDocRef)
      
      if (docSnap.exists()) {
        return docSnap.data() as FirestoreTrialInfo
      }
      
      return null
    }, 'getTrialInfo')
  }

  /**
   * Batch operations for profile and trial creation
   */
  async createProfileWithTrial(
    profile: OnboardingProfile,
    userId: string,
    email: string,
    trialDurationDays = 7
  ): Promise<{ profile: FirestoreUserProfile; trial: FirestoreTrialInfo }> {
    return this.withRetry(async () => {
      const batch = writeBatch(this.firestore)
      
      // Prepare profile data
      const firestoreProfile = this.toFirestoreProfile(profile, userId, email)
      const validationErrors = this.validateProfile(firestoreProfile)
      
      if (validationErrors.length > 0) {
        throw new Error(`Profile validation failed: ${validationErrors.join(', ')}`)
      }

      const profileWithId = { ...firestoreProfile, id: userId }
      
      // Prepare trial data
      const now = Timestamp.now()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + trialDurationDays)
      
      const trialInfo: FirestoreTrialInfo = {
        userId,
        status: 'active',
        startDate: now,
        endDate: Timestamp.fromDate(endDate),
        activatedAt: now,
        gamesLogged: 0,
        aiInsightsGenerated: 0,
        goalsCreated: 0,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now
      }
      
      // Add to batch
      const userDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.USERS, userId)
      const trialDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.TRIALS, userId)
      
      batch.set(userDocRef, profileWithId)
      batch.set(trialDocRef, trialInfo)
      
      // Update profile with trial start date
      batch.update(userDocRef, {
        trialStartDate: now,
        trialStatus: 'active'
      })
      
      // Commit batch
      await batch.commit()
      
      console.log('Profile and trial created successfully:', userId)
      return {
        profile: profileWithId as FirestoreUserProfile,
        trial: trialInfo
      }
    }, 'createProfileWithTrial')
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string): Promise<boolean> {
    return this.withRetry(async () => {
      const usersRef = collection(this.firestore, FIRESTORE_COLLECTIONS.USERS)
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      return !querySnapshot.empty
    }, 'emailExists')
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId: string): Promise<void> {
    return this.withRetry(async () => {
      const userDocRef = doc(this.firestore, FIRESTORE_COLLECTIONS.USERS, userId)
      await updateDoc(userDocRef, {
        lastActiveAt: serverTimestamp()
      })
    }, 'updateLastActive')
  }
}

// Export singleton instance
export const profileService = new ProfileService()