/**
 * Guardian Consent Service
 * Handles parental consent workflow for users aged 13-15
 */

export interface GuardianConsentRequest {
  userId: string
  guardianEmail: string
  childName: string
  childAge: number
  requestTimestamp: Date
  expirationDate: Date
}

export interface GuardianConsentResponse {
  consentId: string
  userId: string
  guardianEmail: string
  consentGiven: boolean
  consentTimestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface ConsentPortalData {
  consentId: string
  childProfile: {
    name: string
    age: number
    sport: string
    position: string
    school: string
  }
  dataCollection: {
    personalInfo: string[]
    performanceData: string[]
    usageData: string[]
  }
  dataUsage: {
    aiInsights: boolean
    benchmarking: boolean
    communication: boolean
  }
}

export class GuardianConsentService {
  private static readonly CONSENT_EXPIRATION_DAYS = 7
  private static readonly MAX_REMINDERS = 3
  private static readonly REMINDER_SCHEDULE = [24, 72, 168] // hours

  /**
   * Initiate guardian consent request
   */
  static async initiateConsentRequest(
    userId: string,
    guardianEmail: string,
    childName: string,
    childAge: number
  ): Promise<{ consentId: string; expirationDate: Date }> {
    try {
      const consentId = this.generateConsentId()
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + this.CONSENT_EXPIRATION_DAYS)

      const consentRequest: GuardianConsentRequest = {
        userId,
        guardianEmail,
        childName,
        childAge,
        requestTimestamp: new Date(),
        expirationDate
      }

      // Store consent request in Firestore
      await this.storeConsentRequest(consentId, consentRequest)

      // Send initial consent email
      await this.sendConsentEmail(consentId, consentRequest)

      // Schedule reminder emails
      await this.scheduleReminders(consentId, guardianEmail)

      return { consentId, expirationDate }
    } catch (error) {
      console.error('Failed to initiate consent request:', error)
      throw new Error('Failed to send guardian consent request')
    }
  }

  /**
   * Process guardian consent response
   */
  static async processConsentResponse(
    consentId: string,
    consentGiven: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<GuardianConsentResponse> {
    try {
      const consentRequest = await this.getConsentRequest(consentId)
      
      if (!consentRequest) {
        throw new Error('Consent request not found')
      }

      if (new Date() > consentRequest.expirationDate) {
        throw new Error('Consent request has expired')
      }

      const consentResponse: GuardianConsentResponse = {
        consentId,
        userId: consentRequest.userId,
        guardianEmail: consentRequest.guardianEmail,
        consentGiven,
        consentTimestamp: new Date(),
        ipAddress,
        userAgent
      }

      // Store consent response
      await this.storeConsentResponse(consentId, consentResponse)

      // Cancel any pending reminders
      await this.cancelReminders(consentId)

      // Update user profile with consent status
      await this.updateUserConsentStatus(consentRequest.userId, consentResponse)

      // Send confirmation email
      await this.sendConsentConfirmation(consentRequest, consentResponse)

      return consentResponse
    } catch (error) {
      console.error('Failed to process consent response:', error)
      throw error
    }
  }

  /**
   * Check consent status for a user
   */
  static async getConsentStatus(userId: string): Promise<{
    required: boolean
    granted?: boolean
    pending?: boolean
    expired?: boolean
    consentTimestamp?: Date
  }> {
    try {
      // This would query Firestore for the user's consent status
      // For now, return a placeholder implementation
      return {
        required: true,
        pending: true
      }
    } catch (error) {
      console.error('Failed to get consent status:', error)
      throw error
    }
  }

  /**
   * Withdraw consent (for GDPR compliance)
   */
  static async withdrawConsent(
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Mark consent as withdrawn
      await this.markConsentWithdrawn(userId, reason)

      // Trigger data deletion process
      await this.initiateDataDeletion(userId)

      // Send withdrawal confirmation
      await this.sendWithdrawalConfirmation(userId)
    } catch (error) {
      console.error('Failed to withdraw consent:', error)
      throw error
    }
  }

  /**
   * Generate secure consent portal URL
   */
  static generateConsentPortalUrl(consentId: string): string {
    // TODO: Replace with actual consent portal URL
    const baseUrl = 'https://consent.statlocker.app'
    return `${baseUrl}/consent/${consentId}`
  }

  /**
   * Private helper methods
   */
  private static generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static async storeConsentRequest(
    consentId: string,
    request: GuardianConsentRequest
  ): Promise<void> {
    // TODO: Implement Firestore storage
    console.log('Storing consent request:', consentId, request)
  }

  private static async getConsentRequest(
    consentId: string
  ): Promise<GuardianConsentRequest | null> {
    // TODO: Implement Firestore retrieval
    console.log('Getting consent request:', consentId)
    return null
  }

  private static async storeConsentResponse(
    consentId: string,
    response: GuardianConsentResponse
  ): Promise<void> {
    // TODO: Implement Firestore storage
    console.log('Storing consent response:', consentId, response)
  }

  private static async updateUserConsentStatus(
    userId: string,
    consentResponse: GuardianConsentResponse
  ): Promise<void> {
    // TODO: Implement user profile update
    console.log('Updating user consent status:', userId, consentResponse)
  }

  private static async sendConsentEmail(
    consentId: string,
    request: GuardianConsentRequest
  ): Promise<void> {
    const consentUrl = this.generateConsentPortalUrl(consentId)
    
    const emailData = {
      to: request.guardianEmail,
      subject: 'Consent Required: Your child wants to join StatLocker',
      template: 'guardian-consent-request',
      data: {
        childName: request.childName,
        childAge: request.childAge,
        consentUrl,
        expirationDate: request.expirationDate.toLocaleDateString()
      }
    }

    // TODO: Implement email sending (Firebase Functions + SendGrid/Mailgun)
    console.log('Sending consent email:', emailData)
  }

