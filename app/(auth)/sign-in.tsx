/**
 * Sign In Screen
 * 
 * Handles user authentication with email/password
 * Routes to tabs on successful authentication
 */

import { useState } from 'react';
import { Text, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, StickyCTA } from '@/components';
import { useAuthStore } from '@/store/authStore';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('demo@statlocker.com');
  const [password, setPassword] = useState('password123');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await signIn(email.trim(), password.trim());
      // Navigation will be handled by the auth state change in index.tsx
    } catch (error) {
      Alert.alert('Sign In Failed', 'Please check your credentials and try again');
    }
  };

  return (
    <Screen
      title="Welcome Back"
      stickyCta={
        <StickyCTA
          variant="primary"
          onPress={handleSignIn}
          loading={isLoading}
          disabled={!email.trim() || !password.trim()}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </StickyCTA>
      }
    >
      <Text className="text-3xl font-bold text-primary-900 text-center mb-2">
        StatLocker
      </Text>
      <Text className="text-base text-gray-500 text-center mb-8">
        Stat tracking made easy. Progress made visible.
      </Text>

      <Text className="text-lg font-semibold text-gray-900 mb-6">
        Sign in to your account
      </Text>

      {/* Email Input */}
      <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
      <TextInput
        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base mb-4"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
      />

      {/* Password Input */}
      <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
      <TextInput
        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base mb-6"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        returnKeyType="done"
        onSubmitEditing={handleSignIn}
      />

      {/* Demo Instructions */}
      <Text className="text-sm text-gray-400 text-center mt-4">
        Demo credentials are pre-filled. Tap "Sign In" to continue.
      </Text>
    </Screen>
  );
}
