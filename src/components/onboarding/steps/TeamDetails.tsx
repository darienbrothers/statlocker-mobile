import { View, Text } from 'react-native'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { FormInput } from '../FormInput'
import { FormDropdown } from '../FormDropdown'
import { FormToggle } from '../FormToggle'
import { useState } from 'react'
import type { SchoolInfo, ClubInfo } from '../../../types/onboarding'

/**
 * Step 4: Team Details Component
 * 
 * Collects school and optional club team information
 * Features:
 * - School name input with autocomplete suggestions
 * - City/state selection with geolocation option
 * - Club team toggle with conditional fields
 * - Organization validation and data storage
 */
export function TeamDetails() {
  const { profile, updateProfile } = useOnboardingStore()
  const [showClubFields, setShowClubFields] = useState(false)

  // US States for dropdown
  const stateOptions = [
    { label: 'Alabama', value: 'AL' },
    { label: 'Alaska', value: 'AK' },
    { label: 'Arizona', value: 'AZ' },
    { label: 'Arkansas', value: 'AR' },
    { label: 'California', value: 'CA' },
    { label: 'Colorado', value: 'CO' },
    { label: 'Connecticut', value: 'CT' },
    { label: 'Delaware', value: 'DE' },
    { label: 'Florida', value: 'FL' },
    { label: 'Georgia', value: 'GA' },
    { label: 'Hawaii', value: 'HI' },
    { label: 'Idaho', value: 'ID' },
    { label: 'Illinois', value: 'IL' },
    { label: 'Indiana', value: 'IN' },
    { label: 'Iowa', value: 'IA' },
    { label: 'Kansas', value: 'KS' },
    { label: 'Kentucky', value: 'KY' },
    { label: 'Louisiana', value: 'LA' },
    { label: 'Maine', value: 'ME' },
    { label: 'Maryland', value: 'MD' },
    { label: 'Massachusetts', value: 'MA' },
    { label: 'Michigan', value: 'MI' },
    { label: 'Minnesota', value: 'MN' },
    { label: 'Mississippi', value: 'MS' },
    { label: 'Missouri', value: 'MO' },
    { label: 'Montana', value: 'MT' },
    { label: 'Nebraska', value: 'NE' },
    { label: 'Nevada', value: 'NV' },
    { label: 'New Hampshire', value: 'NH' },
    { label: 'New Jersey', value: 'NJ' },
    { label: 'New Mexico', value: 'NM' },
    { label: 'New York', value: 'NY' },
    { label: 'North Carolina', value: 'NC' },
    { label: 'North Dakota', value: 'ND' },
    { label: 'Ohio', value: 'OH' },
    { label: 'Oklahoma', value: 'OK' },
    { label: 'Oregon', value: 'OR' },
    { label: 'Pennsylvania', value: 'PA' },
    { label: 'Rhode Island', value: 'RI' },
    { label: 'South Carolina', value: 'SC' },
    { label: 'South Dakota', value: 'SD' },
    { label: 'Tennessee', value: 'TN' },
    { label: 'Texas', value: 'TX' },
    { label: 'Utah', value: 'UT' },
    { label: 'Vermont', value: 'VT' },
    { label: 'Virginia', value: 'VA' },
    { label: 'Washington', value: 'WA' },
    { label: 'West Virginia', value: 'WV' },
    { label: 'Wisconsin', value: 'WI' },
    { label: 'Wyoming', value: 'WY' }
  ]

  const handleSchoolNameChange = (name: string) => {
    const schoolInfo: SchoolInfo = {
      name,
      city: profile.school?.city || '',
      state: profile.school?.state || '',
      type: profile.school?.type
    }
    updateProfile({ school: schoolInfo })
  }

  const handleSchoolCityChange = (city: string) => {
    const schoolInfo: SchoolInfo = {
      name: profile.school?.name || '',
      city,
      state: profile.school?.state || '',
      type: profile.school?.type
    }
    updateProfile({ school: schoolInfo })
  }

  const handleSchoolStateChange = (state: string) => {
    const schoolInfo: SchoolInfo = {
      name: profile.school?.name || '',
      city: profile.school?.city || '',
      state,
      type: profile.school?.type
    }
    updateProfile({ school: schoolInfo })
  }

  const handleClubToggle = (enabled: boolean) => {
    setShowClubFields(enabled)
    
    if (enabled) {
      // Initialize club info if enabling
      updateProfile({ 
        teamType: 'club',
        club: profile.club || { organization: '', teamName: '' }
      })
    } else {
      // Set to high school only and clear club info
      updateProfile({ 
        teamType: 'high_school',
        club: undefined 
      })
    }
  }

  const handleClubOrganizationChange = (organization: string) => {
    const clubInfo: ClubInfo = {
      organization,
      teamName: profile.club?.teamName || '',
      league: profile.club?.league
    }
    updateProfile({ club: clubInfo })
  }

  const handleClubTeamNameChange = (teamName: string) => {
    const clubInfo: ClubInfo = {
      organization: profile.club?.organization || '',
      teamName,
      league: profile.club?.league
    }
    updateProfile({ club: clubInfo })
  }

  return (
    <View className="flex-1">
      {/* Step Introduction */}
      <View className="mb-6">
        <Text className="text-gray-300 text-base leading-6">
          Let's add your team information so we can properly map your stats to the right organizations and provide relevant comparisons.
        </Text>
      </View>

      {/* School Information */}
      <View className="mb-8">
        <Text className="text-white text-lg font-semibold mb-4">
          High School Information
        </Text>
        
        <FormInput
          label="School Name"
          placeholder="Enter your high school name"
          value={profile.school?.name || ''}
          onChangeText={handleSchoolNameChange}
          required
          hint="Full school name (e.g., 'Lincoln High School')"
          success={!!(profile.school?.name && profile.school.name.length > 2)}
        />

        <View className="flex-row space-x-3">
          <View className="flex-1">
            <FormInput
              label="City"
              placeholder="School city"
              value={profile.school?.city || ''}
              onChangeText={handleSchoolCityChange}
              required
              success={!!(profile.school?.city && profile.school.city.length > 1)}
            />
          </View>
          
          <View className="flex-1">
            <FormDropdown
              label="State"
              placeholder="State"
              options={stateOptions}
              value={profile.school?.state}
              onSelect={handleSchoolStateChange}
              required
            />
          </View>
        </View>
      </View>

      {/* Club Team Toggle */}
      <View className="mb-6">
        <FormToggle
          label="I also play for a club team"
          description="Toggle this on if you play for a club or travel team in addition to your high school team."
          value={showClubFields}
          onToggle={handleClubToggle}
        />
      </View>

      {/* Club Team Information */}
      {showClubFields && (
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Club Team Information
          </Text>
          
          <FormInput
            label="Club Organization"
            placeholder="Enter club organization name"
            value={profile.club?.organization || ''}
            onChangeText={handleClubOrganizationChange}
            required
            hint="Organization name (e.g., 'Elite Lacrosse Club')"
            success={!!(profile.club?.organization && profile.club.organization.length > 2)}
          />

          <FormInput
            label="Team Name"
            placeholder="Enter your team name"
            value={profile.club?.teamName || ''}
            onChangeText={handleClubTeamNameChange}
            required
            hint="Specific team within the organization (e.g., '2025 Blue')"
            success={!!(profile.club?.teamName && profile.club.teamName.length > 1)}
          />
        </View>
      )}

      {/* Team Type Summary */}
      {(profile.school?.name || profile.club?.organization) && (
        <View className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-xl">
          <Text className="text-green-400 text-sm font-medium mb-2">
            🏫 Your Teams:
          </Text>
          {profile.school?.name && (
            <Text className="text-gray-300 text-sm">
              • High School: {profile.school.name} ({profile.school.city}, {profile.school.state})
            </Text>
          )}
          {profile.club?.organization && (
            <Text className="text-gray-300 text-sm">
              • Club: {profile.club.teamName} - {profile.club.organization}
            </Text>
          )}
        </View>
      )}

      {/* Helper Text */}
      <View className="mt-6">
        <Text className="text-gray-500 text-sm text-center leading-5">
          This helps us organize your stats by team and provide relevant benchmarks for your level of play.
        </Text>
      </View>
    </View>
  )
}