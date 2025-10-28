/**
 * Welcome Screen
 * 
 * Post-onboarding welcome screen that shows trial status,
 * celebration message, and transitions user to main app
 */

import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Haptics from 'expo-haptics'
import { postOnboardingService, WelcomeScreenData } from '../src/services/PostOnboardingService'
import { getFirebaseAuth } from '../src/lib/firebase'

export default function WelcomeScreen() {
  const params = useLocalSearchParams()
  const [welcomeData, setWelcomeData] = useState<WelcomeScreenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract params
  const trialActive = params.trial_active === 'true'
  const trialDays = parseInt(params.trial_days as string) || 0
  const personaType = params.persona_type as string
  const celebrationMessage = params.celebration_message as string
  const isOffline = params.offline === 'true'
  const role = params.role as string

  useEffect(() => {
    loadWelcomeData()
  }, [])

  const loadWelcomeData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const auth = getFirebaseAuth()
      const user = auth.currentUser

      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Load welcome data
      const data = await postOnboardingService.getWelcomeScreenData(user.uid)
      setWelcomeData(data)

      // Trigger celebration haptics
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

    } catch (err) {
      console.error('Failed to load welcome data:', err)
      setError('Failed to load welcome information')
      
      // Set fallback data from params
      setWelcomeData({
        userName: 'Athlete',
        trialActive,
        trialDaysRemaining: trialDays,
        selectedGoals: [],
        celebrationMessage: celebrationMessage || 'Welcome to StatLocker!'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = async () => {
    try {
      if (welcomeData) {
        await postOnboardingService.navigateToMainApp(welcomeData, false)
      } else {
        // Fallback navigation
        router.replace('/(tabs)/dashboard')
      }
    } catch (error) {
      console.error('Failed to navigate to main app:', error)
      router.replace('/(tabs)/dashboard')
    }
  }

  const handleShowTrialInfo = async () => {
    if (welcomeData) {
      await postOnboardingService.showTrialConfirmation(welcomeData.trialDaysRemaining)
    }
  }

  const renderTrialBanner = () => {
    if (!welcomeData?.trialActive) return null

    return (
      <Pressable
        onPress={handleShowTrialInfo}
        className="bg-blue-600 mx-6 p-4 rounded-xl mb-6"
        style={{ shadowColor: '#0047AB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-semibold text-lg">
              🎉 Trial Active!
            </Text>
            <Text className="text-blue-100 text-sm mt-1">
              {welcomeData.trialDaysRemaining} days remaining • Tap for details
            </Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold text-sm">
              {welcomeData.trialDaysRemaining}d
            </Text>
          </View>
        </View>
      </Pressable>
    )
  }

  const renderOfflineBanner = () => {
    if (!isOffline) return null

    return (
      <View className="bg-orange-600 mx-6 p-4 rounded-xl mb-6">
        <Text className="text-white font-semibold text-base">
          📱 Setup Saved Offline
        </Text>
        <Text className="text-orange-100 text-sm mt-1">
          Your profile will sync when you're back online
        </Text>
      </View>
    )
  }

  const renderGoals = () => {
    if (!welcomeData?.selectedGoals.length) return null

    return (
      <View className="mx-6 mb-8">
        <Text className="text-white font-semibold text-lg mb-3">
          Your Goals
        </Text>
        <View className="space-y-2">
          {welcomeData.selectedGoals.slice(0, 3).map((goal, index) => (
            <View key={index} className="bg-gray-800 p-3 rounded-lg flex-row items-center">
              <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold text-xs">{index + 1}</Text>
              </View>
              <Text className="text-white flex-1">{goal}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <StatusBar style="light" />
        <Text className="text-white text-lg">Setting up your StatLocker...</Text>
      </View>
    )
  }

  if (error && !welcomeData) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center px-6">
        <StatusBar style="light" />
        <Text className="text-white text-xl font-bold mb-4">Welcome to StatLocker!</Text>
        <Text className="text-gray-300 text-center mb-8">{error}</Text>
        <Pressable
          onPress={handleContinue}
          className="bg-blue-600 px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold text-lg">Continue to Dashboard</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="pt-16 pb-8 px-6">
        <Text className="text-white text-3xl font-bold text-center mb-2">
          🎉 Welcome, {welcomeData?.userName}!
        </Text>
        <Text className="text-gray-300 text-center text-lg leading-relaxed">
          {welcomeData?.celebrationMessage || 'Your StatLocker is ready!'}
        </Text>
      </View>

      {/* Trial Banner */}
      {renderTrialBanner()}

      {/* Offline Banner */}
      {renderOfflineBanner()}

      {/* Goals Section */}
      {renderGoals()}

      {/* Persona Type (if available) */}
      {welcomeData?.personaType && (
        <View className="mx-6 mb-8">
          <View className="bg-gray-800 p-4 rounded-xl">
            <Text className="text-white font-semibold text-base mb-2">
              🧬 Your Athlete DNA
            </Text>
            <Text className="text-gray-300">
              Persona Type: <Text className="text-blue-400 font-semibold">{welcomeData.personaType}</Text>
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Your AI insights will be personalized to your style
            </Text>
          </View>
        </View>
      )}

      {/* Continue Button */}
      <View className="flex-1 justify-end pb-8 px-6">
        <Pressable
          onPress={handleContinue}
          className="bg-blue-600 py-4 rounded-xl items-center"
          style={{ shadowColor: '#0047AB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
        >
          <Text className="text-white font-bold text-lg">
            Enter the Locker 🚀
          </Text>
        </Pressable>

        {/* Skip to Dashboard Link */}
        <Pressable
          onPress={() => router.replace('/(tabs)/dashboard')}
          className="mt-4 py-2"
        >
          <Text className="text-gray-400 text-center">
            Skip to Dashboard
          </Text>
        </Pressable>
      </View>
    </View>
  )
}