/**
 * FormInput Component Tests
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { FormInput } from '../FormInput'
import { TouchableOpacity } from 'react-native'

// Mock dependencies
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Error: 'error',
    Success: 'success',
  },
}))

jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((value) => value),
  withTiming: jest.fn((value) => value),
}))

describe('FormInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders input with label correctly', () => {
    render(<FormInput label="Test Label" />)
    
    expect(screen.getByText('Test Label')).toBeTruthy()
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('shows required indicator when required is true', () => {
    render(<FormInput label="Required Field" required={true} />)
    
    expect(screen.getByText('Required Field')).toBeTruthy()
    expect(screen.getByText('*')).toBeTruthy()
  })

  it('displays error message when error is provided', () => {
    render(<FormInput label="Test" error="This field is required" />)
    
    expect(screen.getByText('This field is required')).toBeTruthy()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('displays success message when success is true', () => {
    render(<FormInput label="Test" success={true} />)
    
    expect(screen.getByText('✓ Looking good!')).toBeTruthy()
  })

  it('displays hint text when provided', () => {
    render(<FormInput label="Test" hint="Enter your email address" />)
    
    expect(screen.getByText('Enter your email address')).toBeTruthy()
  })

  it('handles focus and blur events', () => {
    const mockFocus = jest.fn()
    const mockBlur = jest.fn()
    
    render(
      <FormInput 
        label="Test" 
        onFocus={mockFocus}
        onBlur={mockBlur}
      />
    )
    
    const input = screen.getByRole('textbox')
    
    fireEvent(input, 'focus')
    expect(mockFocus).toHaveBeenCalledTimes(1)
    
    fireEvent(input, 'blur')
    expect(mockBlur).toHaveBeenCalledTimes(1)
  })

  it('renders left icon when provided', () => {
    const LeftIcon = () => <TouchableOpacity testID="left-icon" />
    
    render(<FormInput label="Test" leftIcon={<LeftIcon />} />)
    
    expect(screen.getByTestId('left-icon')).toBeTruthy()
  })

  it('renders right icon with press handler', () => {
    const mockPress = jest.fn()
    const RightIcon = () => <TouchableOpacity testID="right-icon" />
    
    render(
      <FormInput 
        label="Test" 
        rightIcon={<RightIcon />}
        onRightIconPress={mockPress}
      />
    )
    
    const rightIconButton = screen.getByRole('button', { name: 'Input action' })
    fireEvent.press(rightIconButton)
    
    expect(mockPress).toHaveBeenCalledTimes(1)
  })

  it('applies accessibility labels correctly', () => {
    render(
      <FormInput 
        label="Email Address" 
        hint="Enter your email"
        required={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAccessibilityLabel('Email Address')
    expect(input).toHaveAccessibilityHint('Enter your email')
    expect(input).toHaveAccessibilityRequired(true)
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<any>()
    
    render(<FormInput ref={ref} label="Test" />)
    
    expect(ref.current).toBeTruthy()
  })

  it('passes through TextInput props', () => {
    render(
      <FormInput 
        label="Test"
        placeholder="Enter text"
        value="test value"
        multiline={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input.props.placeholder).toBe('Enter text')
    expect(input.props.value).toBe('test value')
    expect(input.props.multiline).toBe(true)
  })

  it('prioritizes error over success state', () => {
    render(
      <FormInput 
        label="Test" 
        error="Error message"
        success={true}
      />
    )
    
    expect(screen.getByText('Error message')).toBeTruthy()
    expect(screen.queryByText('✓ Looking good!')).toBeFalsy()
  })

  it('prioritizes error over hint text', () => {
    render(
      <FormInput 
        label="Test" 
        error="Error message"
        hint="Hint text"
      />
    )
    
    expect(screen.getByText('Error message')).toBeTruthy()
    expect(screen.queryByText('Hint text')).toBeFalsy()
  })

  it('shows hint when no error or success', () => {
    render(
      <FormInput 
        label="Test" 
        hint="Hint text"
      />
    )
    
    expect(screen.getByText('Hint text')).toBeTruthy()
  })

  it('handles empty label gracefully', () => {
    render(<FormInput label="" />)
    
    expect(screen.getByRole('textbox')).toBeTruthy()
  })
})