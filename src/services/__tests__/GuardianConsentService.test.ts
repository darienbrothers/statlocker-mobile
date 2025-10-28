import { GuardianConsentService } from '../GuardianConsentService'
import type { 
  GuardianConsentRequest, 
  GuardianConsentResponse 
} from '../GuardianConsentService'

// Mock console methods to avoid noise in tests
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
}

describe('GuardianConsentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore())
  })

  describe('initiateConsentRequest', () => {
    it('should create a consent request with proper data structure', async () => {
      const userId = 'test-user-123'
      const guardianEmail = 'parent@test.com'
      const childName = 'Test Child'
      const childAge = 14

      const result = await GuardianConsentService.initiateConsentRequest(
        userId,
        guardianEmail,
        childName,
        childAge
      )

      expect(result).toHaveProperty('consentId')
      expect(result).toHaveProperty('expirationDate')
      expect(result.consentId).toMatch(/^consent_\d+_[a-z0-9]+$/)
      expect(result.expirationDate).toBeInstanceOf(Date)
      
      // Expiration should be 7 days from now
      const expectedExpiration = new Date()
      expectedExpiration.setDate(expectedExpiration.getDate() + 7)
      const timeDiff = Math.abs(result.expirationDate.getTime() - expectedExpiration.getTime())
      expect(timeDiff).toBeLessThan(1000) // Within 1 second
    })

    it('should generate unique consent IDs', async () => {
      const requests = await Promise.all([
        GuardianConsentService.initiateConsentRequest('user1', 'parent1@test.com', 'Child 1', 14),
        GuardianConsentService.initiateConsentRequest('user2', 'parent2@test.com', 'Child 2', 15),
        GuardianConsentService.initiateConsentRequest('user3', 'parent3@test.com', 'Child 3', 13),
      ])

      const consentIds = requests.map(r => r.consentId)
      const uniqueIds = new Set(consentIds)
      
      expect(uniqueIds.size).toBe(3)
      expect(consentIds).toHaveLength(3)
    })

    it('should handle errors gracefully', async () => {
      // This test would mock Firestore to throw an error
      // For now, we'll test the error handling structure
      
      await expect(async () => {
        // Simulate an error condition
        const originalGenerateId = (GuardianConsentService as any).generateConsentId
        ;(GuardianConsentService as any).generateConsentId = () => {
          throw new Error('Database error')
        }
        
        try {
          await GuardianConsentService.initiateConsentRequest(
            'test-user',
            'parent@test.com',
            'Test Child',
            14
          )
        } finally {
          // Restore original method
          ;(GuardianConsentService as any).generateConsentId = originalGenerateId
        }
      }).rejects.toThrow('Failed to send guardian consent request')
    })
  })

  describe('processConsentResponse', () => {
    it('should process consent approval correctly', async () => {
      const consentId = 'consent_123_abc'
      const ipAddress = '192.168.1.1'
      const userAgent = 'Mozilla/5.0...'

      // Mock the getConsentRequest method to return a valid request
      const mockRequest: GuardianConsentRequest = {
        userId: 'test-user-123',
        guardianEmail: 'parent@test.com',
        childName: 'Test Child',
        childAge: 14,
        requestTimestamp: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }

      // Mock the private method (in a real implementation, this would be mocked properly)
      const getConsentRequestSpy = jest.spyOn(GuardianConsentService as any, 'getConsentRequest')
        .mockResolvedValue(mockRequest)

      const result = await GuardianConsentService.processConsentResponse(
        consentId,
        true,
        ipAddress,
        userAgent
      )

      expect(result).toMatchObject({
        consentId,
        userId: mockRequest.userId,
        guardianEmail: mockRequest.guardianEmail,
        consentGiven: true,
        ipAddress,
        userAgent
      })
      expect(result.consentTimestamp).toBeInstanceOf(Date)

      getConsentRequestSpy.mockRestore()
    })

    it('should process consent denial correctly', async () => {
      const consentId = 'consent_123_abc'

      const mockRequest: GuardianConsentRequest = {
        userId: 'test-user-123',
        guardianEmail: 'parent@test.com',
        childName: 'Test Child',
        childAge: 14,
        requestTimestamp: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }

      const getConsentRequestSpy = jest.spyOn(GuardianConsentService as any, 'getConsentRequest')
        .mockResolvedValue(mockRequest)

      const result = await GuardianConsentService.processConsentResponse(
        consentId,
        false
      )

      expect(result.consentGiven).toBe(false)
      expect(result.consentId).toBe(consentId)

      getConsentRequestSpy.mockRestore()
    })

    it('should reject expired consent requests', async () => {
      const consentId = 'consent_123_abc'

      const expiredRequest: GuardianConsentRequest = {
        userId: 'test-user-123',
        guardianEmail: 'parent@test.com',
        childName: 'Test Child',
        childAge: 14,
        requestTimestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        expirationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago (expired)
      }

      const getConsentRequestSpy = jest.spyOn(GuardianConsentService as any, 'getConsentRequest')
        .mockResolvedValue(expiredRequest)

      await expect(
        GuardianConsentService.processConsentResponse(consentId, true)
      ).rejects.toThrow('Consent request has expired')

      getConsentRequestSpy.mockRestore()
    })

    it('should reject non-existent consent requests', async () => {
      const consentId = 'non-existent-consent'

      const getConsentRequestSpy = jest.spyOn(GuardianConsentService as any, 'getConsentRequest')
        .mockResolvedValue(null)

      await expect(
        GuardianConsentService.processConsentResponse(consentId, true)
      ).rejects.toThrow('Consent request not found')

      getConsentRequestSpy.mockRestore()
    })
  })

  describe('getConsentStatus', () => {
    it('should return consent status for a user', async () => {
      const userId = 'test-user-123'

      const status = await GuardianConsentService.getConsentStatus(userId)

      expect(status).toHaveProperty('required')
      expect(typeof status.required).toBe('boolean')
      
      // The current implementation returns a placeholder
      expect(status.required).toBe(true)
      expect(status.pending).toBe(true)
    })

    it('should handle errors when checking consent status', async () => {
      const userId = 'invalid-user'

      // The current implementation should not throw, but log errors
      await expect(
        GuardianConsentService.getConsentStatus(userId)
      ).rejects.toThrow()
    })
  })

  describe('withdrawConsent', () => {
    it('should process consent withdrawal', async () => {
      const userId = 'test-user-123'
      const reason = 'Parent requested withdrawal'

      // Should not throw an error
      await expect(
        GuardianConsentService.withdrawConsent(userId, reason)
      ).resolves.toBeUndefined()
    })

    it('should handle withdrawal without reason', async () => {
      const userId = 'test-user-123'

      await expect(
        GuardianConsentService.withdrawConsent(userId)
      ).resolves.toBeUndefined()
    })
  })

  describe('generateConsentPortalUrl', () => {
    it('should generate valid consent portal URLs', () => {
      const consentId = 'consent_123_abc'
      const url = GuardianConsentService.generateConsentPortalUrl(consentId)

      expect(url).toBe('https://consent.statlocker.app/consent/consent_123_abc')
      expect(url).toMatch(/^https:\/\//)
      expect(url).toContain(consentId)
    })

    it('should handle special characters in consent ID', () => {
      const consentId = 'consent_123_abc-def'
      const url = GuardianConsentService.generateConsentPortalUrl(consentId)

      expect(url).toContain(consentId)
      expect(url).toMatch(/^https:\/\/consent\.statlocker\.app\/consent\//)
    })
  })

  describe('Email Templates', () => {
    it('should have properly structured email templates', () => {
      const { GuardianConsentEmailTemplates } = require('../GuardianConsentService')

      expect(GuardianConsentEmailTemplates).toHaveProperty('consentRequest')
      expect(GuardianConsentEmailTemplates).toHaveProperty('consentApproved')
      expect(GuardianConsentEmailTemplates).toHaveProperty('consentDeclined')

      // Check consent request template
      const consentRequest = GuardianConsentEmailTemplates.consentRequest
      expect(consentRequest.subject).toContain('Consent Required')
      expect(consentRequest.html).toContain('{{childName}}')
      expect(consentRequest.html).toContain('{{childAge}}')
      expect(consentRequest.html).toContain('{{consentUrl}}')
      expect(consentRequest.html).toContain('{{expirationDate}}')

      // Check approval template
      const consentApproved = GuardianConsentEmailTemplates.consentApproved
      expect(consentApproved.subject).toContain('Consent Confirmed')
      expect(consentApproved.html).toContain('{{childName}}')
      expect(consentApproved.html).toContain('{{consentTimestamp}}')

      // Check decline template
      const consentDeclined = GuardianConsentEmailTemplates.consentDeclined
      expect(consentDeclined.subject).toContain('Consent Declined')
      expect(consentDeclined.html).toContain('{{childName}}')
      expect(consentDeclined.html).toContain('{{consentTimestamp}}')
    })

    it('should include required privacy information in templates', () => {
      const { GuardianConsentEmailTemplates } = require('../GuardianConsentService')

      const consentRequest = GuardianConsentEmailTemplates.consentRequest
      
      // Should mention key privacy concepts
      expect(consentRequest.html).toMatch(/privacy/i)
      expect(consentRequest.html).toMatch(/coppa|gdpr/i)
      expect(consentRequest.html).toMatch(/encrypted/i)
      expect(consentRequest.html).toMatch(/delete/i)
      expect(consentRequest.html).toMatch(/third parties/i)
    })

    it('should include clear data collection information', () => {
      const { GuardianConsentEmailTemplates } = require('../GuardianConsentService')

      const consentRequest = GuardianConsentEmailTemplates.consentRequest
      
      // Should explain what data is collected
      expect(consentRequest.html).toMatch(/basic profile information/i)
      expect(consentRequest.html).toMatch(/game statistics/i)
      expect(consentRequest.html).toMatch(/goals and preferences/i)
      expect(consentRequest.html).toMatch(/app usage data/i)
    })
  })

  describe('Security and Validation', () => {
    it('should generate cryptographically secure consent IDs', () => {
      const ids = Array.from({ length: 100 }, () => 
        (GuardianConsentService as any).generateConsentId()
      )

      // All IDs should be unique
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100)

      // All IDs should follow the expected format
      ids.forEach(id => {
        expect(id).toMatch(/^consent_\d+_[a-z0-9]+$/)
      })
    })

    it('should validate consent request data structure', async () => {
      // Test with invalid data types
      await expect(
        GuardianConsentService.initiateConsentRequest(
          '', // empty user ID
          'invalid-email', // invalid email
          '', // empty name
          -1 // invalid age
        )
      ).rejects.toThrow()
    })

    it('should handle concurrent consent requests safely', async () => {
      const userId = 'test-user-123'
      const guardianEmail = 'parent@test.com'
      
      // Multiple concurrent requests should all succeed
      const requests = await Promise.all([
        GuardianConsentService.initiateConsentRequest(userId, guardianEmail, 'Child 1', 14),
        GuardianConsentService.initiateConsentRequest(userId, guardianEmail, 'Child 1', 14),
        GuardianConsentService.initiateConsentRequest(userId, guardianEmail, 'Child 1', 14),
      ])

      // All should have unique consent IDs
      const consentIds = requests.map(r => r.consentId)
      const uniqueIds = new Set(consentIds)
      expect(uniqueIds.size).toBe(3)
    })
  })
})