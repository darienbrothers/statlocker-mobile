import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStartOver } from '@/hooks/onboarding/useStartOver'
import { useProgressPersistence } from '@/hooks/onboarding/useProgressPersistence'
import { getOfflineQueueStatus, forceSyncOfflineQueue } from '@/lib/onboarding/offlineQueue'
import { OnboardingProfile } from '@/types/onboarding'

interface OnboardingSettingsProps {
  currentProfile?: OnboardingProfile
  currentStep?: number
  onClose?: () => void
}

export const OnboardingSettings: React.FC<OnboardingSettingsProps> = ({
  currentProfile,
  currentStep = 0,
  onClose
}) => {
  const [syncStatus, setSyncStatus] = useState(getOfflineQueueStatus())
  
  const {
    startOver,
    resetSection,
    exportProgressData,
    isResetting,
    isExporting,
    canReset
  } = useStartOver({
    currentProfile,
    currentStep
  })

  const {
    saveProgress,
    clearProgress,
    getQueueStatus
  } = useProgressPersistence({
    profile: currentProfile || {},
    currentStep,
    completedSteps: new Set()
  })

  const handleManualSync = async () => {
    try {
      await forceSyncOfflineQueue()
      setSyncStatus(getOfflineQueueStatus())
      Alert.alert('Sync Complete', 'Your progress has been synced to the cloud.')
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to sync your progress. Please check your internet connection.')
    }
  }

  const handleExportProgress = async () => {
    try {
      await exportProgressData()
      Alert.alert('Export Complete', 'Your progress has been exported successfully.')
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export your progress.')
    }
  }

  const SettingItem: React.FC<{
    icon: string
    title: string
    subtitle?: string
    onPress: () => void
    disabled?: boolean
    destructive?: boolean
    loading?: boolean
  }> = ({ icon, title, subtitle, onPress, disabled, destructive, loading }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <View style={{
        backgroundColor: destructive ? '#FEE2E2' : '#F0F7FF',
        borderRadius: 12,
        padding: 10,
        marginRight: 16
      }}>
        <Ionicons 
          name={loading ? "sync" : icon as any} 
          size={20} 
          color={destructive ? '#EF4444' : '#0047AB'} 
        />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: destructive ? '#EF4444' : '#1F2937',
          marginBottom: subtitle ? 4 : 0
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: '#6B7280'
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#1F2937'
        }}>
          Onboarding Settings
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Progress Section */}
        <View style={{ marginTop: 20 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            paddingHorizontal: 20,
            marginBottom: 12
          }}>
            Progress Management
          </Text>

          <SettingItem
            icon="save"
            title="Save Progress"
            subtitle="Manually save your current progress"
            onPress={() => saveProgress()}
          />

          <SettingItem
            icon="cloud-upload"
            title="Sync to Cloud"
            subtitle={`${syncStatus.itemCount} items pending sync`}
            onPress={handleManualSync}
            disabled={syncStatus.itemCount === 0}
          />

          <SettingItem
            icon="download"
            title="Export Progress"
            subtitle="Download a backup of your progress"
            onPress={handleExportProgress}
            loading={isExporting}
          />
        </View>

        {/* Reset Section */}
        <View style={{ marginTop: 32 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            paddingHorizontal: 20,
            marginBottom: 12
          }}>
            Reset Options
          </Text>

          <SettingItem
            icon="refresh"
            title="Reset Goals"
            subtitle="Clear your selected goals"
            onPress={() => resetSection('goals')}
            destructive
          />

          <SettingItem
            icon="person"
            title="Reset Profile"
            subtitle="Clear your personal information"
            onPress={() => resetSection('profile')}
            destructive
          />

          <SettingItem
            icon="settings"
            title="Reset Preferences"
            subtitle="Clear your AI tone and preferences"
            onPress={() => resetSection('preferences')}
            destructive
          />

          <SettingItem
            icon="trash"
            title="Start Over Completely"
            subtitle="Delete all progress and start fresh"
            onPress={() => startOver()}
            disabled={!canReset()}
            destructive
            loading={isResetting}
          />
        </View>

        {/* Debug Section (Development only) */}
        {__DEV__ && (
          <View style={{ marginTop: 32, marginBottom: 40 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingHorizontal: 20,
              marginBottom: 12
            }}>
              Debug (Development Only)
            </Text>

            <SettingItem
              icon="bug"
              title="Clear All Data"
              subtitle="Nuclear option - clears everything"
              onPress={() => clearProgress()}
              destructive
            />

            <SettingItem
              icon="information-circle"
              title="Queue Status"
              subtitle={`${syncStatus.itemCount} items, processing: ${syncStatus.isProcessing}`}
              onPress={() => {
                Alert.alert('Queue Status', JSON.stringify(syncStatus, null, 2))
              }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}