import { ValidationRule } from '../../types/onboarding'

/**
 * Validation utilities for onboarding forms
 * 
 * Features:
 * - Common validation rules and patterns
 * - Motivational error messages
 * - Age and date validation
 * - Email and text validation
 * - Custom validation functions
 */

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  name: /^[a-zA-Z\s\-'\.]+$/,
  schoolName: /^[a-zA-Z0-9\s\-'\.&]+$/,
  teamName: /^[a-zA-Z0-9\s\-'\.&]+$/,
} as const

// Motivational error messages
export const ValidationMessages = {
  required: "We need this info to personalize your experience",
  email: "Double-check that email format — we want to reach you!",
  minLength: (min: number) => `Just need ${min} more characters`,
  maxLength: (max: number) => `Keep it under ${max} characters`,
  age: {
    tooYoung: "You'll need a parent or guardian to help set up your account",
    tooOld: "That age doesn't look right — double-check your birth date",
    invalid: "Please enter a valid birth date"
  },
  graduationYear: "Pick your expected graduation year",
  name: "Names can only include letters, spaces, and common punctuation",
  school: "School names can include letters, numbers, and common punctuation",
  goals: {
    notEnough: "Pick 3 goals to track — they'll keep you motivated!",
    tooMany: "Choose your top 3 goals to stay focused"
  },
  consent: "We need your agreement to continue",
  guardianEmail: "We'll need to get permission from your parent or guardian"
} as const

// Age validation
export function validateAge(dateOfBirth: Date): { isValid: boolean; error?: string; age?: number } {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: ValidationMessages.age.invalid }
  }
  
  // Check if date is in the future
  if (birthDate > today) {
    return { isValid: false, error: ValidationMessages.age.invalid }
  }
  
  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  // Check age bounds for app usage
  if (age < 13) {
    return { isValid: false, error: ValidationMessages.age.tooYoung, age }
  }
  
  if (age > 25) {
    return { isValid: false, error: ValidationMessages.age.tooOld, age }
  }
  
  return { isValid: true, age }
}

// Email validation
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email.trim()) {
    return { isValid: false, error: ValidationMessages.required }
  }
  
  if (!ValidationPatterns.email.test(email)) {
    return { isValid: false, error: ValidationMessages.email }
  }
  
  return { isValid: true }
}

// Required field validation
export function validateRequired(value: any, fieldName?: string): { isValid: boolean; error?: string } {
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return { 
      isValid: false, 
      error: fieldName ? `${fieldName} is required` : ValidationMessages.required 
    }
  }
  
  return { isValid: true }
}

// Text length validation
export function validateLength(
  value: string, 
  min?: number, 
  max?: number
): { isValid: boolean; error?: string } {
  if (min && value.length < min) {
    return { isValid: false, error: ValidationMessages.minLength(min) }
  }
  
  if (max && value.length > max) {
    return { isValid: false, error: ValidationMessages.maxLength(max) }
  }
  
  return { isValid: true }
}

// Name validation (for person names)
export function validateName(name: string): { isValid: boolean; error?: string } {
  const requiredCheck = validateRequired(name)
  if (!requiredCheck.isValid) return requiredCheck
  
  const lengthCheck = validateLength(name, 2, 50)
  if (!lengthCheck.isValid) return lengthCheck
  
  if (!ValidationPatterns.name.test(name)) {
    return { isValid: false, error: ValidationMessages.name }
  }
  
  return { isValid: true }
}

// School/organization name validation
export function validateSchoolName(name: string): { isValid: boolean; error?: string } {
  const requiredCheck = validateRequired(name)
  if (!requiredCheck.isValid) return requiredCheck
  
  const lengthCheck = validateLength(name, 2, 100)
  if (!lengthCheck.isValid) return lengthCheck
  
  if (!ValidationPatterns.schoolName.test(name)) {
    return { isValid: false, error: ValidationMessages.school }
  }
  
  return { isValid: true }
}

