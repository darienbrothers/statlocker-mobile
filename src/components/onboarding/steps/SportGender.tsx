import { View, Text } from 'react-native'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { SelectionCard } from '../SelectionCard'
import { FormDropdown } from '../FormDropdown'
import { FormInput } from '../FormInput'
import { useState } from 'react'
import type { SportData } from '../../../types/onboarding'
import { GRADUATION_YEARS, GENDERS } from '../../../types/onboarding'

/**
 * Step 2: Sport & Gender Component
 * 
 * Collects sport, gender, date of birth, and graduation year
 * Features:
 * - Sport selection (lacrosse primary, expandable)
 * - Gender selection with inclusive options
 * - Date of birth picker with age calculation
 * - Graduation year dropdown (2025-2029)
 */
export function SportGender() {
  const { profile, updateProfile } = useOnboardingStore()
  const [dateInput, setDateInput] = useState('')

  // Sport options (lacrosse primary for MVP)
  const sportOptions = [
    {
      id: 'lacrosse',
      title: 'Lacrosse',
      description: 'Track goals, assists, ground balls, and more with position-specific stats.',
      badge: 'Featured'
    }
  ]

  // Gender options
  const genderOptions = [
    {
      id: 'male',
      title: 'Male',
      description: 'Access male lacrosse positions and statistics.'
    },
    {
      id: 'female',
      title: 'Female', 
      description: 'Access female lacrosse positions and statistics.'
    }
  ]

  // Graduation year options
  const graduationYearOptions = GRADUATION_YEARS.map(year => ({
    label: year.toString(),
    value: year.toString()
  }))

  const handleSportSelect = (sport: string) => {
    updateProfile({ sport })
  }

  const handleGenderSelect = (gender: 'male' | 'female') => {
    updateProfile({ gender })
  }

  const handleDateOfBirthChange = (text: string) => {
    setDateInput(text)
    
    // Parse date input (MM/DD/YYYY format)
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = text.match(dateRegex)
    
    if (match) {
      const [, month, day, year] = match
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      // Validate date
      if (date.getFullYear() == parseInt(year) && 
          date.getMonth() == parseInt(month) - 1 && 
          date.getDate() == parseInt(day)) {
        updateProfile({ dateOfBirth: date })
      }
    }
  }

  const handleGraduationYearSelect = (year: string) => {
    updateProfile({ graduationYear: parseInt(year) })
  }

  // Calculate age for display
  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const displayAge = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null

  return (
    <View className="flex-1">
      {/* Step Introduction */}
      <View className="mb-6">
        <Text className="text-gray-300 text-base leading-6">
          Now let's get some basic info to set up your profile and provide relevant statistics and comparisons.
        </Text>
      </View>

      {/* Sport Selection */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-4">
          What sport do you play?
        </Text>
        
        {sportOptions.map((sport) => (
          <SelectionCard
            key={sport.id}
            title={sport.title}
            description={sport.description}
            selected={profile.sport === sport.id}
            onPress={() => handleSportSelect(sport.id)}
            badge={sport.badge}
            motivationalText="Great choice! Lacrosse stats coming right up! 🥍"
          />
        ))}
      </View>

      {/* Gender Selection */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-4">
          Gender
        </Text>
        
        {genderOptions.map((gender) => (
          <SelectionCard
            key={gender.id}
            title={gender.title}
            description={gender.description}
            selected={profile.gender === gender.id}
            onPress={() => handleGenderSelect(gender.id as 'male' | 'female')}
            variant="compact"
          />
        ))}
      </View>

      {/* Date of Birth */}
      <View className="mb-6">
        <FormInput
          label="Date of Birth"
          placeholder="MM/DD/YYYY"
          value={dateInput}
          onChangeText={handleDateOfBirthChange}
          keyboardType="numeric"
          required
          hint={displayAge ? `Age: ${displayAge} years old` : 'Enter your birth date to calculate age'}
          success={!!profile.dateOfBirth}
        />
      </View>

      {/* Graduation Year */}
      <View className="mb-6">
        <FormDropdown
          label="Expected Graduation Year"
          placeholder="Select your graduation year"
          options={graduationYearOptions}
          value={profile.graduationYear?.toString()}
          onSelect={handleGraduationYearSelect}
          required
        />
      </View>

      {/* Helper Text */}
      <View className="mt-4">
        <Text className="text-gray-500 text-sm text-center leading-5">
          This information helps us provide age-appropriate features and recruiting timelines.
        </Text>
      </View>
    </View>
  )
}