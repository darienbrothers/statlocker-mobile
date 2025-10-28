/**
 * Sign Up Screen
 * 
 * Comprehensive registration screen with:
 * - Email/password registration
 * - Password strength validation
 * - Terms and privacy consent
 * - Form validation and error handling
 * - Accessibility compliance
 */

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SLTextField,
  SLButton,
  SLToast,
  useToast,
  SLFormHint,
  SLPasswordStrength,
} from '@/components/auth';
import { useAuthStore } from '@/store/authStore';
import { validateSignUpForm, assessPasswordStrength } from '@/lib/validation';
import { AuthError } from '@/types/auth';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, isLoading, clearError } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  
  // Refs for form navigation
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Password strength assessment
  const passwordStrength = assessPasswordStrength(password);

  // Validate form
  const validateForm = () => {
    const validation = validateSignUpForm(email, password, confirmPassword);
    setFormErrors(validation.errors);
    return validation.isValid && agreedToTerms;
  };

  // Handle sign up
  const handleSignUp = async () => {
    // Clear previous errors
    clearError();
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      if (!agreedToTerms) {
        showError('Please agree to the Terms of Service and Privacy Policy to continue.');
      }
      return;
    }

    try {
      await signUp(email.trim(), password);
      showSuccess('Account created! Please check your email to verify your account.');
      // Navigation will be handled by auth state change or redirect to verification
    } catch (error) {
      const authError = error as AuthError;
      showError(authError.userMessage || 'Account creation failed. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (isLoading) return;
    handleSignUp();
  };

  // Check if form is valid
  const isFormValid = 
    email.trim() && 
    password.trim() && 
    confirmPassword.trim() && 
    passwordStrength.isValid &&
    password === confirmPassword &&
    agreedToTerms &&
    Object.keys(formErrors).length === 0;

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
                <Text className="text-white text-xl font-bold">📊</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Create your Locker
              </Text>
              <Text className="text-base text-gray-500 text-center">
                It takes less than a minute.
              </Text>
            </View>

            {/* Registration Form */}
            <View className="space-y-4">
              {/* Email Field */}
              <SLTextField
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (formErrors.email) {
                    const validation = validateSignUpForm(text, password, confirmPassword);
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
              <View>
                <SLTextField
                  ref={passwordRef}
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setShowPasswordStrength(text.length > 0);
                    if (formErrors.password) {
                      const validation = validateSignUpForm(email, text, confirmPassword);
                      setFormErrors(validation.errors);
                    }
                  }}
                  error={formErrors.password?.[0]}
                  placeholder="Create a strong password"
                  secure
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  testID="password-field"
                />
                
                {/* Password Strength Indicator */}
                {showPasswordStrength && (
                  <SLPasswordStrength
                    score={passwordStrength.score}
                    feedback={passwordStrength.feedback}
                    requirements={passwordStrength.requirements}
                    testID="password-strength"
                  />
                )}
              </View>

              {/* Confirm Password Field */}
              <SLTextField
                ref={confirmPasswordRef}
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (formErrors.confirmPassword) {
                    const validation = validateSignUpForm(email, password, text);
                    setFormErrors(validation.errors);
                  }
                }}
                error={formErrors.confirmPassword?.[0]}
                placeholder="Confirm your password"
                secure
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                testID="confirm-password-field"
              />

              {/* Terms and Privacy Consent */}
              <View className="pt-4">
                <View className="flex-row items-start">
                  <View className="mr-3 mt-1">
                    <SLButton
                      variant={agreedToTerms ? 'primary' : 'ghost'}
                      size="small"
                      onPress={() => setAgreedToTerms(!agreedToTerms)}
                      testID="terms-checkbox"
                    >
                      {agreedToTerms ? '✓' : '○'}
                    </SLButton>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600 leading-relaxed">
                      I agree to the{' '}
                      <Text className="text-blue-600 font-medium">Terms of Service</Text>
                      {' '}and{' '}
                      <Text className="text-blue-600 font-medium">Privacy Policy</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Create Account Button */}
              <View className="pt-6">
                <SLButton
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  loadingText="Creating your account..."
                  disabled={!isFormValid}
                  onPress={handleSubmit}
                  testID="signup-button"
                >
                  Create Account
                </SLButton>
              </View>
            </View>

            {/* Footer Links */}
            <View className="mt-8 space-y-4">
              {/* Sign In Link */}
              <View className="flex-row justify-center items-center">
                <Text className="text-gray-500 text-base">Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Text className="text-blue-600 text-base font-medium">
                    Sign in
                  </Text>
                </Link>
              </View>
            </View>

            {/* Security Notice */}
            <View className="mt-8 mb-6">
              <SLFormHint
                text="Your data is encrypted and secure. We'll never share your information."
                type="info"
                size="small"
              />
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
        testID="signup-toast"
      />
    </SafeAreaView>
  );
}