/**
 * Offline Storage Service
 * 
 * Handles offline storage queue for profile data when network is unavailable
 * Provides automatic sync when connectivity is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { OnboardingProfile } from '../types/onboarding'
import { FirestoreUserProfile, FirestoreError } from '../types/firestore'
import { profileService } from './ProfileService'

interface QueuedOperation {
  id: string
  type: 'create_profile' | 'update_profile' | 'create_trial'
  data: any
  userId: string
  email?: string
  timestamp: Date
  retryCount: number
  maxRetries: number
}

interface OfflineStorageState {
  isOnline: boolean
  queue: QueuedOperation[]
  syncInProgress: boolean
  lastSyncAttempt?: Date
  lastSuccessfulSync?: Date
}

export class OfflineStorageService {
  private static instance: OfflineStorageService
  private storageKey = '@statlocker_offline_queue'
  private stateKey = '@statlocker_offline_state'
  private maxRetries = 5
  private syncInterval = 30000 // 30 seconds
  private syncTimer?: NodeJS.Timeout

  private constructor() {
    this.initializeNetworkListener()
    this.startPeriodicSync()
  }

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService()
    }
    return OfflineStorageService.instance
  }

  /**
   * Initialize network connectivity listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable)
      this.updateOnlineStatus(isOnline)
      
      if (isOnline) {
        console.log('Network connectivity restored, starting sync...')
        this.syncQueue()
      }
    })
  }

  /**
   * Start periodic sync attempts
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncQueue()
    }, this.syncInterval)
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = undefined
    }
  }

  /**
   * Update online status in storage
   */
  private async updateOnlineStatus(isOnline: boolean): Promise<void> {
    try {
      const state = await this.getStorageState()
      state.isOnline = isOnline
      await this.saveStorageState(state)
    } catch (error) {
      console.error('Failed to update online status:', error)
    }
  }

  /**
   * Get current storage state
   */
  private async getStorageState(): Promise<OfflineStorageState> {
    try {
      const stateJson = await AsyncStorage.getItem(this.stateKey)
      if (stateJson) {
        const state = JSON.parse(stateJson)
        // Convert date strings back to Date objects
        if (state.lastSyncAttempt) {
          state.lastSyncAttempt = new Date(state.lastSyncAttempt)
        }
        if (state.lastSuccessfulSync) {
          state.lastSuccessfulSync = new Date(state.lastSuccessfulSync)
        }
        return state
      }
    } catch (error) {
      console.error('Failed to get storage state:', error)
    }

    // Return default state
    return {
      isOnline: true,
      queue: [],
      syncInProgress: false
    }
  }

  /**
   * Save storage state
   */
  private async saveStorageState(state: OfflineStorageState): Promise<void> {
    try {
      await AsyncStorage.setItem(this.stateKey, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save storage state:', error)
    }
  }

  /**
   * Get queued operations
   */
  private async getQueue(): Promise<QueuedOperation[]> {
    try {
      const queueJson = await AsyncStorage.getItem(this.storageKey)
      if (queueJson) {
        const queue = JSON.parse(queueJson)
        // Convert timestamp strings back to Date objects
        return queue.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to get offline queue:', error)
    }
    return []
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(queue: QueuedOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  /**
   * Add operation to offline queue
   */
  async queueOperation(
    type: QueuedOperation['type'],
    data: any,
    userId: string,
    email?: string
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: `${type}_${userId}_${Date.now()}`,
      type,
      data,
      userId,
      email,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries
    }

    const queue = await this.getQueue()
    queue.push(operation)
    await this.saveQueue(queue)

    console.log('Operation queued for offline sync:', operation.id)
    return operation.id
  }

  /**
   * Remove operation from queue
   */
  private async removeFromQueue(operationId: string): Promise<void> {
    const queue = await this.getQueue()
    const filteredQueue = queue.filter(op => op.id !== operationId)
    await this.saveQueue(filteredQueue)
  }

  /**
   * Update operation retry count
   */
  private async updateOperationRetryCount(operationId: string): Promise<void> {
    const queue = await this.getQueue()
    const operation = queue.find(op => op.id === operationId)
    
    if (operation) {
      operation.retryCount++
      await this.saveQueue(queue)
    }
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch()
      return Boolean(netInfo.isConnected && netInfo.isInternetReachable)
    } catch (error) {
      console.error('Failed to check network status:', error)
      return false
    }
  }

  /**
   * Execute queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'create_profile':
          if (!operation.email) {
            throw new Error('Email required for profile creation')
          }
          await profileService.createProfile(
            operation.data as OnboardingProfile,
            operation.userId,
            operation.email
          )
          break

        case 'update_profile':
          await profileService.updateProfile(
            operation.userId,
            operation.data as Partial<FirestoreUserProfile>
          )
          break

        case 'create_trial':
          await profileService.createTrialInfo(operation.userId, operation.data?.trialDurationDays)
          break

        default:
          throw new Error(`Unknown operation type: ${operation.type}`)
      }

      console.log('Operation executed successfully:', operation.id)
      return true
    } catch (error) {
      console.error('Failed to execute operation:', operation.id, error)
      return false
    }
  }

  /**
   * Sync all queued operations
   */
  async syncQueue(): Promise<{ success: number; failed: number; errors: FirestoreError[] }> {
    const state = await this.getStorageState()
    
    // Prevent concurrent sync operations
    if (state.syncInProgress) {
      console.log('Sync already in progress, skipping...')
      return { success: 0, failed: 0, errors: [] }
    }

    // Check if online
    const online = await this.isOnline()
    if (!online) {
      console.log('Device is offline, skipping sync')
      return { success: 0, failed: 0, errors: [] }
    }

    // Update sync state
    state.syncInProgress = true
    state.lastSyncAttempt = new Date()
    await this.saveStorageState(state)

    const queue = await this.getQueue()
    const results = { success: 0, failed: 0, errors: [] as FirestoreError[] }

    console.log(`Starting sync of ${queue.length} queued operations`)

    for (const operation of queue) {
      try {
        // Check if operation has exceeded max retries
        if (operation.retryCount >= operation.maxRetries) {
          console.warn('Operation exceeded max retries, removing from queue:', operation.id)
          await this.removeFromQueue(operation.id)
          results.failed++
          continue
        }

        // Execute operation
        const success = await this.executeOperation(operation)
        
        if (success) {
          await this.removeFromQueue(operation.id)
          results.success++
        } else {
          await this.updateOperationRetryCount(operation.id)
          results.failed++
        }
      } catch (error) {
        console.error('Sync operation failed:', operation.id, error)
        await this.updateOperationRetryCount(operation.id)
        results.failed++
        
        results.errors.push({
          code: 'sync_error',
          message: error instanceof Error ? error.message : 'Unknown sync error',
          operation: 'update',
          collection: 'offline_queue',
          documentId: operation.id,
          retryable: true,
          timestamp: new Date() as any
        })
      }
    }

    // Update sync state
    state.syncInProgress = false
    if (results.success > 0) {
      state.lastSuccessfulSync = new Date()
    }
    await this.saveStorageState(state)

    console.log('Sync completed:', results)
    return results
  }

  /**
   * Queue profile creation for offline sync
   */
  async queueProfileCreation(
    profile: OnboardingProfile,
    userId: string,
    email: string
  ): Promise<string> {
    return this.queueOperation('create_profile', profile, userId, email)
  }

  /**
   * Queue profile update for offline sync
   */
  async queueProfileUpdate(
    userId: string,
    updates: Partial<FirestoreUserProfile>
  ): Promise<string> {
    return this.queueOperation('update_profile', updates, userId)
  }

  /**
   * Queue trial creation for offline sync
   */
  async queueTrialCreation(
    userId: string,
    trialDurationDays = 7
  ): Promise<string> {
    return this.queueOperation('create_trial', { trialDurationDays }, userId)
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    queueLength: number
    isOnline: boolean
    syncInProgress: boolean
    lastSyncAttempt?: Date
    lastSuccessfulSync?: Date
  }> {
    const queue = await this.getQueue()
    const state = await this.getStorageState()
    
    return {
      queueLength: queue.length,
      isOnline: state.isOnline,
      syncInProgress: state.syncInProgress,
      lastSyncAttempt: state.lastSyncAttempt,
      lastSuccessfulSync: state.lastSuccessfulSync
    }
  }

  /**
   * Clear all queued operations (use with caution)
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.storageKey)
    console.log('Offline queue cleared')
  }

  /**
   * Get pending operations count
   */
  async getPendingOperationsCount(): Promise<number> {
    const queue = await this.getQueue()
    return queue.length
  }

  /**
   * Force sync now (manual trigger)
   */
  async forceSyncNow(): Promise<{ success: number; failed: number; errors: FirestoreError[] }> {
    console.log('Force sync triggered manually')
    return this.syncQueue()
  }
}

// Export singleton instance
export const offlineStorageService = OfflineStorageService.getInstance()