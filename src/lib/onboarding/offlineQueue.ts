import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-netinfo/lib/commonjs'
import { OnboardingProgress } from '@/types/onboarding'

const OFFLINE_QUEUE_KEY = 'onboarding_offline_queue'
const MAX_QUEUE_SIZE = 50
const RETRY_INTERVALS = [1000, 2000, 5000, 10000, 30000] // Progressive backoff

interface QueueItem {
  id: string
  type: 'save_progress' | 'clear_progress'
  data: OnboardingProgress | null
  timestamp: Date
  retryCount: number
  maxRetries: number
}

interface OfflineQueue {
  items: QueueItem[]
  isProcessing: boolean
}

class OnboardingOfflineQueue {
  private queue: QueueItem[] = []
  private isProcessing = false
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.initializeQueue()
    this.setupNetworkListener()
  }

  // Initialize queue from storage
  private async initializeQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
      if (stored) {
        const queueData: OfflineQueue = JSON.parse(stored)
        this.queue = queueData.items.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to initialize offline queue:', error)
      this.queue = []
    }
  }

  // Save queue to storage
  private async saveQueue(): Promise<void> {
    try {
      const queueData: OfflineQueue = {
        items: this.queue,
        isProcessing: this.isProcessing
      }
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queueData))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  // Setup network connectivity listener
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isProcessing && this.queue.length > 0) {
        this.processQueue()
      }
    })
  }

  // Add item to queue
  async addToQueue(
    type: 'save_progress' | 'clear_progress',
    data: OnboardingProgress | null,
    maxRetries: number = 5
  ): Promise<string> {
    const item: QueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries
    }

    // Remove old items if queue is too large
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE + 1)
    }

    this.queue.push(item)
    await this.saveQueue()

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch()
    if (netInfo.isConnected) {
      this.processQueue()
    }

    return item.id
  }

  // Process queue items
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    const itemsToProcess = [...this.queue]

    for (const item of itemsToProcess) {
      try {
        await this.processItem(item)
        this.removeFromQueue(item.id)
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error)
        await this.handleRetry(item)
      }
    }

    this.isProcessing = false
    await this.saveQueue()
  }

  // Process individual queue item
  private async processItem(item: QueueItem): Promise<void> {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    const { useAuth } = await import('@/hooks/useAuth')

    // This is a simplified version - in real implementation,
    // you'd need to get the user context properly
    const userId = 'current_user_id' // Get from auth context

    if (!userId) {
      throw new Error('User not authenticated')
    }

    const progressRef = doc(db, 'onboarding_progress', userId)

    switch (item.type) {
      case 'save_progress':
        if (item.data) {
          await setDoc(progressRef, {
            ...item.data,
            lastUpdated: serverTimestamp(),
            userId,
            syncedAt: serverTimestamp()
          }, { merge: true })
        }
        break

      case 'clear_progress':
        await setDoc(progressRef, { 
          cleared: true, 
          clearedAt: serverTimestamp(),
          userId 
        })
        break

      default:
        throw new Error(`Unknown queue item type: ${item.type}`)
    }
  }

  // Handle retry logic
  private async handleRetry(item: QueueItem): Promise<void> {
    item.retryCount++

    if (item.retryCount >= item.maxRetries) {
      console.warn(`Max retries reached for queue item ${item.id}, removing from queue`)
      this.removeFromQueue(item.id)
      return
    }

    // Schedule retry with exponential backoff
    const retryDelay = RETRY_INTERVALS[Math.min(item.retryCount - 1, RETRY_INTERVALS.length - 1)]
    
    const timeoutId = setTimeout(() => {
      this.retryTimeouts.delete(item.id)
      this.processQueue()
    }, retryDelay)

    this.retryTimeouts.set(item.id, timeoutId)
  }

  // Remove item from queue
  private removeFromQueue(itemId: string): void {
    this.queue = this.queue.filter(item => item.id !== itemId)
    
    // Clear any pending retry timeout
    const timeoutId = this.retryTimeouts.get(itemId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.retryTimeouts.delete(itemId)
    }
  }

  // Get queue status
  getQueueStatus(): { 
    itemCount: number
    isProcessing: boolean
    oldestItem?: Date
    newestItem?: Date
  } {
    const timestamps = this.queue.map(item => item.timestamp)
    
    return {
      itemCount: this.queue.length,
      isProcessing: this.isProcessing,
      oldestItem: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined,
      newestItem: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined
    }
  }

  // Clear entire queue
  async clearQueue(): Promise<void> {
    this.queue = []
    
    // Clear all retry timeouts
    for (const timeoutId of this.retryTimeouts.values()) {
      clearTimeout(timeoutId)
    }
    this.retryTimeouts.clear()
    
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY)
  }

  // Force process queue (for manual sync)
  async forceSync(): Promise<void> {
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) {
      throw new Error('No network connection available')
    }
    
    await this.processQueue()
  }
}

// Export singleton instance
export const offlineQueue = new OnboardingOfflineQueue()

// Export utility functions
export const addProgressToOfflineQueue = (
  type: 'save_progress' | 'clear_progress',
  data: OnboardingProgress | null
): Promise<string> => {
  return offlineQueue.addToQueue(type, data)
}

export const getOfflineQueueStatus = () => {
  return offlineQueue.getQueueStatus()
}

export const forceSyncOfflineQueue = () => {
  return offlineQueue.forceSync()
}

export const clearOfflineQueue = () => {
  return offlineQueue.clearQueue()
}