  private static async scheduleReminders(
    consentId: string,
    guardianEmail: string
  ): Promise<void> {
    // TODO: Implement reminder scheduling (Firebase Functions + Cloud Scheduler)
    console.log('Scheduling reminders for:', consentId, guardianEmail)
  }

  private static async cancelReminders(consentId: string): Promise<void> {
    // TODO: Implement reminder cancellation
    console.log('Cancelling reminders for:', consentId)
  }

  private static async sendConsentConfirmation(
    request: GuardianConsentRequest,
    response: GuardianConsentResponse
  ): Promise<void> {
    const emailData = {
      to: request.guardianEmail,
      subject: response.consentGiven 
        ? 'Consent Confirmed - Welcome to StatLocker!' 
        : 'Consent Declined - Thank you for your response',
      template: response.consentGiven 
        ? 'guardian-consent-approved' 
        : 'guardian-consent-declined',
      data: {
        childName: request.childName,
        consentGiven: response.consentGiven,
        consentTimestamp: response.consentTimestamp.toLocaleString()
      }
    }

    // TODO: Implement email sending
    console.log('Sending consent confirmation:', emailData)
  }

  private static async markConsentWithdrawn(
    userId: string,
    reason?: string
  ): Promise<void> {
    // TODO: Implement consent withdrawal marking
    console.log('Marking consent withdrawn:', userId, reason)
  }

  private static async initiateDataDeletion(userId: string): Promise<void> {
    // TODO: Implement data deletion process
    console.log('Initiating data deletion for:', userId)
  }

  private static async sendWithdrawalConfirmation(userId: string): Promise<void> {
    // TODO: Implement withdrawal confirmation email
    console.log('Sending withdrawal confirmation for:', userId)
  }
}

/**
 * Email templates for guardian consent workflow
 */
export const GuardianConsentEmailTemplates = {
  consentRequest: {
    subject: 'Consent Required: Your child wants to join StatLocker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your child wants to join StatLocker</h2>
        <p>Hi there,</p>
        <p>Your child, {{childName}} (age {{childAge}}), would like to create an account on StatLocker to track their athletic performance and get personalized training insights.</p>
        
        <h3>What is StatLocker?</h3>
        <p>StatLocker is a mobile app that helps young athletes track their game statistics, set goals, and receive AI-powered insights to improve their performance. We're committed to protecting your child's privacy and only collect the minimum data necessary to provide these features.</p>
        
        <h3>What data do we collect?</h3>
        <ul>
          <li>Basic profile information (name, age, sport, position)</li>
          <li>Game statistics and performance data</li>
          <li>Goals and preferences</li>
          <li>App usage data for improving our service</li>
        </ul>
        
        <h3>How do we protect your child's data?</h3>
        <ul>
          <li>All data is encrypted and stored securely</li>
          <li>We never sell personal information to third parties</li>
          <li>You can request data deletion at any time</li>
          <li>We comply with COPPA and GDPR-K privacy laws</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{consentUrl}}" style="background-color: #0047AB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Review and Give Consent
          </a>
        </div>
        
        <p><strong>This consent request expires on {{expirationDate}}.</strong></p>
        
        <p>If you have any questions, please contact us at support@statlocker.app</p>
        
        <p>Thank you,<br>The StatLocker Team</p>
      </div>
    `
  },
  
  consentApproved: {
    subject: 'Consent Confirmed - Welcome to StatLocker!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for giving consent!</h2>
        <p>Hi there,</p>
        <p>Thank you for giving consent for {{childName}} to use StatLocker. Their account is now active and they can start tracking their athletic performance!</p>
        
        <h3>What happens next?</h3>
        <ul>
          <li>{{childName}} can now log into their StatLocker account</li>
          <li>They can start logging game statistics and setting goals</li>
          <li>Our AI will provide personalized training insights</li>
          <li>You can monitor their progress and withdraw consent at any time</li>
        </ul>
        
        <h3>Managing consent</h3>
        <p>You can withdraw your consent at any time by:</p>
        <ul>
          <li>Contacting us at support@statlocker.app</li>
          <li>Using the account settings in the app</li>
          <li>Requesting account deletion</li>
        </ul>
        
        <p>Consent given on: {{consentTimestamp}}</p>
        
        <p>Thank you for trusting us with {{childName}}'s athletic journey!</p>
        
        <p>Best regards,<br>The StatLocker Team</p>
      </div>
    `
  },
  
  consentDeclined: {
    subject: 'Consent Declined - Thank you for your response',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your response</h2>
        <p>Hi there,</p>
        <p>We understand that you've decided not to give consent for {{childName}} to use StatLocker at this time.</p>
        
        <p>We respect your decision and want you to know that:</p>
        <ul>
          <li>No account has been created for {{childName}}</li>
          <li>No personal data has been stored</li>
          <li>This consent request has been cancelled</li>
        </ul>
        
        <p>If you change your mind in the future, {{childName}} can always start the registration process again.</p>
        
        <p>If you have any questions about our privacy practices or data handling, please don't hesitate to contact us at support@statlocker.app</p>
        
        <p>Response recorded on: {{consentTimestamp}}</p>
        
        <p>Thank you,<br>The StatLocker Team</p>
      </div>
    `
  }
}