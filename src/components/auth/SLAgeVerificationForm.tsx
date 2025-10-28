/**
 * Age Verification Form Component
 * 
 * Provides UI for age verification with region-specific compliance
 * and parental consent requirements (COPPA, GDPR-K).
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Calendar, Shield, AlertTriangle } from 'lucide-react-native';
import { SLTextField, SLButton, SLToast, useToast } from '@/components/auth';
import { consentManagementService, AgeVerificationData } from '@/services/ConsentManagementService';

export interface SLAgeVerificationFormProps {
  region?: string;
  onVerificationComplete?: (data: AgeVerificationData) => void;
  onCancel?: () => void;
  testID?: string;
}

export function SLAgeVerificationForm({
  region = 'US',
  onVerificationComplete,
  onCancel,
  testID,
}: SLAgeVerificationFormProps) {
  const { toast, showError, hideToast } = useToast();
  
  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationData, setVerificationData] = useState<AgeVerificationData | null>(null);

  // Update verification data when date changes
  useEffect(() => {
    if (dateOfBirth && isValidDate(dateOfBirth)) {
      const dob = parseDate(dateOfBirth);
      const data = consentManagementService.verifyAge(dob, region);
      setVerificationData(data);
    } else {
      setVerificationData(null);
    }
  }, [dateOfBirth, region]);

  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateString)) return false;
    
    const date = parseDate(dateString);
    const today = new Date();
    
    return date instanceof Date && !isNaN(date.getTime()) && date <= today;
  };

  const parseDate = (dateString: string): Date => {
    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (input: string): string => {
    const cleaned = input.replace(/\D/g, '');
    
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    } else if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleDateChange = (value: string) => {
    const formatted = formatDate(value);
    setDateOfBirth(formatted);
    
    if (errors.dateOfBirth) {
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!isValidDate(dateOfBirth)) {
      newErrors.dateOfBirth = 'Please enter a valid date (MM/DD/YYYY)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !verificationData) return;
    
    setIsLoading(true);
    try {
      if (verificationData.requiresParentalConsent) {
        Alert.alert(
          'Parental Consent Required',
          `Users under ${verificationData.minimumAge} years old require parental consent.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false),
            },
            {
              text: 'Continue',
              onPress: () => {
                onVerificationComplete?.(verificationData);
                setIsLoading(false);
              },
            },
          ]
        );
      } else {
        onVerificationComplete?.(verificationData);
        setIsLoading(false);
      }
    } catch (error: any) {
      showError('Failed to verify age. Please try again.');
      setIsLoading(false);
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
              backgroundColor: '#D1FAE5', 
              borderRadius: 32, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16 
            }}>
              <Calendar size={32} color="#059669" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
              Age Verification
            </Text>
            <Text style={{ color: '#6B7280', textAlign: 'center' }}>
              We need to verify your age to comply with privacy laws
            </Text>
          </View>

          {/* Date of Birth Input */}
          <View style={{ marginBottom: 24 }}>
            <SLTextField
              label="Date of Birth"
              value={dateOfBirth}
              onChangeText={handleDateChange}
              error={errors.dateOfBirth}
              placeholder="MM/DD/YYYY"
              keyboardType="numeric"
              maxLength={10}
              leftIcon={<Calendar size={20} color="#6B7280" />}
              required
              testID="date-of-birth-input"
            />
          </View>

          {/* Age Verification Result */}
          {verificationData && (
            <View style={{ marginBottom: 24 }}>
              <View style={{
                borderWidth: 1,
                borderRadius: 8,
                padding: 16,
                borderColor: verificationData.requiresParentalConsent ? '#FDE68A' : '#BBF7D0',
                backgroundColor: verificationData.requiresParentalConsent ? '#FFFBEB' : '#F0FDF4',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  {verificationData.requiresParentalConsent ? (
                    <AlertTriangle size={20} color="#D97706" />
                  ) : (
                    <Shield size={20} color="#059669" />
                  )}
                  <Text style={{
                    fontWeight: '500',
                    marginLeft: 8,
                    color: verificationData.requiresParentalConsent ? '#92400E' : '#065F46',
                  }}>
                    Age: {verificationData.age} years old
                  </Text>
                </View>
                
                <Text style={{
                  fontSize: 14,
                  color: verificationData.requiresParentalConsent ? '#B45309' : '#047857',
                }}>
                  {verificationData.requiresParentalConsent
                    ? `Parental consent is required for users under ${verificationData.minimumAge} years old.`
                    : 'You meet the age requirements and can proceed with registration.'}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <SLButton
              variant="primary"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!verificationData || isLoading}
              loadingText="Verifying..."
              fullWidth
              testID="verify-age-button"
            >
              {verificationData?.requiresParentalConsent 
                ? 'Continue with Parental Consent' 
                : 'Verify Age'}
            </SLButton>
            
            {onCancel && (
              <SLButton
                variant="secondary"
                onPress={onCancel}
                disabled={isLoading}
                fullWidth
                testID="cancel-age-verification-button"
              >
                Cancel
              </SLButton>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Toast */}
      <SLToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        testID="age-verification-toast"
      />
    </View>
  );
}

export default SLAgeVerificationForm;