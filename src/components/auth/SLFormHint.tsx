/**
 * SLFormHint - StatLocker Form Hint Component
 * 
 * A component for displaying inline validation feedback, tips,
 * and contextual information in forms
 */

import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

export interface SLFormHintProps {
  /** Hint text to display */
  text: string;
  
  /** Type of hint */
  type?: 'info' | 'success' | 'warning' | 'error';
  
  /** Whether to show an icon */
  showIcon?: boolean;
  
  /** Custom icon to display */
  customIcon?: React.ReactNode;
  
  /** Size variant */
  size?: 'small' | 'medium';
  
  /** Test ID for testing */
  testID?: string;
}

export const SLFormHint: React.FC<SLFormHintProps> = ({
  text,
  type = 'info',
  showIcon = true,
  customIcon,
  size = 'medium',
  testID,
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      text: 'text-xs',
      icon: 14,
      spacing: 'mt-1',
    },
    medium: {
      text: 'text-sm',
      icon: 16,
      spacing: 'mt-2',
    },
  };

  const config = sizeConfig[size];

  // Type configurations
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          textColor: 'text-green-600',
          iconColor: '#16A34A',
          icon: CheckCircle,
        };
      
      case 'warning':
        return {
          textColor: 'text-amber-600',
          iconColor: '#D97706',
          icon: AlertTriangle,
        };
      
      case 'error':
        return {
          textColor: 'text-red-600',
          iconColor: '#DC2626',
          icon: AlertCircle,
        };
      
      case 'info':
      default:
        return {
          textColor: 'text-gray-600',
          iconColor: '#6B7280',
          icon: Info,
        };
    }
  };

  const typeStyles = getTypeStyles();
  const IconComponent = typeStyles.icon;

  // Accessibility
  const accessibilityRole = type === 'error' ? 'alert' : 'text';
  const accessibilityLabel = `${type} message: ${text}`;

  return (
    <View 
      className={`flex-row items-start ${config.spacing}`}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Icon */}
      {(showIcon || customIcon) && (
        <View className="mr-2 mt-0.5">
          {customIcon || (
            <IconComponent 
              size={config.icon} 
              color={typeStyles.iconColor}
              testID={`${testID}-icon`}
            />
          )}
        </View>
      )}

      {/* Text */}
      <Text 
        className={`${config.text} ${typeStyles.textColor} flex-1 leading-relaxed`}
        testID={`${testID}-text`}
      >
        {text}
      </Text>
    </View>
  );
};

/**
 * SLFormHintList - Component for displaying multiple hints
 */
export interface SLFormHintListProps {
  /** List of hints to display */
  hints: Array<{
    text: string;
    type?: SLFormHintProps['type'];
    id?: string;
  }>;
  
  /** Size variant */
  size?: 'small' | 'medium';
  
  /** Test ID for testing */
  testID?: string;
}

export const SLFormHintList: React.FC<SLFormHintListProps> = ({
  hints,
  size = 'medium',
  testID,
}) => {
  if (hints.length === 0) return null;

  return (
    <View testID={testID}>
      {hints.map((hint, index) => (
        <SLFormHint
          key={hint.id || index}
          text={hint.text}
          type={hint.type}
          size={size}
          testID={`${testID}-hint-${index}`}
        />
      ))}
    </View>
  );
};

/**
 * Password Strength Indicator Component
 */
export interface SLPasswordStrengthProps {
  /** Password strength score (0-4) */
  score: number;
  
  /** Feedback messages */
  feedback: string[];
  
  /** Requirements checklist */
  requirements?: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
  
  /** Size variant */
  size?: 'small' | 'medium';
  
  /** Test ID for testing */
  testID?: string;
}

export const SLPasswordStrength: React.FC<SLPasswordStrengthProps> = ({
  score,
  feedback,
  requirements,
  size = 'medium',
  testID,
}) => {
  // Strength level configuration
  const strengthConfig = {
    0: { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
    1: { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-600' },
    2: { label: 'Fair', color: 'bg-amber-400', textColor: 'text-amber-600' },
    3: { label: 'Good', color: 'bg-green-400', textColor: 'text-green-600' },
    4: { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' },
  };

  const strength = strengthConfig[score as keyof typeof strengthConfig];

  return (
    <View className="mt-2" testID={testID}>
      {/* Strength Meter */}
      <View className="flex-row items-center mb-2">
        <Text className={`text-sm font-medium mr-3 ${strength.textColor}`}>
          {strength.label}
        </Text>
        
        {/* Strength Bars */}
        <View className="flex-row flex-1 space-x-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              className={`h-2 flex-1 rounded-full ${
                level <= score ? strength.color : 'bg-gray-200'
              }`}
              testID={`${testID}-bar-${level}`}
            />
          ))}
        </View>
      </View>

      {/* Requirements Checklist */}
      {requirements && (
        <View className="space-y-1">
          {Object.entries(requirements).map(([key, met]) => {
            const labels = {
              length: '8+ characters',
              uppercase: 'Uppercase letter',
              lowercase: 'Lowercase letter',
              numbers: 'Number',
              specialChars: 'Special character',
            };
            
            return (
              <SLFormHint
                key={key}
                text={labels[key as keyof typeof labels]}
                type={met ? 'success' : 'info'}
                size={size}
                testID={`${testID}-requirement-${key}`}
              />
            );
          })}
        </View>
      )}

      {/* Feedback Messages */}
      {feedback.length > 0 && (
        <SLFormHintList
          hints={feedback.map((text, index) => ({
            text,
            type: index === 0 ? (score >= 3 ? 'success' : 'info') : 'info',
            id: `feedback-${index}`,
          }))}
          size={size}
          testID={`${testID}-feedback`}
        />
      )}
    </View>
  );
};