import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useOnboardingTheme } from './OnboardingThemeProvider'
import { ConflictResolution } from '@/types/onboarding'

interface ConflictResolutionModalProps {
  conflict: ConflictResolution | null
  visible: boolean
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void
  onCancel: () => void
  isResolving?: boolean
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  visible,
  onResolve,
  onCancel,
  isResolving = false
}) => {
  const { tokens } = useOnboardingTheme()
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | 'merge' | null>(null)

  if (!conflict) return null

  const { localProgress, remoteProgress, conflictFields } = conflict

  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDeviceName = (deviceId: string): string => {
    const parts = deviceId.split('_')
    return parts[1] ? `Device ${parts[1].slice(0, 6)}` : 'Unknown Device'
  }

  const getStepDifference = (): { local: number, remote: number, diff: number } => {
    const localStep = localProgress.currentStep
    const remoteStep = remoteProgress.currentStep
    return {
      local: localStep,
      remote: remoteStep,
      diff: Math.abs(localStep - remoteStep)
    }
  }

  const getCompletionDifference = (): { local: number, remote: number } => {
    return {
      local: localProgress.completedSteps.length,
      remote: remoteProgress.completedSteps.length
    }
  }

  const handleResolve = () => {
    if (!selectedResolution) {
      Alert.alert('Selection Required', 'Please select a resolution option.')
      return
    }

    Alert.alert(
      'Confirm Resolution',
      `Are you sure you want to ${selectedResolution === 'local' ? 'use local data' : 
        selectedResolution === 'remote' ? 'use remote data' : 'merge both datasets'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onResolve(selectedResolution) }
      ]
    )
  }

  const stepDiff = getStepDifference()
  const completionDiff = getCompletionDifference()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 12,
              padding: 8,
              marginRight: 12
            }}>
              <Ionicons name="warning" size={24} color="#F59E0B" />
            </View>
            <View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1F2937'
              }}>
                Sync Conflict
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B7280'
              }}>
                Choose which data to keep
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              padding: 8,
              borderRadius: 8
            }}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Conflict Summary */}
          <View style={{ padding: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              marginBottom: 8
            }}>
              Conflict Summary
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              lineHeight: 20,
              marginBottom: 16
            }}>
              Your onboarding progress differs between devices. This can happen when you use multiple devices or lose internet connection.
            </Text>

            {/* Conflict Details */}
            <View style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#92400E',
                marginBottom: 8
              }}>
                Conflicting Fields:
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#92400E'
              }}>
                {conflictFields.join(', ')}
              </Text>
            </View>
          </View>

          {/* Resolution Options */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              marginBottom: 16
            }}>
              Resolution Options
            </Text>

            {/* Local Option */}
            <TouchableOpacity
              onPress={() => setSelectedResolution('local')}
              style={{
                borderWidth: 2,
                borderColor: selectedResolution === 'local' ? '#0047AB' : '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                backgroundColor: selectedResolution === 'local' ? '#F0F7FF' : '#FFFFFF'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons 
                  name="phone-portrait" 
                  size={20} 
                  color={selectedResolution === 'local' ? '#0047AB' : '#6B7280'} 
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: selectedResolution === 'local' ? '#0047AB' : '#1F2937',
                  marginLeft: 8
                }}>
                  Use This Device ({getDeviceName(localProgress.deviceId)})
                </Text>
              </View>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 8
              }}>
                Last updated: {formatDate(localProgress.lastUpdated)}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  Step {stepDiff.local} • {completionDiff.local} completed
                </Text>
                {selectedResolution === 'local' && (
                  <Ionicons name="checkmark-circle" size={16} color="#0047AB" />
                )}
              </View>
            </TouchableOpacity>

            {/* Remote Option */}
            <TouchableOpacity
              onPress={() => setSelectedResolution('remote')}
              style={{
                borderWidth: 2,
                borderColor: selectedResolution === 'remote' ? '#0047AB' : '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                backgroundColor: selectedResolution === 'remote' ? '#F0F7FF' : '#FFFFFF'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons 
                  name="cloud" 
                  size={20} 
                  color={selectedResolution === 'remote' ? '#0047AB' : '#6B7280'} 
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: selectedResolution === 'remote' ? '#0047AB' : '#1F2937',
                  marginLeft: 8
                }}>
                  Use Cloud Data ({getDeviceName(remoteProgress.deviceId)})
                </Text>
              </View>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 8
              }}>
                Last updated: {formatDate(remoteProgress.lastUpdated)}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  Step {stepDiff.remote} • {completionDiff.remote} completed
                </Text>
                {selectedResolution === 'remote' && (
                  <Ionicons name="checkmark-circle" size={16} color="#0047AB" />
                )}
              </View>
            </TouchableOpacity>

            {/* Merge Option */}
            <TouchableOpacity
              onPress={() => setSelectedResolution('merge')}
              style={{
                borderWidth: 2,
                borderColor: selectedResolution === 'merge' ? '#0047AB' : '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                backgroundColor: selectedResolution === 'merge' ? '#F0F7FF' : '#FFFFFF'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons 
                  name="git-merge" 
                  size={20} 
                  color={selectedResolution === 'merge' ? '#0047AB' : '#6B7280'} 
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: selectedResolution === 'merge' ? '#0047AB' : '#1F2937',
                  marginLeft: 8
                }}>
                  Merge Both (Recommended)
                </Text>
              </View>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 8
              }}>
                Combines data from both sources intelligently
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  Keeps the most complete data from both devices
                </Text>
                {selectedResolution === 'merge' && (
                  <Ionicons name="checkmark-circle" size={16} color="#0047AB" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          gap: 12
        }}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={isResolving}
            style={{
              flex: 1,
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center'
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#6B7280'
            }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResolve}
            disabled={!selectedResolution || isResolving}
            style={{
              flex: 2,
              backgroundColor: selectedResolution ? '#0047AB' : '#D1D5DB',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            {isResolving ? (
              <>
                <Ionicons name="sync" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#FFFFFF'
                }}>
                  Resolving...
                </Text>
              </>
            ) : (
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#FFFFFF'
              }}>
                Apply Resolution
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}