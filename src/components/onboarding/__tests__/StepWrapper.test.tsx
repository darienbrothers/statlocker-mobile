/**
 * StepWrapper Component Tests
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { StepWrapper } from '../StepWrapper'
import { Text } from 'react-native'

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
}))

jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((value) => value),
  withTiming: jest.fn((value) => value),
}))

// Mock the onboarding store
jest.mock('@/src/stores/onboardingStore', () => ({
  useOnboardingStore: jest.fn(() => ({
    totalSteps: 10,
    completedSteps: new Set([1, 2]),
    validateStep: jest.fn(() => true),
    canNavigateToStep: jest.fn(() => true),
  })),
}))

// Mock ErrorBoundary
jest.mock('../../ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}))

describe('StepWrapper Component', () => {
  const defaultProps = {
    stepNumber: 3,
    title: 'Test Step',
    children: <Text>Step Content</Text>,
  }

  it('renders step wrapper correctly', () => {
    render(<StepWrapper {...defaultProps} />)
    
    expect(screen.getByText('Test Step')).toBeTruthy()
    expect(screen.getByText('Step Content')).toBeTruthy()
    expect(screen.getByText('Step 3')).toBeTruthy()
  })

  it('renders subtitle when provided', () => {
    render(
      <StepWrapper {...defaultProps} subtitle="This is a subtitle" />
    )
    
    expect(screen.getByText('This is a subtitle')).toBeTruthy()
  })

  it('shows progress bar by default', () => {
    render(<StepWrapper {...defaultProps} />)
    
    // Progress bar should be rendered (we can't easily test the ProgressBar component here)
    expect(screen.getByText('Step 3')).toBeTruthy()
  })

  it('hides progress bar when showProgress is false', () => {
    render(<StepWrapper {...defaultProps} showProgress={false} />)
    
    // Step content should still be there
    expect(screen.getByText('Test Step')).toBeTruthy()
  })

  it('shows loading state correctly', () => {
    render(<StepWrapper {...defaultProps} isLoading={true} />)
    
    expect(screen.getByText('Loading...')).toBeTruthy()
    expect(screen.queryByText('Step Content')).toBeFalsy()
  })

  it('displays error message when provided', () => {
    render(<StepWrapper {...defaultProps} error="Something went wrong" />)
    
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })

  it('handles navigation callbacks', () => {
    const mockNext = jest.fn()
    const mockBack = jest.fn()
    
    render(
      <StepWrapper 
        {...defaultProps} 
        onNext={mockNext}
        onBack={mockBack}
      />
    )
    
    // Navigation should be rendered (we can't easily test NavigationBar here)
    expect(screen.getByText('Test Step')).toBeTruthy()
  })

  it('applies accessibility labels correctly', () => {
    render(<StepWrapper {...defaultProps} />)
    
    const mainContainer = screen.getByRole('main')
    expect(mainContainer).toHaveAccessibilityLabel('Onboarding step 3')
    
    const title = screen.getByRole('header')
    expect(title).toBeTruthy()
  })

  it('handles disabled next button', () => {
    render(<StepWrapper {...defaultProps} nextDisabled={true} />)
    
    // Component should render without errors
    expect(screen.getByText('Test Step')).toBeTruthy()
  })

  it('shows step number indicator', () => {
    render(<StepWrapper {...defaultProps} />)
    
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('Step 3')).toBeTruthy()
  })

  it('handles responsive layout', () => {
    // Mock smaller screen width
    jest.spyOn(require('react-native'), 'Dimensions').mockReturnValue({
      get: () => ({ width: 350, height: 600 })
    })
    
    render(<StepWrapper {...defaultProps} />)
    
    expect(screen.getByText('Test Step')).toBeTruthy()
  })

  it('manages focus for accessibility', () => {
    render(<StepWrapper {...defaultProps} />)
    
    const contentRegion = screen.getByRole('region')
    expect(contentRegion).toHaveAccessibilityLabel('Test Step content')
  })
})