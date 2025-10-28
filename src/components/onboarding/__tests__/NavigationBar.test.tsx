/**
 * NavigationBar Component Tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { NavigationBar } from '../NavigationBar'

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Error: 'error',
  },
}))

jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((value, config, callback) => {
    if (callback) callback()
    return value
  }),
  withTiming: jest.fn((value) => value),
}))

// Mock the onboarding store
const mockStore = {
  validateStep: jest.fn(() => true),
  canNavigateToStep: jest.fn(() => true),
}

jest.mock('@/src/stores/onboardingStore', () => ({
  useOnboardingStore: jest.fn(() => mockStore),
}))

describe('NavigationBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation buttons correctly', () => {
    const mockNext = jest.fn()
    const mockBack = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        onBack={mockBack}
        showBack={true}
      />
    )
    
    expect(screen.getByRole('button', { name: /back/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /continue/i })).toBeTruthy()
  })

  it('hides back button when showBack is false', () => {
    const mockNext = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        showBack={false}
      />
    )
    
    expect(screen.queryByRole('button', { name: /back/i })).toBeFalsy()
    expect(screen.getByRole('button', { name: /continue/i })).toBeTruthy()
  })

  it('handles next button press with validation', async () => {
    const mockNext = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        stepNumber={2}
      />
    )
    
    const nextButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.press(nextButton)
    
    await waitFor(() => {
      expect(mockStore.validateStep).toHaveBeenCalledWith(2)
      expect(mockNext).toHaveBeenCalledTimes(1)
    })
  })

  it('handles back button press', async () => {
    const mockBack = jest.fn()
    
    render(
      <NavigationBar 
        onBack={mockBack}
        showBack={true}
      />
    )
    
    const backButton = screen.getByRole('button', { name: /back/i })
    fireEvent.press(backButton)
    
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })

  it('disables next button when nextDisabled is true', () => {
    const mockNext = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        nextDisabled={true}
      />
    )
    
    const nextButton = screen.getByRole('button', { name: /complete required fields/i })
    expect(nextButton).toHaveAccessibilityState({ disabled: true })
    
    fireEvent.press(nextButton)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('shows validation errors in button text', () => {
    const mockNext = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        validationErrors={['Field is required']}
        nextDisabled={false}
      />
    )
    
    expect(screen.getByText('Fix Errors')).toBeTruthy()
  })

  it('uses custom button text when provided', () => {
    const mockNext = jest.fn()
    const mockBack = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        onBack={mockBack}
        nextText="Finish"
        backText="Previous"
        showBack={true}
      />
    )
    
    expect(screen.getByText('Finish')).toBeTruthy()
    expect(screen.getByText('Previous')).toBeTruthy()
  })

  it('prevents navigation when validation fails', async () => {
    const mockNext = jest.fn()
    mockStore.validateStep.mockReturnValue(false)
    
    render(
      <NavigationBar 
        onNext={mockNext}
        stepNumber={2}
      />
    )
    
    const nextButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.press(nextButton)
    
    await waitFor(() => {
      expect(mockStore.validateStep).toHaveBeenCalledWith(2)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  it('handles navigation without step validation', async () => {
    const mockNext = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        // No stepNumber provided
      />
    )
    
    const nextButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.press(nextButton)
    
    await waitFor(() => {
      expect(mockNext).toHaveBeenCalledTimes(1)
    })
  })

  it('applies correct accessibility labels', () => {
    const mockNext = jest.fn()
    const mockBack = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        onBack={mockBack}
        showBack={true}
      />
    )
    
    const backButton = screen.getByRole('button', { name: /go back to previous step/i })
    const nextButton = screen.getByRole('button', { name: /continue to next step/i })
    
    expect(backButton).toHaveAccessibilityHint('Navigate to the previous onboarding step')
    expect(nextButton).toHaveAccessibilityHint('Navigate to the next onboarding step')
  })

  it('shows appropriate accessibility hint for disabled state', () => {
    const mockNext = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        nextDisabled={true}
      />
    )
    
    const nextButton = screen.getByRole('button')
    expect(nextButton).toHaveAccessibilityHint('Fill out all required information first')
  })

  it('maintains layout with spacer when back button is hidden', () => {
    const mockNext = jest.fn()
    
    render(
      <NavigationBar 
        onNext={mockNext}
        showBack={false}
      />
    )
    
    // Should still render the container properly
    expect(screen.getByRole('button', { name: /continue/i })).toBeTruthy()
  })
})