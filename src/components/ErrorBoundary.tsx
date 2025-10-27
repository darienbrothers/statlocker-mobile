/**
 * ErrorBoundary Component - Global error boundary with friendly recovery UI
 * 
 * Features:
 * - Catches JavaScript errors anywhere in the component tree
 * - Friendly recovery UI with "Try Again" action
 * - Error logging for monitoring and debugging
 * - StatLocker brand styling
 */
import React, { Component, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { t } from '@/lib/i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Send to error logging service
    const { logError } = require('@/lib');
    logError('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View className="flex-1 items-center justify-center px-8 bg-white">
          <Text className="text-6xl mb-6">😵</Text>
          
          <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
            {t('error.generic')}
          </Text>
          
          <Text className="text-base text-gray-500 text-center mb-8 leading-6">
            {t('error.network')}
          </Text>
          
          <Button
            variant="primary"
            onPress={this.handleRetry}
            className="mb-4"
          >
            {t('common.tryAgain')}
          </Button>
          
          {__DEV__ && this.state.error && (
            <View className="mt-8 p-4 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-sm font-medium text-red-800 mb-2">
                Debug Info (Development Only):
              </Text>
              <Text className="text-xs text-red-600 font-mono">
                {this.state.error.message}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;