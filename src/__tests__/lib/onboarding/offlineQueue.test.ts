import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { OnboardingOfflineQueue, addProgressToOfflineQueue, getOfflineQueueStatus } from '@/lib/onboarding/offlineQueue'
import { OnboardingProgress } from '@/types/onboarding'

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage')
jest.mock('@react-native-community/netinfo')

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>

describe('OnboardingOfflineQueue', () => {
  const mockProgress: OnboardingProgress = {
    profile: { role: 'athlete', sport: 'lacrosse' },
    currentStep: 3,
    completedSteps: [1, 2],
    lastUpdated: new Date(),
    deviceId: 'device_123',
    version: '1.0.0'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize empty queue when no stored data', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null)

      const queue = new OnboardingOfflineQueue()
      await new Promise(resolve => setTimeout(resolve, 0)) // Wait for initialization

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('onboarding_offline_queue')
    })

    it('should restore queue from storage', async () => {
      const storedQueue = {
        items: [{
          id: 'test_123',
          type: 'save_progress',
          data: mockProgress,
          timestamp: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 5
        }],
        isProcessing: false
      }

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedQueue))

      const queue = new OnboardingOfflineQueue()
      await new Promise(resolve => setTimeout(resolve, 0))

      const status = queue.getQueueStatus()
      expect(status.itemCount).toBe(1)
    })
  })

  describe('addToQueue', () => {
    it('should add item to queue and save to storage', async () => {
      const queue = new OnboardingOfflineQueue()

      const itemId = await queue.addToQueue('save_progress', mockProgress)

      expect(itemId).toBeTruthy()
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'onboarding_offline_queue',
        expect.stringContaining('"type":"save_progress"')
      )
    })

    it('should limit queue size', async () => {
      const queue = new OnboardingOfflineQueue()

      // Add items beyond MAX_QUEUE_SIZE (50)
      for (let i = 0; i < 52; i++) {
        await queue.addToQueue('save_progress', mockProgress)
      }

      const status = queue.getQueueStatus()
      expect(status.itemCount).toBeLessThanOrEqual(50)
    })

    it('should process queue immediately when online', async () => {
      mockNetInfo.fetch.mockResolvedValueOnce({ isConnected: true } as any)
      
      const queue = new OnboardingOfflineQueue()
      const processSpy = jest.spyOn(queue, 'processQueue')

      await queue.addToQueue('save_progress', mockProgress)

      expect(processSpy).toHaveBeenCalled()
    })
  })

  describe('processQueue', () => {
    it('should not process when already processing', async () => {
      const queue = new OnboardingOfflineQueue()
      
      // Set processing state
      ;(queue as any).isProcessing = true

      await queue.processQueue()

      // Should exit early without processing
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled()
    })

    it('should process all queue items', async () => {
      const queue = new OnboardingOfflineQueue()
      
      // Add items to queue
      await queue.addToQueue('save_progress', mockProgress)
      await queue.addToQueue('clear_progress', null)

      // Mock successful processing
      jest.doMock('@/lib/firebase', () => ({ db: {} }))
      jest.doMock('firebase/firestore', () => ({
        doc: jest.fn(),
        setDoc: jest.fn().mockResolvedValue(undefined)
      }))

      await queue.processQueue()

      const status = queue.getQueueStatus()
      expect(status.itemCount).toBe(0) // All items should be processed
    })

    it('should handle processing errors and retry', async () => {
      const queue = new OnboardingOfflineQueue()
      
      await queue.addToQueue('save_progress', mockProgress, 2) // Max 2 retries

      // Mock processing failure
      jest.doMock('firebase/firestore', () => ({
        doc: jest.fn(),
        setDoc: jest.fn().mockRejectedValue(new Error('Network error'))
      }))

      await queue.processQueue()

      // Item should still be in queue for retry
      const status = queue.getQueueStatus()
      expect(status.itemCount).toBe(1)
    })
  })

  describe('network connectivity', () => {
    it('should listen for network changes', () => {
      new OnboardingOfflineQueue()

      expect(mockNetInfo.addEventListener).toHaveBeenCalled()
    })

    it('should process queue when network becomes available', async () => {
      const queue = new OnboardingOfflineQueue()
      const processSpy = jest.spyOn(queue, 'processQueue')

      // Add item to queue
      await queue.addToQueue('save_progress', mockProgress)

      // Simulate network becoming available
      const networkListener = mockNetInfo.addEventListener.mock.calls[0][0]
      networkListener({ isConnected: true })

      expect(processSpy).toHaveBeenCalled()
    })
  })

  describe('retry logic', () => {
    it('should implement exponential backoff', async () => {
      const queue = new OnboardingOfflineQueue()
      
      await queue.addToQueue('save_progress', mockProgress, 3)

      // Mock processing failure
      jest.doMock('firebase/firestore', () => ({
        doc: jest.fn(),
        setDoc: jest.fn().mockRejectedValue(new Error('Network error'))
      }))

      await queue.processQueue()

      // Should schedule retry
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000) // First retry delay
    })

    it('should remove items after max retries', async () => {
      const queue = new OnboardingOfflineQueue()
      
      await queue.addToQueue('save_progress', mockProgress, 1) // Max 1 retry

      // Mock processing failure
      jest.doMock('firebase/firestore', () => ({
        doc: jest.fn(),
        setDoc: jest.fn().mockRejectedValue(new Error('Network error'))
      }))

      // Process twice to exceed max retries
      await queue.processQueue()
      await queue.processQueue()

      const status = queue.getQueueStatus()
      expect(status.itemCount).toBe(0) // Item should be removed
    })
  })

  describe('utility functions', () => {
    it('should provide queue status', async () => {
      const itemId = await addProgressToOfflineQueue('save_progress', mockProgress)
      
      const status = getOfflineQueueStatus()
      
      expect(status.itemCount).toBeGreaterThan(0)
      expect(status.isProcessing).toBe(false)
    })

    it('should force sync queue', async () => {
      mockNetInfo.fetch.mockResolvedValueOnce({ isConnected: true } as any)
      
      await addProgressToOfflineQueue('save_progress', mockProgress)
      
      // Should not throw when network is available
      await expect(
        require('@/lib/onboarding/offlineQueue').forceSyncOfflineQueue()
      ).resolves.not.toThrow()
    })

    it('should reject force sync when offline', async () => {
      mockNetInfo.fetch.mockResolvedValueOnce({ isConnected: false } as any)
      
      await expect(
        require('@/lib/onboarding/offlineQueue').forceSyncOfflineQueue()
      ).rejects.toThrow('No network connection available')
    })
  })

  describe('queue management', () => {
    it('should clear entire queue', async () => {
      await addProgressToOfflineQueue('save_progress', mockProgress)
      
      await require('@/lib/onboarding/offlineQueue').clearOfflineQueue()
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('onboarding_offline_queue')
    })

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'))
      
      // Should not throw
      await expect(
        addProgressToOfflineQueue('save_progress', mockProgress)
      ).resolves.toBeTruthy()
    })
  })
})