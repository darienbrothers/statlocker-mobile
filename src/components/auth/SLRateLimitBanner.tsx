import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Clock, Shield, AlertTriangle } from 'lucide-react-native';
import { RateLimitResult } from '@/types/security';

export interface SLRateLimitBannerProps {
  rateLimitResult: RateLimitResult;
  onExpired?: () => void;
  testID?: string;
}

export function SLRateLimitBanner({
  rateLimitResult,
  onExpired,
  testID,
}: SLRateLimitBannerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.ceil(rateLimitResult.remainingLockoutMs / 1000)
  );

  // Countdown timer
  useEffect(() => {
    if (!rateLimitResult.isLockedOut || remainingSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = prev - 1;
        
        if (newValue <= 0) {
          onExpired?.();
          return 0;
        }
        
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitResult.isLockedOut, remainingSeconds, onExpired]);

  // Update remaining seconds when rate limit result changes
  useEffect(() => {
    setRemainingSeconds(Math.ceil(rateLimitResult.remainingLockoutMs / 1000));
  }, [rateLimitResult.remainingLockoutMs]);

  // Don't render if not locked out
  if (!rateLimitResult.isLockedOut) {
    return null;
  }

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const timeDisplay = formatTime(remainingSeconds);
  const isExpiringSoon = remainingSeconds <= 60;

  return (
    <View 
      className={`mx-6 mb-4 p-4 rounded-xl border ${
        isExpiringSoon 
          ? 'bg-orange-50 border-orange-200' 
          : 'bg-red-50 border-red-200'
      }`}
      testID={testID}
    >
      <View className="flex-row items-center mb-3">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
          isExpiringSoon ? 'bg-orange-100' : 'bg-red-100'
        }`}>
          {isExpiringSoon ? (
            <Clock size={18} color="#EA580C" />
          ) : (
            <Shield size={18} color="#DC2626" />
          )}
        </View>
        
        <View className="flex-1">
          <Text className={`font-semibold ${
            isExpiringSoon ? 'text-orange-900' : 'text-red-900'
          }`}>
            {isExpiringSoon ? 'Almost ready!' : 'Too many attempts'}
          </Text>
          <Text className={`text-sm ${
            isExpiringSoon ? 'text-orange-700' : 'text-red-700'
          }`}>
            {isExpiringSoon 
              ? 'You can try signing in again soon' 
              : 'Please wait before trying again'
            }
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className={`text-2xl font-bold tabular-nums ${
            isExpiringSoon ? 'text-orange-900' : 'text-red-900'
          }`}>
            {timeDisplay}
          </Text>
          <Text className={`text-sm ${
            isExpiringSoon ? 'text-orange-600' : 'text-red-600'
          }`}>
            {remainingSeconds <= 60 ? 'seconds remaining' : 'minutes remaining'}
          </Text>
        </View>
        
        <View className="w-16 h-16 items-center justify-center">
          <View className={`w-12 h-12 rounded-full border-4 items-center justify-center ${
            isExpiringSoon 
              ? 'border-orange-200 bg-orange-100' 
              : 'border-red-200 bg-red-100'
          }`}>
            <Text className={`text-xs font-bold ${
              isExpiringSoon ? 'text-orange-800' : 'text-red-800'
            }`}>
              {Math.ceil(remainingSeconds / 60)}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-200">
        <View className="flex-row items-start">
          <AlertTriangle 
            size={16} 
            color={isExpiringSoon ? '#EA580C' : '#DC2626'} 
            className="mr-2 mt-0.5" 
          />
          <Text className={`text-sm leading-relaxed flex-1 ${
            isExpiringSoon ? 'text-orange-700' : 'text-red-700'
          }`}>
            This security measure protects your account from unauthorized access attempts. 
            {isExpiringSoon 
              ? 'You\'ll be able to try again in less than a minute.' 
              : 'Please double-check your credentials before trying again.'
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

export function useRateLimitCountdown(rateLimitResult: RateLimitResult) {
  const [remainingMs, setRemainingMs] = useState(rateLimitResult.remainingLockoutMs);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!rateLimitResult.isLockedOut || remainingMs <= 0) {
      setIsExpired(true);
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + remainingMs;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      setRemainingMs(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitResult.isLockedOut, rateLimitResult.remainingLockoutMs]);

  return {
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    remainingMinutes: Math.ceil(remainingMs / (1000 * 60)),
    isExpired,
    isExpiringSoon: remainingMs <= 60000,
  };
}

export default SLRateLimitBanner;