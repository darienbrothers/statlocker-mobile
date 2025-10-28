/**
 * Validation Utilities
 * 
 * Email and password validation functions with comprehensive rules
 * and user-friendly feedback
 */

import { EmailValidation, PasswordStrength, PasswordValidationRules } from '@/types/auth';

/**
 * Default password validation rules
 */
export const DEFAULT_PASSWORD_RULES: PasswordValidationRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  forbiddenPatterns: [
    'password',
    '123456',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
  ],
};

/**
 * Email validation regex
 * Based on RFC 5322 specification with practical considerations
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Common email domain typos and their corrections
 */
const EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
};

/**
 * Validate email address
 */
export function validateEmail(email: string): EmailValidation {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Basic format validation
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  if (!EMAIL_REGEX.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Length validation
  if (email.length > 254) {
    errors.push('Email address is too long');
  }

  // Check for common typos
  const domain = email.split('@')[1];
  if (domain && EMAIL_DOMAIN_CORRECTIONS[domain.toLowerCase()]) {
    const correctedEmail = email.replace(domain, EMAIL_DOMAIN_CORRECTIONS[domain.toLowerCase()]);
    suggestions.push(`Did you mean ${correctedEmail}?`);
  }

  // Check for multiple @ symbols
  if ((email.match(/@/g) || []).length !== 1) {
    errors.push('Email address must contain exactly one @ symbol');
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    errors.push('Email address cannot contain consecutive dots');
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Assess password strength
 */
export function assessPasswordStrength(
  password: string,
  rules: PasswordValidationRules = DEFAULT_PASSWORD_RULES
): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check requirements
  const requirements = {
    length: password.length >= rules.minLength,
    uppercase: rules.requireUppercase ? /[A-Z]/.test(password) : true,
    lowercase: rules.requireLowercase ? /[a-z]/.test(password) : true,
    numbers: rules.requireNumbers ? /\d/.test(password) : true,
    specialChars: rules.requireSpecialChars ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) : true,
  };

  // Length scoring
  if (password.length >= rules.minLength) {
    score += 1;
  } else {
    feedback.push(`Password must be at least ${rules.minLength} characters long`);
  }

  // Character variety scoring
  if (requirements.uppercase) score += 0.5;
  else if (rules.requireUppercase) feedback.push('Add uppercase letters');

  if (requirements.lowercase) score += 0.5;
  else if (rules.requireLowercase) feedback.push('Add lowercase letters');

  if (requirements.numbers) score += 0.5;
  else if (rules.requireNumbers) feedback.push('Add numbers');

  if (requirements.specialChars) score += 0.5;
  else if (rules.requireSpecialChars) feedback.push('Add special characters');

  // Additional strength factors
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;

  // Check for common patterns
  const lowerPassword = password.toLowerCase();
  
  // Check forbidden patterns
  for (const pattern of rules.forbiddenPatterns) {
    if (lowerPassword.includes(pattern.toLowerCase())) {
      score -= 1;
      feedback.push(`Avoid common words like "${pattern}"`);
      break;
    }
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repeating characters');
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    score -= 0.5;
    feedback.push('Avoid sequential characters');
  }

  // Normalize score to 0-4 range
  score = Math.max(0, Math.min(4, score));

  // Generate strength feedback
  if (score >= 4) {
    feedback.unshift('Very strong password!');
  } else if (score >= 3) {
    feedback.unshift('Strong password');
  } else if (score >= 2) {
    feedback.unshift('Moderate password');
  } else if (score >= 1) {
    feedback.unshift('Weak password');
  } else {
    feedback.unshift('Very weak password');
  }

  const isValid = Object.values(requirements).every(req => req) && score >= 2;

  return {
    score: Math.round(score),
    feedback,
    isValid,
    requirements,
  };
}

/**
 * Check for sequential characters (abc, 123, etc.)
 */
function hasSequentialChars(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'qwertyuiopasdfghjklzxcvbnm',
    '0123456789',
  ];

  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const subseq = sequence.substring(i, i + 3);
      if (password.toLowerCase().includes(subseq)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(password: string, confirmation: string): string[] {
  const errors: string[] = [];

  if (!confirmation) {
    errors.push('Please confirm your password');
  } else if (password !== confirmation) {
    errors.push('Passwords do not match');
  }

  return errors;
}

/**
 * Comprehensive form validation
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  suggestions: Record<string, string[]>;
}

/**
 * Validate sign-up form
 */
export function validateSignUpForm(
  email: string,
  password: string,
  confirmPassword: string,
  rules?: PasswordValidationRules
): FormValidationResult {
  const errors: Record<string, string[]> = {};
  const suggestions: Record<string, string[]> = {};

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
  }
  if (emailValidation.suggestions) {
    suggestions.email = emailValidation.suggestions;
  }

  // Validate password
  const passwordStrength = assessPasswordStrength(password, rules);
  if (!passwordStrength.isValid) {
    errors.password = passwordStrength.feedback.filter(f => !f.includes('password'));
  }

  // Validate password confirmation
  const confirmationErrors = validatePasswordConfirmation(password, confirmPassword);
  if (confirmationErrors.length > 0) {
    errors.confirmPassword = confirmationErrors;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    suggestions,
  };
}

/**
 * Validate sign-in form
 */
export function validateSignInForm(email: string, password: string): FormValidationResult {
  const errors: Record<string, string[]> = {};
  const suggestions: Record<string, string[]> = {};

  // Basic email validation (less strict for sign-in)
  if (!email) {
    errors.email = ['Email is required'];
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = ['Please enter a valid email address'];
  }

  // Basic password validation
  if (!password) {
    errors.password = ['Password is required'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    suggestions,
  };
}

/**
 * Validate password reset form
 */
export function validatePasswordResetForm(email: string): FormValidationResult {
  const errors: Record<string, string[]> = {};
  const suggestions: Record<string, string[]> = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
  }
  if (emailValidation.suggestions) {
    suggestions.email = emailValidation.suggestions;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    suggestions,
  };
}