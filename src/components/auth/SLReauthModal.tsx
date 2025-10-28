/**
 * Re-authentication Modal Component
 * 
 * Provides UI for re-authenticating users before sensitive actions.
 * Supports multiple authentication methods and clear user guidance.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Alert } from 'react-native';
import { X, Shield, Clock, Apple, Mail, AlertTriangle } from 'lucide-react-native';
import { SLButton, SLTextField, SLToast, useToast } from '@/components/auth';
import { reauthenticationService } from '@/services/ReauthenticationService';
import { useAuthStore } from '@/store/authStore';

export interface SLReauthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action: string;
  actionDescription?: string;
  testID?: string;
}

export function SLReauthModal({
  visible,
  onClose,
  onSuccess,
  action,
  actionDescription,
  testID,
}: SLReauthModalProps) {
  const { user } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Get available re-authentication methods
  useEffect(() => {
    if (user && visible) {
      const methods = reauthenticationService.getAvailableReauthMethods(user as any);
      setAvailableMethods(methods);
      
      // Auto-select first available method
      if (methods.length > 0 && !selectedMethod) {
        setSelectedMethod(methods[0]);
      }
    }
  }, [user, visible, selectedMethod]);

  // Get time remaining in recent login window
  useEffect(() => {
    if (user && visible) {
      const updateTimeRemaining = async () => {
        const remaining = await reauthenticationService.getRecentLoginTimeRemaining(user.uid);
        setTimeRemaining(remaining);
      };
      
      updateTimeRemaining();
      
      // Update every second
      const interval = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [user, visible]);

  // Handle password re-authentication
  const handlePasswordReauth = async () => {
    if (!user || !password) return;
    
    setIsLoading(true);
    try {
      const result = await reauthenticationService.reauthenticateWithPassword(
        user as any,
        user.email || '',
        password,
        {
          action,
          userId: user.uid,
          requiresReauth: true,
        }
      );

      if (result.success) {
        showSuccess('Re-authentication successful!');
        setPassword('');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else if (result.error) {
        showError(result.error.userMessage);
      }
    } catch (error) {
      showError('Re-authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Apple re-authentication
  const handleAppleReauth = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await reauthenticationService.reauthenticateWithApple(
        user as any,
        {
          action,
          userId: user.uid,
          requiresReauth: true,
        }
      );

      if (result.success) {
        showSuccess('Re-authentication successful!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else if (result.error) {
        showError(result.error.userMessage);
      }
    } catch (error) {
      showError('Re-authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google re-authentication (placeholder)
  const handleGoogleReauth = async () => {
    showError('Google re-authentication is not yet available.');
  };

  // Handle re-authentication based on selected method
  const handleReauth = async () => {
    switch (selectedMethod) {
      case 'password':
        await handlePasswordReauth();
        break;
      case 'apple':
        await handleAppleReauth();
        break;
      case 'google':
        await handleGoogleReauth();
        break;
      default:
        showError('Please select a re-authentication method.');
    }
  };

  // Get method display info
  const getMethodInfo = (method: string) => {
    switch (method) {
      case 'password':
        return { name: 'Password', icon: Mail, color: '#6B7280' };
      case 'apple':
        return { name: 'Apple ID', icon: Apple, color: '#000000' };
      case 'google':
        return { name: 'Google', icon: Mail, color: '#EA4335' };
      default:
        return { name: 'Unknown', icon: Shield, color: '#6B7280' };
    }
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if form is valid
  const isFormValid = selectedMethod === 'password' ? password.length > 0 : true;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white" testID={testID}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Security Verification
          </Text>
          <SLButton
            variant="ghost"
            size="small"
            onPress={onClose}
            leftIcon={<X size={20} color="#6B7280" />}
            testID="close-reauth-modal"
          />
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Security Icon and Message */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Shield size={32} color="#2563EB" />
              </View>
              
              <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
                Verify Your Identity
              </Text>
              <Text className="text-gray-600 text-center leading-relaxed">
                {actionDescription || `To ${action.replace('_', ' ')}, please verify your identity for security.`}
              </Text>
            </View>

            {/* Time Remaining Info */}
            {timeRemaining > 0 && (
              <View className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <View className="flex-row items-center">
                  <Clock size={20} color="#EA580C" className="mr-2" />
                  <View className="flex-1">
                    <Text className="font-medium text-orange-900">
                      Recent Login Window
                    </Text>
                    <Text className="text-sm text-orange-700">
                      You have {formatTimeRemaining(timeRemaining)} remaining from your recent login.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* No Methods Available */}
            {availableMethods.length === 0 && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <View className="flex-row items-center">
                  <AlertTriangle size={20} color="#DC2626" className="mr-2" />
                  <View className="flex-1">
                    <Text className="font-medium text-red-900">
                      No Authentication Methods
                    </Text>
                    <Text className="text-sm text-red-700">
                      No re-authentication methods are available for your account.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Method Selection */}
            {availableMethods.length > 1 && (
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-3">
                  Choose Verification Method
                </Text>
                
                <View className="space-y-2">
                  {availableMethods.map((method) => {
                    const info = getMethodInfo(method);
                    const IconComponent = info.icon;
                    const isSelected = selectedMethod === method;
                    
                    return (
                      <SLButton
                        key={method}
                        variant={isSelected ? "primary" : "secondary"}
                        onPress={() => setSelectedMethod(method)}
                        leftIcon={<IconComponent size={20} color={isSelected ? "white" : info.color} />}
                        fullWidth
                        testID={`select-${method}-method`}
                      >
                        {info.name}
                      </SLButton>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Password Input */}
            {selectedMethod === 'password' && (
              <View className="mb-6">
                <SLTextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secure
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleReauth}
                  testID="reauth-password-input"
                />
              </View>
            )}

            {/* Action Buttons */}
            <View className="space-y-3">
              <SLButton
                variant="primary"
                onPress={handleReauth}
                loading={isLoading}
                disabled={!isFormValid || availableMethods.length === 0}
                loadingText="Verifying..."
                fullWidth
                testID="verify-identity-button"
              >
                Verify Identity
              </SLButton>
              
              <SLButton
                variant="secondary"
                onPress={onClose}
                disabled={isLoading}
                fullWidth
                testID="cancel-reauth-button"
              >
                Cancel
              </SLButton>
            </View>

            {/* Help Text */}
            <View className="mt-6">
              <Text className="text-xs text-gray-500 text-center leading-relaxed">
                This verification helps protect your account from unauthorized changes. 
                Your identity verification is valid for 5 minutes.
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
          testID="reauth-toast"
        />
      </View>
    </Modal>
  );
}

export default SLReauthModal;