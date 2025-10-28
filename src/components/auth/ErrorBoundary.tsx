/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in the component tree and displays
 * a fallback UI with error recovery options.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react-native';
import { SLButton } from '@/components/auth';
import { errorHandlingService } from '@/services/ErrorHandlingService';
import { router } from 'expo-router';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  testID?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Process the error through our error handling service
    const processedError = errorHandlingService.processError(error, {
      route: window.location?.pathname || 'unknown',
      action: 'component_render',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    });

    this.setState({
      errorInfo,
      errorId: processedError.errorId,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    console.error('ErrorBoundary: Caught error', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleGoHome = () => {
    router.replace('/');
    this.handleRetry();
  };

  handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.handleRetry();
    }
  };

  handleContactSupport = () => {
    // This would typically open a support modal or navigate to support
    console.log('Contact support requested', { errorId: this.state.errorId });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const processedError = error ? errorHandlingService.processError(error) : null;

      return (
        <View style={{ 
          flex: 1, 
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24 
        }} testID={this.props.testID}>
          <ScrollView 
            style={{ flex: 1, width: '100%' }} 
            contentContainerStyle={{ 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '100%' 
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={{ 
              width: 80, 
              height: 80, 
              backgroundColor: '#FEE2E2', 
              borderRadius: 40, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 24 
            }}>
              <AlertTriangle size={40} color="#DC2626" />
            </View>

            {/* Error Title */}
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '600', 
              color: '#111827',
              textAlign: 'center',
              marginBottom: 12 
            }}>
              Oops! Something went wrong
            </Text>

            {/* Error Message */}
            <Text style={{ 
              fontSize: 16, 
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 24,
              maxWidth: 320 
            }}>
              {processedError?.mapping.userMessage || 
               'An unexpected error occurred. We\'re working to fix this issue.'}
            </Text>

            {/* Error ID */}
            {errorId && (
              <View style={{ 
                backgroundColor: '#F3F4F6', 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                borderRadius: 6, 
                marginBottom: 24 
              }}>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#6B7280',
                  fontFamily: 'monospace' 
                }}>
                  Error ID: {errorId}
                </Text>
              </View>
            )}

            {/* Recovery Actions */}
            <View style={{ width: '100%', maxWidth: 320, gap: 12 }}>
              <SLButton
                variant="primary"
                onPress={this.handleRetry}
                fullWidth
                testID="retry-button"
              >
                <RefreshCw size={20} color="white" style={{ marginRight: 8 }} />
                Try Again
              </SLButton>

              <SLButton
                variant="secondary"
                onPress={this.handleGoHome}
                fullWidth
                testID="go-home-button"
              >
                <Home size={20} color="#374151" style={{ marginRight: 8 }} />
                Go to Home
              </SLButton>

              <SLButton
                variant="secondary"
                onPress={this.handleRefresh}
                fullWidth
                testID="refresh-button"
              >
                <RefreshCw size={20} color="#374151" style={{ marginRight: 8 }} />
                Refresh App
              </SLButton>

              <SLButton
                variant="ghost"
                onPress={this.handleContactSupport}
                fullWidth
                testID="contact-support-button"
              >
                <MessageCircle size={20} color="#6B7280" style={{ marginRight: 8 }} />
                Contact Support
              </SLButton>
            </View>

            {/* Error Details (Development) */}
            {this.props.showErrorDetails && error && (
              <View style={{ 
                marginTop: 32, 
                padding: 16, 
                backgroundColor: '#F9FAFB', 
                borderRadius: 8, 
                width: '100%' 
              }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: 8 
                }}>
                  Error Details (Development)
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#6B7280',
                  fontFamily: 'monospace',
                  lineHeight: 16 
                }}>
                  {error.name}: {error.message}
                </Text>
                {error.stack && (
                  <Text style={{ 
                    fontSize: 10, 
                    color: '#9CA3AF',
                    fontFamily: 'monospace',
                    marginTop: 8,
                    lineHeight: 14 
                  }}>
                    {error.stack}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function ErrorBoundaryWrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const handleError = (error: Error, context?: any) => {
    const processedError = errorHandlingService.processError(error, context);
    
    // In a real implementation, you might want to show a toast or modal
    console.error('useErrorHandler: Error handled', processedError);
    
    return processedError;
  };

  const getUserMessage = (error: Error, context?: any) => {
    return errorHandlingService.getUserMessage(error, context);
  };

  const getRecoveryActions = (error: Error, context?: any) => {
    return errorHandlingService.getRecoveryActions(error, context);
  };

  const isRetryable = (error: Error) => {
    return errorHandlingService.isRetryable(error);
  };

  return {
    handleError,
    getUserMessage,
    getRecoveryActions,
    isRetryable,
  };
}

export default ErrorBoundary;