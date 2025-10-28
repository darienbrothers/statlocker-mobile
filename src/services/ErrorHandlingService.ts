/**
 * Error Handling Service
 * 
 * Provides comprehensive error mapping, localization, and recovery
 * suggestions for authentication and application errors.
 */

import { logError, logInfo } from '@/lib/logging';
import { auditLogService } from './AuditLogService';

export interface ErrorMapping {
  code: string;
  userMessage: string;
  technicalMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'network' | 'validation' | 'system' | 'business';
  retryable: boolean;
  recoveryActions?: ErrorRecoveryAction[];
  localizationKey?: string;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'navigate' | 'contact_support' | 'refresh' | 'custom';
  label: string;
  action: string | (() => void);
  primary?: boolean;
}

export interface ProcessedError {
  originalError: any;
  mapping: ErrorMapping;
  context: ErrorContext;
  timestamp: Date;
  errorId: string;
}

export interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorMappings: Map<string, ErrorMapping> = new Map();
  private locale: string = 'en';

  private constructor() {
    this.initializeErrorMappings();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Process and map an error to user-friendly information
   */
  public processError(error: any, context?: ErrorContext): ProcessedError {
    const errorCode = this.extractErrorCode(error);
    const mapping = this.getErrorMapping(errorCode);
    const errorId = this.generateErrorId();

    const processedError: ProcessedError = {
      originalError: error,
      mapping,
      context: context || {},
      timestamp: new Date(),
      errorId,
    };

    // Log the error
    this.logError(processedError);

    return processedError;
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(error: any, context?: ErrorContext): string {
    const processed = this.processError(error, context);
    return this.localizeMessage(processed.mapping.userMessage, processed.mapping.localizationKey);
  }

  /**
   * Get error recovery actions
   */
  public getRecoveryActions(error: any, context?: ErrorContext): ErrorRecoveryAction[] {
    const processed = this.processError(error, context);
    return processed.mapping.recoveryActions || [];
  }

  /**
   * Check if error is retryable
   */
  public isRetryable(error: any): boolean {
    const errorCode = this.extractErrorCode(error);
    const mapping = this.getErrorMapping(errorCode);
    return mapping.retryable;
  }

  /**
   * Get error severity
   */
  public getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const errorCode = this.extractErrorCode(error);
    const mapping = this.getErrorMapping(errorCode);
    return mapping.severity;
  }

  /**
   * Set locale for error messages
   */
  public setLocale(locale: string): void {
    this.locale = locale;
    logInfo('ErrorHandling: Locale updated', { locale });
  }

  /**
   * Register custom error mapping
   */
  public registerErrorMapping(code: string, mapping: Omit<ErrorMapping, 'code'>): void {
    this.errorMappings.set(code, { code, ...mapping });
    logInfo('ErrorHandling: Custom error mapping registered', { code });
  }

  // Private methods

  private initializeErrorMappings(): void {
    // Firebase Auth Errors
    this.registerFirebaseAuthErrors();
    
    // Network Errors
    this.registerNetworkErrors();
    
    // Validation Errors
    this.registerValidationErrors();
    
    // System Errors
    this.registerSystemErrors();
    
    // Business Logic Errors
    this.registerBusinessErrors();
  }

  private registerFirebaseAuthErrors(): void {
    const authErrors: Array<[string, Omit<ErrorMapping, 'code'>]> = [
      ['auth/user-not-found', {
        userMessage: 'No account found with this email address.',
        technicalMessage: 'User account does not exist',
        severity: 'medium',
        category: 'auth',
        retryable: false,
        recoveryActions: [
          { type: 'navigate', label: 'Create Account', action: '/sign-up', primary: true },
          { type: 'navigate', label: 'Try Different Email', action: '/sign-in' },
        ],
        localizationKey: 'auth.user_not_found',
      }],
      
      ['auth/wrong-password', {
        userMessage: 'Incorrect password. Please try again.',
        technicalMessage: 'Invalid password provided',
        severity: 'medium',
        category: 'auth',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Try Again', action: 'retry', primary: true },
          { type: 'navigate', label: 'Forgot Password?', action: '/forgot-password' },
        ],
        localizationKey: 'auth.wrong_password',
      }],
      
      ['auth/invalid-email', {
        userMessage: 'Please enter a valid email address.',
        technicalMessage: 'Email format is invalid',
        severity: 'low',
        category: 'validation',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Fix Email', action: 'retry', primary: true },
        ],
        localizationKey: 'auth.invalid_email',
      }],
      
      ['auth/email-already-in-use', {
        userMessage: 'An account with this email already exists.',
        technicalMessage: 'Email address is already registered',
        severity: 'medium',
        category: 'auth',
        retryable: false,
        recoveryActions: [
          { type: 'navigate', label: 'Sign In Instead', action: '/sign-in', primary: true },
          { type: 'navigate', label: 'Forgot Password?', action: '/forgot-password' },
        ],
        localizationKey: 'auth.email_already_in_use',
      }],
      
      ['auth/weak-password', {
        userMessage: 'Password is too weak. Please choose a stronger password.',
        technicalMessage: 'Password does not meet security requirements',
        severity: 'medium',
        category: 'validation',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Choose Stronger Password', action: 'retry', primary: true },
        ],
        localizationKey: 'auth.weak_password',
      }],
      
      ['auth/too-many-requests', {
        userMessage: 'Too many failed attempts. Please try again later.',
        technicalMessage: 'Rate limit exceeded for authentication attempts',
        severity: 'high',
        category: 'auth',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Try Again Later', action: 'retry' },
          { type: 'contact_support', label: 'Contact Support', action: 'support' },
        ],
        localizationKey: 'auth.too_many_requests',
      }],
      
      ['auth/user-disabled', {
        userMessage: 'This account has been disabled. Please contact support.',
        technicalMessage: 'User account is disabled',
        severity: 'high',
        category: 'auth',
        retryable: false,
        recoveryActions: [
          { type: 'contact_support', label: 'Contact Support', action: 'support', primary: true },
        ],
        localizationKey: 'auth.user_disabled',
      }],
      
      ['auth/requires-recent-login', {
        userMessage: 'Please sign in again to continue with this action.',
        technicalMessage: 'Recent authentication required for sensitive operation',
        severity: 'medium',
        category: 'auth',
        retryable: true,
        recoveryActions: [
          { type: 'navigate', label: 'Sign In Again', action: '/sign-in', primary: true },
        ],
        localizationKey: 'auth.requires_recent_login',
      }],
      
      ['auth/network-request-failed', {
        userMessage: 'Network error. Please check your connection and try again.',
        technicalMessage: 'Network request failed',
        severity: 'medium',
        category: 'network',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Try Again', action: 'retry', primary: true },
          { type: 'refresh', label: 'Refresh App', action: 'refresh' },
        ],
        localizationKey: 'auth.network_error',
      }],
    ];

    authErrors.forEach(([code, mapping]) => {
      this.errorMappings.set(code, { code, ...mapping });
    });
  }

  private registerNetworkErrors(): void {
    const networkErrors: Array<[string, Omit<ErrorMapping, 'code'>]> = [
      ['NETWORK_ERROR', {
        userMessage: 'Unable to connect. Please check your internet connection.',
        technicalMessage: 'Network connectivity issue',
        severity: 'medium',
        category: 'network',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Try Again', action: 'retry', primary: true },
          { type: 'refresh', label: 'Refresh', action: 'refresh' },
        ],
        localizationKey: 'network.connection_error',
      }],
      
      ['TIMEOUT_ERROR', {
        userMessage: 'Request timed out. Please try again.',
        technicalMessage: 'Request timeout exceeded',
        severity: 'medium',
        category: 'network',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Try Again', action: 'retry', primary: true },
        ],
        localizationKey: 'network.timeout',
      }],
      
      ['SERVER_ERROR', {
        userMessage: 'Server error. Please try again later.',
        technicalMessage: 'Internal server error',
        severity: 'high',
        category: 'system',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Try Again', action: 'retry' },
          { type: 'contact_support', label: 'Contact Support', action: 'support' },
        ],
        localizationKey: 'server.internal_error',
      }],
    ];

    networkErrors.forEach(([code, mapping]) => {
      this.errorMappings.set(code, { code, ...mapping });
    });
  }

  private registerValidationErrors(): void {
    const validationErrors: Array<[string, Omit<ErrorMapping, 'code'>]> = [
      ['VALIDATION_ERROR', {
        userMessage: 'Please check your input and try again.',
        technicalMessage: 'Input validation failed',
        severity: 'low',
        category: 'validation',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Fix Input', action: 'retry', primary: true },
        ],
        localizationKey: 'validation.generic_error',
      }],
      
      ['REQUIRED_FIELD', {
        userMessage: 'This field is required.',
        technicalMessage: 'Required field validation failed',
        severity: 'low',
        category: 'validation',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Fill Required Field', action: 'retry', primary: true },
        ],
        localizationKey: 'validation.required_field',
      }],
      
      ['INVALID_FORMAT', {
        userMessage: 'Please enter a valid format.',
        technicalMessage: 'Input format validation failed',
        severity: 'low',
        category: 'validation',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Fix Format', action: 'retry', primary: true },
        ],
        localizationKey: 'validation.invalid_format',
      }],
    ];

    validationErrors.forEach(([code, mapping]) => {
      this.errorMappings.set(code, { code, ...mapping });
    });
  }

  private registerSystemErrors(): void {
    const systemErrors: Array<[string, Omit<ErrorMapping, 'code'>]> = [
      ['UNKNOWN_ERROR', {
        userMessage: 'An unexpected error occurred. Please try again.',
        technicalMessage: 'Unknown system error',
        severity: 'medium',
        category: 'system',
        retryable: true,
        recoveryActions: [
          { type: 'retry', label: 'Try Again', action: 'retry', primary: true },
          { type: 'refresh', label: 'Refresh App', action: 'refresh' },
          { type: 'contact_support', label: 'Contact Support', action: 'support' },
        ],
        localizationKey: 'system.unknown_error',
      }],
      
      ['PERMISSION_DENIED', {
        userMessage: 'You don\'t have permission to perform this action.',
        technicalMessage: 'Insufficient permissions',
        severity: 'medium',
        category: 'auth',
        retryable: false,
        recoveryActions: [
          { type: 'navigate', label: 'Go Back', action: 'back', primary: true },
          { type: 'contact_support', label: 'Contact Support', action: 'support' },
        ],
        localizationKey: 'system.permission_denied',
      }],
    ];

    systemErrors.forEach(([code, mapping]) => {
      this.errorMappings.set(code, { code, ...mapping });
    });
  }

  private registerBusinessErrors(): void {
    const businessErrors: Array<[string, Omit<ErrorMapping, 'code'>]> = [
      ['ACCOUNT_SUSPENDED', {
        userMessage: 'Your account has been suspended. Please contact support.',
        technicalMessage: 'User account is suspended',
        severity: 'high',
        category: 'business',
        retryable: false,
        recoveryActions: [
          { type: 'contact_support', label: 'Contact Support', action: 'support', primary: true },
        ],
        localizationKey: 'business.account_suspended',
      }],
      
      ['SUBSCRIPTION_REQUIRED', {
        userMessage: 'This feature requires a subscription. Please upgrade your account.',
        technicalMessage: 'Feature requires active subscription',
        severity: 'medium',
        category: 'business',
        retryable: false,
        recoveryActions: [
          { type: 'navigate', label: 'Upgrade Account', action: '/subscription', primary: true },
          { type: 'navigate', label: 'Go Back', action: 'back' },
        ],
        localizationKey: 'business.subscription_required',
      }],
    ];

    businessErrors.forEach(([code, mapping]) => {
      this.errorMappings.set(code, { code, ...mapping });
    });
  }

  private extractErrorCode(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.code) {
      return error.code;
    }
    
    if (error?.message) {
      // Try to extract Firebase error codes from message
      const firebaseMatch = error.message.match(/\(([^)]+)\)/);
      if (firebaseMatch) {
        return firebaseMatch[1];
      }
    }
    
    if (error?.name) {
      return error.name;
    }
    
    return 'UNKNOWN_ERROR';
  }

  private getErrorMapping(code: string): ErrorMapping {
    const mapping = this.errorMappings.get(code);
    
    if (mapping) {
      return mapping;
    }
    
    // Default fallback mapping
    return {
      code,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: `Unmapped error: ${code}`,
      severity: 'medium',
      category: 'system',
      retryable: true,
      recoveryActions: [
        { type: 'retry', label: 'Try Again', action: 'retry', primary: true },
        { type: 'contact_support', label: 'Contact Support', action: 'support' },
      ],
    };
  }

  private localizeMessage(message: string, localizationKey?: string): string {
    // TODO: Implement actual localization
    // For now, return the default message
    return message;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logError(processedError: ProcessedError): Promise<void> {
    try {
      // Log to console/logging service
      logError('ErrorHandling: Processed error', processedError.originalError, {
        errorId: processedError.errorId,
        code: processedError.mapping.code,
        severity: processedError.mapping.severity,
        category: processedError.mapping.category,
        context: processedError.context,
      });

      // Log to audit service for security/auth errors
      if (processedError.mapping.category === 'auth' && processedError.mapping.severity !== 'low') {
        await auditLogService.logSecurityEvent({
          type: 'AUTH_ERROR',
          userId: processedError.context.userId,
          metadata: {
            errorId: processedError.errorId,
            errorCode: processedError.mapping.code,
            severity: processedError.mapping.severity,
            route: processedError.context.route,
            action: processedError.context.action,
          },
        });
      }
    } catch (loggingError) {
      console.error('ErrorHandling: Failed to log error', loggingError);
    }
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();