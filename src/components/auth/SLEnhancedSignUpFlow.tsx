/**
 * Enhanced Sign Up Flow Component
 * 
 * Integrates age verification, parental consent, and legal compliance
 * into the registration process with proper step management.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { UserPlus, Calendar, Shield, Users, CheckCircle } from 'lucide-react-native';
import { SLTextField, SLButton, SLToast, useToast } from '@/components/auth';
import SLAgeVerificationForm from './SLAgeVerificationForm';
import SLConsentForm from './SLConsentForm';
import SLParentalConsentFlow from './SLParentalConsentFlow';
import { authService } from '@/services/AuthService';
import { parentalConsentService } from '@/services/ParentalConsentService';
import { AgeVerificationData, ConsentRequest } from '@/services/ConsentManagementService';

export interface SLEnhancedSignUpFlowProps {
  onSignUpComplete?: (user: any) => void;
  onCancel?: () => void;
  region?: string;
  testID?: string;
}

type SignUpStep = 
  | 'basic_info' 
  | 'age_verification' 
  | 'legal_consent' 
  | 'parental_consent' 
  | 'account_creation' 
  | 'pending_approval' 
  | 'completed';

interface BasicInfo {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export function SLEnhancedSignUpFlow({
  onSignUpComplete,
  onCancel,
  region = 'US',
  testID,
}: SLEnhancedSignUpFlowProps) {
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // State
  const [currentStep, setCurrentStep] = useState<SignUpStep>('basic_info');
  const [isLoading, setIsLoading] = useState(false);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [ageData, setAgeData] = useState<AgeVerificationData | null>(null);
  const [consents, setConsents] = useState<ConsentRequest[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempUserId, setTempUserId] = useState<string>('');

  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(basicInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!basicInfo.password) {
      newErrors.password = 'Password is required';
    } else if (basicInfo.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Validate password confirmation
    if (basicInfo.password !== basicInfo.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBasicInfoSubmit = () => {
    if (!validateBasicInfo()) return;
    
    // Generate temporary user ID for tracking
    setTempUserId(`temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    setCurrentStep('age_verification');
  };

  const handleAgeVerificationComplete = (verificationData: AgeVerificationData) => {
    setAgeData(verificationData);
    
    if (verificationData.requiresParentalConsent) {
      // Skip legal consent for minors - parents will handle this
      setCurrentStep('parental_consent');
    } else {
      // Adults go through normal consent flow
      setCurrentStep('legal_consent');
    }
  };

  const handleConsentComplete = (consentRequests: ConsentRequest[]) => {
    setConsents(consentRequests);
    setCurrentStep('account_creation');
  };

  const handleParentalConsentComplete = (approved: boolean) => {
    if (approved) {
      setCurrentStep('completed');
      showSuccess('Account approved! Registration complete.');
      // The actual account creation would have been handled by the parental consent service
    } else {
      Alert.alert(
        'Registration Cancelled',
        'Parental consent was not approved. Please try again or contact support.',
        [
          { text: 'OK', onPress: () => setCurrentStep('basic_info') }
        ]
      );
    }
  };

  const handleAccountCreation = async () => {
    if (!ageData) return;
    
    setIsLoading(true);
    try {
      // Create the Firebase account
      const userCredential = await authService.createUserWithEmail(
        basicInfo.email,
        basicInfo.password
      );

      // Record consents
      for (const consent of consents) {
        // await authService.recordConsent(consent); // TODO: implement method
      }

      setCurrentStep('completed');
      showSuccess('Account created successfully!');
      onSignUpComplete?.(userCredential.user);
    } catch (error: any) {
      showError(error.userMessage || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepProgress = (): number => {
    const steps = ['basic_info', 'age_verification', 'legal_consent', 'account_creation', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'basic_info':
        return 'Create Account';
      case 'age_verification':
        return 'Age Verification';
      case 'legal_consent':
        return 'Legal Agreements';
      case 'parental_consent':
        return 'Parental Consent';
      case 'account_creation':
        return 'Creating Account';
      case 'pending_approval':
        return 'Pending Approval';
      case 'completed':
        return 'Welcome!';
      default:
        return 'Sign Up';
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic_info':
        return (
          <View>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ 
                width: 64, 
                height: 64, 
                backgroundColor: '#DBEAFE', 
                borderRadius: 32, 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: 16 
              }}>
                <UserPlus size={32} color="#2563EB" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
                Create Your Account
              </Text>
              <Text style={{ color: '#6B7280', textAlign: 'center' }}>
                Enter your information to get started
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 16, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <SLTextField
                    label="First Name"
                    value={basicInfo.firstName || ''}
                    onChangeText={(value) => setBasicInfo(prev => ({ ...prev, firstName: value }))}
                    placeholder="First name"
                    testID="first-name-input"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SLTextField
                    label="Last Name"
                    value={basicInfo.lastName || ''}
                    onChangeText={(value) => setBasicInfo(prev => ({ ...prev, lastName: value }))}
                    placeholder="Last name"
                    testID="last-name-input"
                  />
                </View>
              </View>

              <SLTextField
                label="Email"
                value={basicInfo.email}
                onChangeText={(value) => setBasicInfo(prev => ({ ...prev, email: value }))}
                error={errors.email}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                required
                testID="email-input"
              />

              <SLTextField
                label="Password"
                value={basicInfo.password}
                onChangeText={(value) => setBasicInfo(prev => ({ ...prev, password: value }))}
                error={errors.password}
                placeholder="Create a strong password"
                secureTextEntry
                required
                testID="password-input"
              />

              <SLTextField
                label="Confirm Password"
                value={basicInfo.confirmPassword}
                onChangeText={(value) => setBasicInfo(prev => ({ ...prev, confirmPassword: value }))}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                required
                testID="confirm-password-input"
              />
            </View>

            {/* Actions */}
            <View style={{ gap: 12 }}>
              <SLButton
                variant="primary"
                onPress={handleBasicInfoSubmit}
                fullWidth
                testID="continue-basic-info-button"
              >
                Continue
              </SLButton>
              
              {onCancel && (
                <SLButton
                  variant="secondary"
                  onPress={onCancel}
                  fullWidth
                  testID="cancel-signup-button"
                >
                  Cancel
                </SLButton>
              )}
            </View>
          </View>
        );

      case 'age_verification':
        return (
          <SLAgeVerificationForm
            region={region}
            onVerificationComplete={handleAgeVerificationComplete}
            onCancel={() => setCurrentStep('basic_info')}
            testID="age-verification-step"
          />
        );

      case 'legal_consent':
        return (
          <SLConsentForm
            region={region}
            age={ageData?.age}
            onConsentComplete={handleConsentComplete}
            onCancel={() => setCurrentStep('age_verification')}
            testID="consent-step"
          />
        );

      case 'parental_consent':
        return ageData ? (
          <SLParentalConsentFlow
            ageData={ageData}
            childUserId={tempUserId}
            childEmail={basicInfo.email}
            onConsentComplete={handleParentalConsentComplete}
            onCancel={() => setCurrentStep('age_verification')}
            testID="parental-consent-step"
          />
        ) : null;

      case 'account_creation':
        return (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <View style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: '#D1FAE5', 
              borderRadius: 32, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16 
            }}>
              <CheckCircle size={32} color="#059669" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
              Ready to Create Account
            </Text>
            <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
              All requirements completed. Click below to create your account.
            </Text>
            
            <SLButton
              variant="primary"
              onPress={handleAccountCreation}
              loading={isLoading}
              loadingText="Creating account..."
              fullWidth
              testID="create-account-button"
            >
              Create Account
            </SLButton>
          </View>
        );

      case 'completed':
        return (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <View style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: '#D1FAE5', 
              borderRadius: 32, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16 
            }}>
              <CheckCircle size={32} color="#059669" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
              Welcome to StatLocker!
            </Text>
            <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
              Your account has been created successfully. You can now start using the app.
            </Text>
            
            <SLButton
              variant="primary"
              onPress={() => onSignUpComplete?.(null)}
              fullWidth
              testID="get-started-button"
            >
              Get Started
            </SLButton>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }} testID={testID}>
      {/* Progress Bar */}
      {currentStep !== 'completed' && (
        <View style={{ 
          height: 4, 
          backgroundColor: '#F3F4F6', 
          marginHorizontal: 24, 
          marginTop: 16, 
          borderRadius: 2 
        }}>
          <View style={{ 
            height: '100%', 
            backgroundColor: '#2563EB', 
            width: `${getStepProgress()}%`, 
            borderRadius: 2 
          }} />
        </View>
      )}

      {/* Step Title */}
      <View style={{ padding: 24, paddingBottom: 0 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#6B7280', textAlign: 'center' }}>
          {getStepTitle()}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {renderCurrentStep()}
        </View>
      </ScrollView>

      {/* Toast */}
      <SLToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        testID="signup-flow-toast"
      />
    </View>
  );
}

export default SLEnhancedSignUpFlow;