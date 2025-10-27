/**
 * Button Component Tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

describe('Button Component', () => {
  it('renders primary variant correctly', () => {
    render(<Button variant="primary">Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('renders secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(screen.getByText('Secondary Button')).toBeTruthy();
  });

  it('renders ghost variant correctly', () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(screen.getByText('Ghost Button')).toBeTruthy();
  });

  it('handles press events', () => {
    const mockPress = jest.fn();
    render(<Button onPress={mockPress}>Press Me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.press(button);
    
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibilityState({ busy: true });
    
    // Button should be disabled when loading
    expect(button).toBeDisabled();
  });

  it('handles disabled state correctly', () => {
    const mockPress = jest.fn();
    render(<Button disabled onPress={mockPress}>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibilityState({ disabled: true });
    
    fireEvent.press(button);
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('prevents press when loading', () => {
    const mockPress = jest.fn();
    render(<Button loading onPress={mockPress}>Loading Button</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.press(button);
    
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('applies custom testID', () => {
    render(<Button testID="custom-button">Test</Button>);
    expect(screen.getByTestId('custom-button')).toBeTruthy();
  });

  it('applies custom accessibility label', () => {
    render(<Button accessibilityLabel="Custom Label">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibilityLabel('Custom Label');
  });

  it('uses text content as accessibility label when no custom label provided', () => {
    render(<Button>Button Text</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibilityLabel('Button Text');
  });

  it('handles large size variant', () => {
    render(<Button size="large">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });

  it('handles fullWidth prop', () => {
    render(<Button fullWidth={false}>Not Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });

  it('renders with custom children (non-string)', () => {
    render(
      <Button>
        <Button>Nested Content</Button>
      </Button>
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('handles press in and press out events', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button');
    
    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');
    
    // Should not throw errors
    expect(button).toBeTruthy();
  });
});