/**
 * Sign In Screen
 * 
 * Comprehensive authentication screen with:
 * - Email/password authentication
 * - Apple Sign-In integration
 * - Form validation and error handling
 * - Accessibility compliance
 * - Loading states and user feedback
 */

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SLTextField,
  SLButton,
  SLAppleSignInButton,
  SLDividerLabelled,
  SLToast,
  useToast,
  SLFormHint,
} from '@/components/auth';
// import { SLRateLimitBanner } from '@/components/auth/SLRateLimitBanner';
import { useAuthStore } from '@/store/authStore';
import { validateSignInForm } from '@/lib/validation';
import { AuthError, AuthErrorCode } from '@/types/auth';
import { RateLimitResult } from '@/types/security';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, signInWithApple, isLoading, error, clearError } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // Form state
  const [email, setEmail] = useState(__DEV__ ? 'demo@statlocker.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  
  // Rate limiting state
  const [rateLimitResult, setRateLimitResult] = useState<RateLimitResult | null>(null);
  
  // Refs for form navigation
  const passwordRef = useRef<TextInput>(null);

  // Validate form on change
  const validateForm = () => {
    const validation = validateSignInForm(email, password);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  // Handle email/password sign in
  const handleEmailSignIn = async () => {
    // Clear previous errors
    clearError();
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await signIn(email.trim(), password.trim());
      
      // Clear rate limiting on successful sign-in
      setRateLimitResult(null);
      
      showSuccess('Welcome back!');
      // Navigation will be handled by auth state change in index.tsx
    } catch (error) {
      const authError = error as AuthError;
      
      // Handle rate limiting errors
      if (authError.code === AuthErrorCode.TOO_MANY_REQUESTS) {
        const rateLimitData: RateLimitResult = {
          allowed: false,
          isLockedOut: true,
          remainingLockoutMs: authError.details?.remainingLockoutMs || 0,
          remainingLockoutMinutes: authError.details?.remainingLockoutMinutes || 0,
          attemptsRemaining: 0,
          windowExpiresAt: null,
          message: authError.userMessage,
        };
        setRateLimitResult(rateLimitData);
        
        // Don't show toast for rate limiting - the banner will handle it
        return;
      }
      
      showError(authError.userMessage || 'Sign in failed. Please try again.');
    }
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    clearError();
    
    try {
      await signInWithApple();
      showSuccess('Welcome to StatLocker!');
      // Navigation will be handled by auth state change in index.tsx
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code !== 'auth/apple-cancelled') {
        showError(authError.userMessage || 'Apple Sign-In failed. Please try again.');
      }
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (isLoading) return;
    handleEmailSignIn();
  };

  // Check if form is valid
  const isFormValid = email.trim() && password.trim() && Object.keys(formErrors).length === 0;

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
              <View className="w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center mb-4">
                <Text className="text-white text-xl font-bold">🔒</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Stat tracking made easy. Progress made visible.
              </Text>
              <Text className="text-base text-gray-500 text-center">
                Sign in to your Locker.
              </Text>
            </View>

            {/* Apple Sign-In */}
            <View className="mb-6">
              <SLAppleSignInButton
                loading={isLoading}
                onPress={handleAppleSignIn}
                testID="apple-signin-button"
              />
            </View>

            {/* Divider */}
            <SLDividerLabelled label="or" />

            {/* Rate Limiting Banner */}
            {rateLimitResult && rateLimitResult.isLockedOut && (
              <View className="mx-6 mb-4 p-4 rounded-xl border bg-red-50 border-red-200">
                <Text className="text-red-900 font-semibold">Too many attempts</Text>
                <Text className="text-red-700 text-sm">
                  {rateLimitResult.message || 'Please wait before trying again.'}
                </Text>
              </View>
            )}

            {/* Email/Password Form */}
            <View className="space-y-4">
              {/* Email Field */}
              <SLTextField
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (formErrors.email) {
                    const validation = validateSignInForm(text, password);
                    setFormErrors(validation.errors);
                  }
                }}
                error={formErrors.email?.[0]}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                testID="email-field"
              />

              {/* Password Field */}
              <SLTextField
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (formErrors.password) {
                    const validation = validateSignInForm(email, text);
                    setFormErrors(validation.errors);
                  }
                }}
                error={formErrors.password?.[0]}
                placeholder="Enter your password"
                secure
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                testID="password-field"
              />

              {/* Sign In Button */}
              <View className="pt-2">
                <SLButton
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  loadingText="Signing you in..."
                  disabled={!isFormValid || (rateLimitResult?.isLockedOut ?? false)}
                  onPress={handleSubmit}
                  testID="signin-button"
                >
                  Sign In
                </SLButton>
              </View>
            </View>

            {/* Footer Links */}
            <View className="mt-8 space-y-4">
              {/* Forgot Password */}
              <View className="items-center">
                <Link href="/(auth)/forgot-password" asChild>
                  <Text className="text-blue-600 text-base font-medium">
                    Forgot password?
                  </Text>
                </Link>
              </View>

              {/* Sign Up Link */}
              <View className="flex-row justify-center items-center">
                <Text className="text-gray-500 text-base">New here? </Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Text className="text-blue-600 text-base font-medium">
                    Create account
                  </Text>
                </Link>
              </View>
            </View>

            {/* Development Helper */}
            {__DEV__ && (
              <View className="mt-8 p-4 bg-gray-50 rounded-xl">
                <SLFormHint
                  text="Demo credentials are pre-filled for development"
                  type="info"
                  size="small"
                />
              </View>
            )}

            {/* Legal Footer */}
            <View className="mt-8 mb-6">
              <Text className="text-xs text-gray-400 text-center leading-relaxed">
                By continuing, you agree to the{' '}
                <Text className="text-blue-600">Terms of Service</Text>
                {' '}and{' '}
                <Text className="text-blue-600">Privacy Policy</Text>.
              </Text>
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
        testID="signin-toast"
      />
    </SafeAreaView>
  );
}
