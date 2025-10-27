/**
 * StatCard Component - Specialized card for displaying statistics
 * 
 * Features:
 * - Consistent hierarchy: title (15-16pt semibold), value (22-24pt bold), delta chip
 * - Right-aligned delta indicators
 * - Success/danger color states for delta values
 * - Stable number formatting
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Card, type CardProps } from './Card';

export type DeltaType = 'positive' | 'negative' | 'neutral';

export interface StatCardProps extends Omit<CardProps, 'children'> {
  title: string;
  value: string | number;
  delta?: {
    value: string | number;
    type: DeltaType;
    label?: string;
  };
  subtitle?: string;
  testID?: string;
}

export function StatCard({
  title,
  value,
  delta,
  subtitle,
  testID,
  ...cardProps
}: StatCardProps) {
  // Format value for display
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Handle percentage values
      if (val >= 0 && val <= 1) {
        return `${(val * 100).toFixed(1)}%`;
      }
      // Handle regular numbers
      return val.toLocaleString();
    }
    return val;
  };

  // Format delta value
  const formatDelta = (val: string | number): string => {
    if (typeof val === 'number') {
      const sign = val > 0 ? '+' : '';
      if (val >= -1 && val <= 1 && val !== 0) {
        return `${sign}${(val * 100).toFixed(1)}%`;
      }
      return `${sign}${val.toLocaleString()}`;
    }
    return val;
  };

  // Delta styling
  const getDeltaClasses = (type: DeltaType): string => {
    const baseClasses = 'px-2 py-1 rounded-lg text-xs font-medium';
    
    switch (type) {
      case 'positive':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'negative':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'neutral':
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  return (
    <Card testID={testID} {...cardProps}>
      <View className="flex-1">
        {/* Header with title and delta */}
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-gray-600 text-base font-semibold flex-1">
            {title}
          </Text>
          
          {delta && (
            <View className={getDeltaClasses(delta.type)}>
              <Text className="text-xs font-medium">
                {formatDelta(delta.value)}
                {delta.label && ` ${delta.label}`}
              </Text>
            </View>
          )}
        </View>

        {/* Main value */}
        <Text className="text-gray-900 text-2xl font-bold mb-1">
          {formatValue(value)}
        </Text>

        {/* Subtitle if provided */}
        {subtitle && (
          <Text className="text-gray-500 text-sm">
            {subtitle}
          </Text>
        )}
      </View>
    </Card>
  );
}

export default StatCard;