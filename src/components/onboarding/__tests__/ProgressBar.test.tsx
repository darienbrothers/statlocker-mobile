/**
 * ProgressBar Component Tests
 */
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ProgressBar } from '../ProgressBar'

// Mock dependencies
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((value) => value),
  withTiming: jest.fn((value) => value),
  runOnJS: jest.fn((fn) => fn),
}))

// Mock the onboarding store
const mockStore = {
  totalSteps: 10,
  completedSteps: new Set([1, 2, 3]),
}

jest.mock('@/src/stores/onboardingStore', () => ({
  useOnboardingStore: jest.fn(() => mockStore),
}))

describe('ProgressBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders progress bar correctly', () => {
    render(<ProgressBar currentStep={4} />)
    
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('displays correct progress text', () => {
    render(<ProgressBar currentStep={4} />)
    
    expect(screen.getByText('Step 4 of 10')).toBeTruthy()
    expect(screen.getByText('40% complete')).toBeTruthy()
  })

  it('shows motivational message based on progress', () => {
    // Test early progress
    render(<ProgressBar currentStep={2} />)
    expect(screen.getByText("Just getting started — you've got this!")).toBeTruthy()
  })

  it('shows different motivational messages for different progress levels', () => {
    const { rerender } = render(<ProgressBar currentStep={5} />)
    expect(screen.getByText("Great progress — keep it up!")).toBeTruthy()
    
    rerender(<ProgressBar currentStep={8} />)
    expect(screen.getByText("You're more than halfway there!")).toBeTruthy()
    
    rerender(<ProgressBar currentStep={9} />)
    expect(screen.getByText("Almost done — finish strong!")).toBeTruthy()
    
    rerender(<ProgressBar currentStep={10} />)
    expect(screen.getByText("You're ready to enter the Locker!")).toBeTruthy()
  })

  it('hides motivational text when showMotivationalText is false', () => {
    render(<ProgressBar currentStep={4} showMotivationalText={false} />)
    
    expect(screen.queryByText("Great progress — keep it up!")).toBeFalsy()
  })

  it('applies custom accessibility label', () => {
    render(<ProgressBar currentStep={4} accessibilityLabel="Custom progress label" />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAccessibilityLabel('Custom progress label')
  })

  it('uses default accessibility label when none provided', () => {
    render(<ProgressBar currentStep={4} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAccessibilityLabel('Progress: 3 of 10 steps completed')
  })

  it('renders step indicators with correct states', () => {
    render(<ProgressBar currentStep={4} />)
    
    // Should render step indicators for each step
    // We can't easily test the visual state, but we can test that they render
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('handles edge case of step 1', () => {
    render(<ProgressBar currentStep={1} />)
    
    expect(screen.getByText('Step 1 of 10')).toBeTruthy()
    expect(screen.getByText('10% complete')).toBeTruthy()
  })

  it('handles edge case of final step', () => {
    render(<ProgressBar currentStep={10} />)
    
    expect(screen.getByText('Step 10 of 10')).toBeTruthy()
    expect(screen.getByText('100% complete')).toBeTruthy()
  })

  it('updates when completed steps change', () => {
    const { rerender } = render(<ProgressBar currentStep={4} />)
    
    // Update the mock store
    mockStore.completedSteps = new Set([1, 2, 3, 4, 5])
    
    rerender(<ProgressBar currentStep={6} />)
    
    expect(screen.getByText('Step 6 of 10')).toBeTruthy()
  })

  it('handles accessibility value correctly', () => {
    render(<ProgressBar currentStep={4} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAccessibilityValue({
      min: 0,
      max: 10,
      now: 3, // completed steps count
    })
  })

  it('renders only linear variant', () => {
    render(<ProgressBar currentStep={4} variant="linear" />)
    
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('returns null for circular variant', () => {
    const { container } = render(<ProgressBar currentStep={4} variant="circular" />)
    
    // Circular variant should return null for now
    expect(container.children).toHaveLength(0)
  })
})