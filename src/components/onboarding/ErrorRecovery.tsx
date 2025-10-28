import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Icon } from '../Icon'
import { useOnboardingTheme } from './OnboardingThemeProvider'
import type { OnboardingError } from '../../types/onboarding'
import type { ValidationError } from '../../lib/onboarding/profileValidation'

interface ErrorRecoveryProps {
  error: OnboardingError | null
  validationErrors?: ValidationError[]
  isRetrying?: boolean
  canRetry?: boolean
  retryCount?: number
  maxRetries?: number
  onRetry?: () => void
  onDismiss?: () => void
  recoveryActions?: string[]
  showDetails?: boolean
}

/**
 * Error recovery component for onboarding
 * Provides user-friendly error messages and recovery actions
 */
export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  validationErrors = [],
  isRetrying = false,
  canRetry = true,
  retryCount = 0,
  maxRetries = 3,
  onRetry,
  onDismiss,
  recoveryActions = [],
  showDetails = false
}) => {
  const { tokens } = useOnboardingTheme()
  
  if (!error && validationErrors.length === 0) {
    return null
  }

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return 'wifi-off'
      case 'validation':
        return 'alert-circle'
      case 'authentication':
        return 'lock'
      case 'storage':
        return 'database'
      default:
        return 'alert-triangle'
    }
  }

  const getErrorColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return {
          backgroundColor: `${tokens.colors.danger}20`,
          borderColor: tokens.colors.danger,
          textColor: tokens.colors.danger,
          iconColor: tokens.colors.danger
        }
      case 'warning':
        return {
          backgroundColor: `${tokens.colors.warning}20`,
          borderColor: tokens.colors.warning,
          textColor: tokens.colors.warning,
          iconColor: tokens.colors.warning
        }
      default:
        return {
          backgroundColor: `${tokens.colors.danger}20`,
          borderColor: tokens.colors.danger,
          textColor: tokens.colors.danger,
          iconColor: tokens.colors.danger
        }
    }
  }

  // Handle validation errors
  if (validationErrors.length > 0) {
    const criticalErrors = validationErrors.filter(e => !e.retryable)
    const recoverableErrors = validationErrors.filter(e => e.retryable)
    
    return (
      <View className="space-y-4">
        {/* Critical Errors */}
        {criticalErrors.length > 0 && (
          <View className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <View className="flex-row items-center mb-3">
              <Icon name="x-circle" size={20} color="#EF4444" />
              <Text className="text-red-400 font-semibold ml-2">
                Critical Issues Found
              </Text>
            </View>
            
            <Text className="text-red-300 text-sm mb-3">
              These issues must be resolved before continuing:
            </Text>
            
            {criticalErrors.map((error, index) => (
              <View key={index} className="mb-2">
                <Text className="text-red-300 text-sm">
                  • {error.message}
                </Text>
                {error.suggestedFix && (
                  <Text className="text-red-400 text-xs ml-4 mt-1">
                    💡 {error.suggestedFix}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recoverable Errors */}
        {recoverableErrors.length > 0 && (
          <View className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <View className="flex-row items-center mb-3">
              <Icon name="alert-circle" size={20} color="#F59E0B" />
              <Text className="text-yellow-400 font-semibold ml-2">
                Please Fix These Issues
              </Text>
            </View>
            
            {recoverableErrors.map((error, index) => (
              <View key={index} className="mb-2">
                <Text className="text-yellow-300 text-sm">
                  • {error.message}
                </Text>
                {error.suggestedFix && (
                  <Text className="text-yellow-400 text-xs ml-4 mt-1">
                    💡 {error.suggestedFix}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  // Handle system errors
  if (error) {
    const colors = getErrorColor('error')
    
    return (
      <View className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <Icon 
              name={getErrorIcon(error.type)} 
              size={20} 
              color={colors.icon} 
            />
            <Text className={`${colors.text} font-semibold ml-2 flex-1`}>
              {getErrorTitle(error.type)}
            </Text>
          </View>
          
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} className="ml-2">
              <Icon name="x" size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-red-300 text-sm mb-3">
          {getUserFriendlyMessage(error)}
        </Text>

        {/* Recovery Actions */}
        {recoveryActions.length > 0 && (
          <View className="mb-4">
            <Text className="text-red-400 font-medium text-sm mb-2">
              What you can try:
            </Text>
            {recoveryActions.map((action, index) => (
              <Text key={index} className="text-red-300 text-sm">
                • {action}
              </Text>
            ))}
          </View>
        )}

        {/* Retry Section */}
        {error.retryable && (
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              {retryCount > 0 && (
                <Text className="text-red-400 text-xs">
                  Attempt {retryCount} of {maxRetries}
                </Text>
              )}
            </View>
            
            {canRetry && onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                disabled={isRetrying}
                className={`flex-row items-center px-4 py-2 rounded-lg ${
                  isRetrying ? 'bg-gray-600' : 'bg-red-600'
                }`}
              >
                {isRetrying ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Icon name="refresh-cw" size={16} color="white" />
                )}
                <Text className="text-white font-medium ml-2">
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Error Details (for debugging) */}
        {showDetails && (
          <View className="mt-4 pt-3 border-t border-red-700">
            <Text className="text-red-400 font-medium text-xs mb-1">
              Error Details:
            </Text>
            <Text className="text-red-300 text-xs font-mono">
              Type: {error.type}
            </Text>
            <Text className="text-red-300 text-xs font-mono">
              Message: {error.message}
            </Text>
            {error.step && (
              <Text className="text-red-300 text-xs font-mono">
                Step: {error.step}
              </Text>
            )}
            <Text className="text-red-300 text-xs font-mono">
              Time: {error.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>
    )
  }

  return null
}

/**
 * Get user-friendly error title
 */
function getErrorTitle(errorType: string): string {
  const titles: Record<string, string> = {
    'network': 'Connection Issue',
    'validation': 'Information Needed',
    'authentication': 'Account Issue',
    'storage': 'Save Issue',
    'unknown': 'Something Went Wrong'
  }
  
  return titles[errorType] || 'Error'
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error: OnboardingError): string {
  const messages: Record<string, string> = {
    'network': 'We couldn\'t connect right now. Check your internet connection and try again.',
    'validation': 'Please check the highlighted fields and make sure all required information is provided.',
    'authentication': 'There was an issue with your account credentials. Please check your email and password.',
    'storage': 'We couldn\'t save your progress. Please try again in a moment.',
    'unknown': 'Something unexpected happened. Please try again or contact support if the problem continues.'
  }
  
  return messages[error.type] || error.message
}