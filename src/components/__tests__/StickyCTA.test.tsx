/**
 * StickyCTA Component Tests
 * 
 * Basic functionality tests for the StickyCTA component
 */

import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StickyCTA } from '../StickyCTA';

describe('StickyCTA Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders primary button correctly', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress}>
        Primary Button
      </StickyCTA>
    );

    expect(screen.getByText('Primary Button')).toBeTruthy();
  });

  it('renders secondary button correctly', () => {
    render(
      <StickyCTA variant="secondary" onPress={mockOnPress}>
        Secondary Button
      </StickyCTA>
    );

    expect(screen.getByText('Secondary Button')).toBeTruthy();
  });

  it('renders FAB button correctly', () => {
    render(
      <StickyCTA variant="fab" onPress={mockOnPress}>
        <Text>+</Text>
      </StickyCTA>
    );

    expect(screen.getByText('+')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress}>
        Test Button
      </StickyCTA>
    );

    fireEvent.press(screen.getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress} disabled={true}>
        Disabled Button
      </StickyCTA>
    );

    fireEvent.press(screen.getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress} loading={true}>
        Loading Button
      </StickyCTA>
    );

    fireEvent.press(screen.getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('has correct accessibility role', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress}>
        Accessible Button
      </StickyCTA>
    );

    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('applies custom testID', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress} testID="custom-cta">
        Test Button
      </StickyCTA>
    );

    expect(screen.getByTestId('custom-cta')).toBeTruthy();
  });

  it('has correct accessibility state when disabled', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress} disabled={true}>
        Disabled Button
      </StickyCTA>
    );

    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('has correct accessibility state when loading', () => {
    render(
      <StickyCTA variant="primary" onPress={mockOnPress} loading={true}>
        Loading Button
      </StickyCTA>
    );

    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.busy).toBe(true);
  });
});