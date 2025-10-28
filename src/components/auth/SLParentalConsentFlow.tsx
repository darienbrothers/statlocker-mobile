/**
 * Parental Consent Flow Component
 * 
 * Handles the complete parental consent workflow for minors,
 * including parent email collection and status tracking.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Users, Mail, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import { SLTextField, SLButton, SLToast, useToast } from '@/components/auth';
import { parentalConsentService, ParentalConsentRequest, PendingAccount } from '@/services/ParentalConsentService';
import { AgeVerificationData } from '@/services/ConsentManagementService';

export interface SLParentalConsentFlowProps {
  ageData: AgeVerificationData;
  childUserId: string;
  childEmail: string;
  onConsentComplete?: (approved: boolean) => void;
  onCancel?: () => void;
  testID?: string;
}

type FlowStep = 'collect_parent_info' | 'consent_sent' | 'checking_status' | 'completed' | 'denied';

export function SLParentalConsentFlow({
  ageData,
  childUserId,
  childEmail,
  onConsentComplete,
  onCancel,
  testID,
}: SLParentalConsentFlowProps) {
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // State
  const [currentStep, setCurrentStep] = useState<FlowStep>('collect_parent_info');
  const [isLoading, setIsLoading] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consentRequest, setConsentRequest] = useState<ParentalConsentRequest | null>(null);
  const [pendingAccount, setPendingAccount] = useState<PendingAccount | null>(null);

  // Check for existing pending account on mount
  useEffect(() => {
    checkExistingPendingAccount();
  }, [childUserId]);

  // Poll for consent status when in waiting state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentStep === 'consent_sent' && consentRequest) {
      interval = setInterval(() => {
        checkConsentStatus();
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentStep, consentRequest]);

  const checkExistingPendingAccount = async () => {
    try {
      const existing = await parentalConsentService.getPendingAccountStatus(childUserId);
      if (existing) {
        setPendingAccount(existing);
        
        if (existing.status === 'approved') {
          setCurrentStep('completed');
          onConsentComplete?.(true);
        } else if (existing.status === 'pending_parental_consent') {
          // Check if we have the consent request
          const request = await parentalConsentService.getConsentRequestStatus(existing.consentRequestId);
          if (request) {
            setConsentRequest(request);
            setCurrentStep('consent_sent');
          }
        }
      }
    } catch (error) {
      // No existing account, continue with normal flow
    }
  };

  const checkConsentStatus = async () => {
    if (!consentRequest) return;
    
    try {
      const updatedRequest = await parentalConsentService.getConsentRequestStatus(consentRequest.id);
      if (updatedRequest && updatedRequest.status !== 'pending') {
        setConsentRequest(updatedRequest);
        
        if (updatedRequest.status === 'approved') {
          setCurrentStep('completed');
          showSuccess('Parental consent approved! Your account is now active.');
          onConsentComplete?.(true);
        } else if (updatedRequest.status === 'denied') {
          setCurrentStep('denied');
          showError('Parental consent was denied.');
          onConsentComplete?.(false);
        } else if (updatedRequest.status === 'expired') {
          showError('Parental consent request has expired. Please start over.');
          setCurrentStep('collect_parent_info');
        }
      }
    } catch (error) {
      // Continue polling
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate parent email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!parentEmail.trim()) {
      newErrors.parentEmail = 'Parent email is required';
    } else if (!emailRegex.test(parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid email address';
    }

    // Validate parent name
    if (!parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    } else if (parentName.trim().length < 2) {
      newErrors.parentName = 'Parent name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendConsentRequest = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const request = await parentalConsentService.createConsentRequest(
        childUserId,
        childEmail,
        new Date(), // This should be the actual date of birth
        parentEmail.trim(),
        ageData.region,
        {
          parentName: parentName.trim(),
        }
      );

      setConsentRequest(request);
      setCurrentStep('consent_sent');
      showSuccess('Parental consent request sent successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to send parental consent request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!consentRequest) return;
    
    setIsLoading(true);
    try {
      await parentalConsentService.resendConsentEmail(consentRequest.id);
      showSuccess('Consent email resent successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'collect_parent_info':
        return <Users size={32} color="#2563EB" />;
      case 'consent_sent':
        return <Mail size={32} color="#D97706" />;
      case 'checking_status':
        return <Clock size={32} color="#6B7280" />;
      case 'completed':
        return <CheckCircle size={32} color="#059669" />;
      case 'denied':
        return <XCircle size={32} color="#DC2626" />;
      default:
        return <Users size={32} color="#2563EB" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'collect_parent_info':
        return 'Parental Consent Required';
      case 'consent_sent':
        return 'Waiting for Parent Approval';
      case 'checking_status':
        return 'Checking Status';
      case 'completed':
        return 'Account Approved!';
      case 'denied':
        return 'Consent Denied';
      default:
        return 'Parental Consent';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'collect_parent_info':
        return `Since you're under ${ageData.minimumAge}, we need your parent or guardian's permission to create your account.`;
      case 'consent_sent':
        return `We've sent a consent request to ${parentEmail}. They'll need to approve your account before you can continue.`;
      case 'checking_status':
        return 'Checking the status of your parental consent request...';
      case 'completed':
        return 'Your parent has approved your account. You can now continue with registration!';
      case 'denied':
        return 'Your parent has declined the consent request. Please speak with them if you believe this was a mistake.';
      default:
        return '';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }} testID={testID}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: currentStep === 'completed' ? '#D1FAE5' : 
                              currentStep === 'denied' ? '#FEE2E2' : 
                              currentStep === 'consent_sent' ? '#FEF3C7' : '#DBEAFE', 
              borderRadius: 32, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16 
            }}>
              {getStepIcon()}
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
              {getStepTitle()}
            </Text>
            <Text style={{ color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
              {getStepDescription()}
            </Text>
          </View>

          {/* Age Information */}
          <View style={{ 
            backgroundColor: '#FEF3C7', 
            borderWidth: 1, 
            borderColor: '#FDE68A', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 24 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <AlertTriangle size={20} color="#D97706" />
              <Text style={{ fontWeight: '500', color: '#92400E', marginLeft: 8 }}>
                Age Verification Notice
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#B45309' }}>
              Age: {ageData.age} years old • Region: {ageData.region} • Law: {ageData.region === 'US' ? 'COPPA' : 'GDPR-K'}
            </Text>
            <Text style={{ fontSize: 14, color: '#B45309', marginTop: 4 }}>
              Users under {ageData.minimumAge} require parental consent under {ageData.region === 'US' ? 'COPPA' : 'GDPR-K'} regulations.
            </Text>
          </View>

          {/* Step Content */}
          {currentStep === 'collect_parent_info' && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 16 }}>
                Parent/Guardian Information
              </Text>
              
              <View style={{ gap: 16 }}>
                <SLTextField
                  label="Parent/Guardian Name"
                  value={parentName}
                  onChangeText={setParentName}
                  error={errors.parentName}
                  placeholder="Enter parent or guardian's full name"
                  required
                  testID="parent-name-input"
                />

                <SLTextField
                  label="Parent/Guardian Email"
                  value={parentEmail}
                  onChangeText={setParentEmail}
                  error={errors.parentEmail}
                  placeholder="parent@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={20} color="#6B7280" />}
                  required
                  testID="parent-email-input"
                />
              </View>

              <View style={{ 
                backgroundColor: '#F3F4F6', 
                borderRadius: 8, 
                padding: 16, 
                marginTop: 16 
              }}>
                <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>
                  We'll send an email to your parent or guardian with instructions to approve your account. 
                  This process typically takes 1-2 business days.
                </Text>
              </View>
            </View>
          )}

          {currentStep === 'consent_sent' && consentRequest && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 16 }}>
                Consent Request Details
              </Text>
              
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280' }}>Parent Email:</Text>
                  <Text style={{ fontWeight: '500', color: '#111827' }}>{consentRequest.parentEmail}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280' }}>Request Sent:</Text>
                  <Text style={{ fontWeight: '500', color: '#111827' }}>
                    {consentRequest.requestedAt.toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280' }}>Expires:</Text>
                  <Text style={{ fontWeight: '500', color: '#111827' }}>
                    {consentRequest.expiresAt.toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280' }}>Status:</Text>
                  <Text style={{ 
                    fontWeight: '500', 
                    color: consentRequest.status === 'pending' ? '#D97706' : '#111827',
                    textTransform: 'capitalize'
                  }}>
                    {consentRequest.status}
                  </Text>
                </View>
              </View>

              <View style={{ 
                backgroundColor: '#EFF6FF', 
                borderWidth: 1, 
                borderColor: '#BFDBFE', 
                borderRadius: 8, 
                padding: 16, 
                marginTop: 16 
              }}>
                <Text style={{ fontSize: 14, color: '#1E40AF', lineHeight: 20 }}>
                  📧 Check your parent's email (including spam folder) for the consent request. 
                  They'll need to click the link and approve your account.
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            {currentStep === 'collect_parent_info' && (
              <>
                <SLButton
                  variant="primary"
                  onPress={handleSendConsentRequest}
                  loading={isLoading}
                  disabled={isLoading}
                  loadingText="Sending request..."
                  fullWidth
                  testID="send-consent-request-button"
                >
                  Send Parental Consent Request
                </SLButton>
                
                {onCancel && (
                  <SLButton
                    variant="secondary"
                    onPress={onCancel}
                    disabled={isLoading}
                    fullWidth
                    testID="cancel-consent-button"
                  >
                    Cancel
                  </SLButton>
                )}
              </>
            )}

            {currentStep === 'consent_sent' && (
              <>
                <SLButton
                  variant="secondary"
                  onPress={handleResendEmail}
                  loading={isLoading}
                  disabled={isLoading}
                  loadingText="Resending..."
                  fullWidth
                  testID="resend-email-button"
                >
                  Resend Email
                </SLButton>
                
                <SLButton
                  variant="primary"
                  onPress={checkConsentStatus}
                  loading={isLoading}
                  disabled={isLoading}
                  loadingText="Checking..."
                  fullWidth
                  testID="check-status-button"
                >
                  Check Status
                </SLButton>
              </>
            )}

            {(currentStep === 'completed' || currentStep === 'denied') && onCancel && (
              <SLButton
                variant="primary"
                onPress={onCancel}
                fullWidth
                testID="continue-button"
              >
                {currentStep === 'completed' ? 'Continue' : 'Go Back'}
              </SLButton>
            )}
          </View>

          {/* Help Text */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16 }}>
              This process is required by law to protect minors online. 
              If you have questions, please contact support.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Toast */}
      <SLToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        testID="parental-consent-toast"
      />
    </View>
  );
}

export default SLParentalConsentFlow;