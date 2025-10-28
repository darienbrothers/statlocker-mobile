/**
 * SelectionCard Component Tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { SelectionCard } from '../SelectionCard'
import { TouchableOpacity } from 'react-native'

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}))

jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((value) => value),
  withTiming: jest.fn((value) => value),
}))

describe('SelectionCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders card with title correctly', () => {
    render(<SelectionCard title="Test Card" />)
    
    expect(screen.getByText('Test Card')).toBeTruthy()
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        description="This is a description"
      />
    )
    
    expect(screen.getByText('This is a description')).toBeTruthy()
  })

  it('renders icon when provided', () => {
    const TestIcon = () => <TouchableOpacity testID="test-icon" />
    
    render(
      <SelectionCard 
        title="Test Card" 
        icon={<TestIcon />}
      />
    )
    
    expect(screen.getByTestId('test-icon')).toBeTruthy()
  })

  it('renders badge when provided', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        badge="Popular"
      />
    )
    
    expect(screen.getByText('Popular')).toBeTruthy()
  })

  it('shows motivational text when selected', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        selected={true}
        motivationalText="Great choice!"
      />
    )
    
    expect(screen.getByText('Great choice!')).toBeTruthy()
  })

  it('hides motivational text when not selected', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        selected={false}
        motivationalText="Great choice!"
      />
    )
    
    expect(screen.queryByText('Great choice!')).toBeFalsy()
  })

  it('handles press events', async () => {
    const mockPress = jest.fn()
    
    render(
      <SelectionCard 
        title="Test Card" 
        onPress={mockPress}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.press(button)
    
    await waitFor(() => {
      expect(mockPress).toHaveBeenCalledTimes(1)
    })
  })

  it('prevents press when disabled', () => {
    const mockPress = jest.fn()
    
    render(
      <SelectionCard 
        title="Test Card" 
        disabled={true}
        onPress={mockPress}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.press(button)
    
    expect(mockPress).not.toHaveBeenCalled()
  })

  it('applies correct accessibility states', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        description="Card description"
        selected={true}
        disabled={false}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAccessibilityLabel('Test Card. Card description')
    expect(button).toHaveAccessibilityHint('Selected')
    expect(button).toHaveAccessibilityState({ selected: true, disabled: false })
  })

  it('shows correct accessibility hint for unselected card', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        selected={false}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAccessibilityHint('Tap to select')
  })

  it('handles disabled accessibility state', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        disabled={true}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAccessibilityState({ selected: false, disabled: true })
  })

  it('renders large variant correctly', () => {
    render(
      <SelectionCard 
        title="Large Card" 
        variant="large"
      />
    )
    
    expect(screen.getByText('Large Card')).toBeTruthy()
  })

  it('renders compact variant correctly', () => {
    render(
      <SelectionCard 
        title="Compact Card" 
        variant="compact"
      />
    )
    
    expect(screen.getByText('Compact Card')).toBeTruthy()
  })

  it('handles press in and press out events', () => {
    render(<SelectionCard title="Test Card" />)
    
    const button = screen.getByRole('button')
    
    fireEvent(button, 'pressIn')
    fireEvent(button, 'pressOut')
    
    // Should not throw errors
    expect(button).toBeTruthy()
  })

  it('shows selection indicator correctly', () => {
    const { rerender } = render(
      <SelectionCard 
        title="Test Card" 
        selected={false}
      />
    )
    
    // Test unselected state
    expect(screen.getByRole('button')).toBeTruthy()
    
    // Test selected state
    rerender(
      <SelectionCard 
        title="Test Card" 
        selected={true}
      />
    )
    
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('handles image prop correctly', () => {
    render(
      <SelectionCard 
        title="Test Card" 
        image="https://example.com/image.jpg"
      />
    )
    
    // Image should be rendered (we can't easily test the Image component)
    expect(screen.getByText('Test Card')).toBeTruthy()
  })
})