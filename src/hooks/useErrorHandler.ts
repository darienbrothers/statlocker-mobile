/**
 * useErrorHandler Hook - Error handling utilities for functional components
 * 
 * Features:
 * - Centralized error handling
 * - Error logging integration
 * - User-friendly error messages
 * - Recovery actions
 */
import { useCallback } from 'react';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  userMessage?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: Error | AppError,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'Something went wrong. Please try again.',
    } = options;

    // Get user-friendly message
    const userMessage = getUserFriendlyMessage(error, fallbackMessage);

    // Log error for debugging
    if (logError) {
      console.error('Error handled:', error);
      // Send to error logging service
      const { logError: logToService } = require('@/lib');
      logToService('Error handled by useErrorHandler', error, {
        userMessage,
        showToast,
      });
    }

    // Show toast notification if requested
    if (showToast) {
      // TODO: Show toast notification
      console.warn('Error toast:', userMessage);
    }

    return userMessage;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
}

function getUserFriendlyMessage(error: Error | AppError, fallback: string): string {
  // Check if error has a user-friendly message
  if ('userMessage' in error && error.userMessage) {
    return error.userMessage;
  }

  // Handle common error types
  if (error.message.includes('Network')) {
    return 'Please check your internet connection and try again.';
  }

  if (error.message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }

  if ('statusCode' in error) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please sign in to continue.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return fallback;
    }
  }

  return fallback;
}

export default useErrorHandler;