// Goals validation (exactly 3 required)
export function validateGoals(goals: string[]): { isValid: boolean; error?: string } {
  if (goals.length < 3) {
    return { isValid: false, error: ValidationMessages.goals.notEnough }
  }
  
  if (goals.length > 3) {
    return { isValid: false, error: ValidationMessages.goals.tooMany }
  }
  
  return { isValid: true }
}

// Graduation year validation
export function validateGraduationYear(year: number): { isValid: boolean; error?: string } {
  const currentYear = new Date().getFullYear()
  const validYears = [2025, 2026, 2027, 2028, 2029]
  
  if (!validYears.includes(year)) {
    return { isValid: false, error: ValidationMessages.graduationYear }
  }
  
  return { isValid: true }
}

// Guardian email validation (for minors)
export function validateGuardianEmail(email: string, userAge: number): { isValid: boolean; error?: string } {
  // Only required for users 13-15
  if (userAge >= 16) {
    return { isValid: true }
  }
  
  if (!email.trim()) {
    return { isValid: false, error: ValidationMessages.guardianEmail }
  }
  
  return validateEmail(email)
}

// Generic field validation using rules
export function validateField(value: any, rules: ValidationRule[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const rule of rules) {
    // Required validation
    if (rule.required) {
      const result = validateRequired(value, rule.field)
      if (!result.isValid && result.error) {
        errors.push(result.error)
        continue // Skip other validations if required fails
      }
    }
    
    // Skip other validations if value is empty and not required
    if (!rule.required && (!value || value === '')) {
      continue
    }
    
    // Length validations
    if (typeof value === 'string') {
      if (rule.minLength) {
        const result = validateLength(value, rule.minLength)
        if (!result.isValid && result.error) {
          errors.push(result.error)
        }
      }
      
      if (rule.maxLength) {
        const result = validateLength(value, undefined, rule.maxLength)
        if (!result.isValid && result.error) {
          errors.push(result.error)
        }
      }
      
      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`)
      }
    }
    
    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) {
        errors.push(customError)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Step-specific validation functions
export const StepValidators = {
  // Step 1: Role Selection
  role: (role: string) => validateRequired(role, 'Role'),
  
  // Step 2: Sport & Demographics
  sport: (sport: string) => validateRequired(sport, 'Sport'),
  gender: (gender: string) => validateRequired(gender, 'Gender'),
  dateOfBirth: validateAge,
  graduationYear: validateGraduationYear,
  
  // Step 3: Position & Level
  position: (position: string) => validateRequired(position, 'Position'),
  academicLevel: (level: string) => validateRequired(level, 'Academic level'),
  
  // Step 4: Team Details
  teamType: (type: string) => validateRequired(type, 'Team type'),
  schoolName: validateSchoolName,
  schoolCity: (city: string) => validateName(city),
  schoolState: (state: string) => validateRequired(state, 'State'),
  
  // Step 5: Goals
  goals: validateGoals,
  
  // Step 6: AthleteDNA (all questions required)
  dnaQuestion: (answer: string, questionName: string) => 
    validateRequired(answer, questionName),
  
  // Step 7: AI Tone
  aiTone: (tone: string) => validateRequired(tone, 'AI tone preference'),
  
  // Step 8: Age Verification
  guardianEmail: validateGuardianEmail,
  
  // Step 9: Legal Consent
  tosAccepted: (accepted: boolean) => 
    accepted ? { isValid: true } : { isValid: false, error: ValidationMessages.consent },
  privacyAccepted: (accepted: boolean) => 
    accepted ? { isValid: true } : { isValid: false, error: ValidationMessages.consent },
  
  // Account Creation
  email: validateEmail,
  password: (password: string) => {
    const requiredCheck = validateRequired(password, 'Password')
    if (!requiredCheck.isValid) return requiredCheck
    
    const lengthCheck = validateLength(password, 8, 128)
    if (!lengthCheck.isValid) return lengthCheck
    
    // Check for at least one number and one letter
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return { 
        isValid: false, 
        error: 'Password needs at least one letter and one number' 
      }
    }
    
    return { isValid: true }
  }
} as const