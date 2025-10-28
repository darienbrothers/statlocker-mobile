/**
 * Forgot Password Screen
 * 
 * Password reset screen with:
 * - Email validation
 * - Reset email sending
 * - Rate limiting UI
 * - Success feedback
 * - Error handling
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SLTextField,
  SLButton,
  SLToast,
  useToast,
  SLFormHint,
} from '@/components/auth';
import { useAuthStore } from '@/store/authStore';
import { validatePasswordResetForm } from '@/lib/validation';
import { AuthError } from '@/types/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset, isLoading, clearError } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // Form state
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Validate form
  const validateForm = () => {
    const validation = validatePasswordResetForm(email);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    // Clear previous errors
    clearError();
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await sendPasswordReset(email.trim());
      setEmailSent(true);
      setCanResend(false);
      
      // Start countdown for resend
      let countdown = 60;
      setResendCountdown(countdown);
      
      const timer = setInterval(() => {
        countdown -= 1;
        setResendCountdown(countdown);
        
        if (countdown <= 0) {
          clearInterval(timer);
          setCanResend(true);
          setResendCountdown(0);
        }
      }, 1000);

      showSuccess('Reset link sent! Check your inbox and spam folder.');
    } catch (error) {
      const authError = error as AuthError;
      showError(authError.userMessage || 'Failed to send reset email. Please try again.');
    }
  };

  // Handle resend
  const handleResend = () => {
    if (canResend) {
      handlePasswordReset();
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (isLoading) return;
    handlePasswordReset();
  };

  // Check if form is valid
  const isFormValid = email.trim() && Object.keys(formErrors).length === 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-8">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-12 h-12 bg-amber-500 rounded-2xl items-center justify-center mb-4">
                <Text className="text-white text-xl font-bold">🔑</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Reset your password
              </Text>
              <Text className="text-base text-gray-500 text-center">
                Enter your email and we'll send a link.
              </Text>
            </View>

            {!emailSent ? (
              /* Reset Form */
              <View className="space-y-6">
                {/* Email Field */}
                <SLTextField
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (formErrors.email) {
                      const validation = validatePasswordResetForm(text);
                      setFormErrors(validation.errors);
                    }
                  }}
                  error={formErrors.email?.[0]}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  testID="email-field"
                />

                {/* Send Reset Button */}
                <SLButton
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  loadingText="Sending reset link..."
                  disabled={!isFormValid}
                  onPress={handleSubmit}
                  testID="send-reset-button"
                >
                  Send Reset Link
                </SLButton>

                {/* Help Text */}
                <SLFormHint
                  text="We'll send you a secure link to reset your password. The link will expire in 60 minutes."
                  type="info"
                />
              </View>
            ) : (
              /* Success State */
              <View className="space-y-6">
                {/* Success Message */}
                <View className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                      <Text className="text-green-600 text-2xl">📧</Text>
                    </View>
                    <Text className="text-lg font-semibold text-green-800 text-center mb-2">
                      Reset link sent!
                    </Text>
                    <Text className="text-sm text-green-700 text-center">
                      We sent a password reset link to:
                    </Text>
                    <Text className="text-sm font-medium text-green-800 text-center mt-1">
                      {email}
                    </Text>
                  </View>
                </View>

                {/* Instructions */}
                <View className="space-y-4">
                  <SLFormHint
                    text="Check your inbox and spam folder for the reset email."
                    type="info"
                  />
                  
                  <SLFormHint
                    text="The reset link will expire in 60 minutes for security."
                    type="warning"
                  />
                </View>

                {/* Resend Button */}
                <View className="pt-4">
                  <SLButton
                    variant="secondary"
                    size="large"
                    fullWidth
                    loading={isLoading}
                    disabled={!canResend}
                    onPress={handleResend}
                    testID="resend-button"
                  >
                    {resendCountdown > 0 
                      ? `Resend in ${resendCountdown}s` 
                      : 'Resend Reset Link'
                    }
                  </SLButton>
                </View>

                {/* Open Email App */}
                <View className="pt-2">
                  <SLButton
                    variant="ghost"
                    size="large"
                    fullWidth
                    onPress={() => {
                      // This would open the default email app
                      // Implementation depends on platform
                    }}
                    testID="open-email-button"
                  >
                    Open Email App
                  </SLButton>
                </View>
              </View>
            )}

            {/* Footer Links */}
            <View className="mt-auto mb-6 space-y-4">
              {/* Back to Sign In */}
              <View className="flex-row justify-center items-center">
                <Text className="text-gray-500 text-base">Remember your password? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Text className="text-blue-600 text-base font-medium">
                    Sign in
                  </Text>
                </Link>
              </View>

              {/* Create Account */}
              {!emailSent && (
                <View className="flex-row justify-center items-center">
                  <Text className="text-gray-500 text-base">Don't have an account? </Text>
                  <Link href="/(auth)/sign-up" asChild>
                    <Text className="text-blue-600 text-base font-medium">
                      Create one
                    </Text>
                  </Link>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Notifications */}
      <SLToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        testID="forgot-password-toast"
      />
    </SafeAreaView>
  );
}